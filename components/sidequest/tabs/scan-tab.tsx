import { CameraView } from '@/components/sidequest/scan/camera-view';
import { ItemEditorView } from '@/components/sidequest/scan/item-editor-view';
import { SummaryView } from '@/components/sidequest/scan/summary-view';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { useHouseholdStore } from '@/lib/household-store';
import { debtService, shoppingService, transactionService } from '@/lib/services';
import type { ShoppingItem } from '@/lib/types';
import { getDisplayName } from '@/lib/utils/display-name';
import { buildReceiptFromLines, type ReceiptItem } from '@/lib/utils/receipt-parser';
import * as ReceiptProcessor from '../../../modules/receipt-processor';
import { CameraView as ExpoCameraView } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { WifiOff } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TextRecognition from 'react-native-text-recognition';

type Roommate = {
  id: string;
  name: string;
  initial: string;
  color: string;
  venmo: string | null;
};

type ScanState = 'idle' | 'processing' | 'itemizing' | 'summary';

export function ScanTab() {
  const insets = useSafeAreaInsets();
  const iosMajorVersion = Platform.OS === 'ios' ? Number.parseInt(String(Platform.Version), 10) : null;
  const tabBarClearance = Platform.OS !== 'ios' || (iosMajorVersion != null && iosMajorVersion >= 26) ? 88 : 0;

  const { isOffline } = useNetworkStatus();

  const [scanState, setScanState] = useState<ScanState>('itemizing');
  const cameraRef = useRef<ExpoCameraView | null>(null);

  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [splitSelection, setSplitSelection] = useState<Set<string>>(new Set());
  const [isPosting, setIsPosting] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [bountyMatches, setBountyMatches] = useState<{
    receiptItem: ReceiptItem;
    shoppingItem: ShoppingItem;
    confirmed: boolean | null;
  }[]>([]);
  const [addedShoppingItemIds, setAddedShoppingItemIds] = useState<Set<string>>(new Set());
  const [pendingShoppingMatches, setPendingShoppingMatches] = useState<{
    receiptItem: ReceiptItem;
    shoppingItem: ShoppingItem;
    isExact: boolean;
    confirmed: boolean;
  }[]>([]);
  const [showMatchConfirmation, setShowMatchConfirmation] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const householdId = useHouseholdStore((state) => state.householdId);
  const members = useHouseholdStore((state) => state.members);
  const { user } = useSupabaseUser();



  const roommates = useMemo<Roommate[]>(() => {
    const palette = ['#0F8', '#8b5cf6', '#3b82f6', '#f97316', '#ec4899'];
    let paletteIndex = 0;

    return members.reduce<Roommate[]>((acc, memberEntry) => {
      const profile = memberEntry.profile;
      const id = profile?.id ?? memberEntry.member.user_id;
      if (!id || (user && id === user.id)) {
        return acc;
      }

      const displayName = getDisplayName(profile?.display_name, profile?.email, `Roommate ${paletteIndex + 1}`);
      const color = palette[paletteIndex % palette.length];
      paletteIndex += 1;

      acc.push({
        id,
        name: displayName,
        initial: displayName.charAt(0).toUpperCase(),
        color,
        venmo: profile?.venmo_handle ?? null,
      });
      return acc;
    }, []);
  }, [members, user]);

  const participantCount = Math.max(roommates.length + 1, 1);

  const totalAmount = useMemo(
    () => receiptItems.reduce((sum, item) => sum + (Number.isFinite(item.price) ? item.price : 0), 0),
    [receiptItems]
  );

  const yourShare = useMemo(() => {
    if (!user) return 0;
    return receiptItems.reduce((sum, item) => {
      // Split among all participants
      if (item.splitType === 'split') {
        return sum + (participantCount > 0 ? item.price / participantCount : 0);
      }
      // Custom split among selected people
      if (item.splitType === 'custom' && item.splitAmongIds?.length) {
        if (item.splitAmongIds.includes(user.id)) {
          return sum + (item.price / item.splitAmongIds.length);
        }
        return sum;
      }
      // Assigned to me directly
      if (item.assignedToUserId === user.id) {
        return sum + item.price;
      }
      return sum;
    }, 0);
  }, [participantCount, receiptItems, user]);

  const roommateTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    // Initialize all participants including current user
    roommates.forEach((roommate) => {
      totals[roommate.id] = 0;
    });
    if (user) {
      totals[user.id] = 0;
    }

    receiptItems.forEach((item) => {
      // Split among all participants
      if (item.splitType === 'split') {
        const share = participantCount > 0 ? item.price / participantCount : 0;
        roommates.forEach((roommate) => {
          totals[roommate.id] += share;
        });
        if (user) {
          totals[user.id] += share;
        }
        return;
      }

      // Custom split among selected people
      if (item.splitType === 'custom' && item.splitAmongIds?.length) {
        const share = item.price / item.splitAmongIds.length;
        item.splitAmongIds.forEach((id) => {
          totals[id] = (totals[id] || 0) + share;
        });
        return;
      }

      // Individual assignment
      if (item.assignedToUserId) {
        totals[item.assignedToUserId] = (totals[item.assignedToUserId] || 0) + item.price;
      }
    });

    return totals;
  }, [participantCount, receiptItems, roommates, user]);

  const youAreOwed = Math.max(totalAmount - yourShare, 0);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];
  };

  useEffect(() => () => clearTimeouts(), []);

  // handleSelectItem now handles initializing splitSelection correctly

  // Load shopping list on focus
  useFocusEffect(
    useCallback(() => {
      if (!householdId) return;
      shoppingService.list(householdId)
        .then((items) => setShoppingList(items.filter((item) => item.status === 'pending')))
        .catch(() => { /* silently fail, not critical */ });
    }, [householdId])
  );

  // Find potential bounty matches between scanned items and shopping list
  const findBountyMatches = useCallback((scannedItems: ReceiptItem[]) => {
    if (!shoppingList.length || !scannedItems.length) return;

    const matches: typeof bountyMatches = [];

    for (const receiptItem of scannedItems) {
      const receiptName = receiptItem.name.toLowerCase();

      for (const shoppingItem of shoppingList) {
        const shopName = shoppingItem.name.toLowerCase();

        // Check for partial match (either contains the other)
        const isMatch = receiptName.includes(shopName) ||
          shopName.includes(receiptName) ||
          // Also check word overlap (e.g., "Organic Tofu" matches "Tofu")
          receiptName.split(' ').some((word) =>
            shopName.split(' ').some((shopWord) =>
              word.length > 2 && shopWord.length > 2 &&
              (word.includes(shopWord) || shopWord.includes(word))
            )
          );

        if (isMatch && shoppingItem.bounty_amount && shoppingItem.bounty_amount > 0) {
          // Don't add duplicates
          if (!matches.some((m) => m.shoppingItem.id === shoppingItem.id)) {
            matches.push({
              receiptItem,
              shoppingItem,
              confirmed: null,
            });
          }
        }
      }
    }

    if (matches.length > 0) {
      setBountyMatches(matches);
    }
  }, [shoppingList]);

  const handleCaptureAndRecognize = useCallback(async () => {
    if (!householdId) {
      Alert.alert('Join a household', 'Create or join a household to scan receipts.');
      return;
    }

    try {
      setScanState('processing');

      // Capture
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7, base64: false });
      if (!photo?.uri) {
        Alert.alert('Capture failed', 'Could not capture receipt. Try again.');
        setScanState('idle');
        return;
      }

      // Try Native AI Scanning first (iOS 18+)
      // This uses on-device LLM (Apple Foundation Models) for superior accuracy
      if (ReceiptProcessor.isSupported()) {
        try {
          const result = await ReceiptProcessor.scanReceipt(photo.uri);
          
          if (result && result.items && result.items.length > 0) {
            const items: ReceiptItem[] = result.items.map((item, index) => ({
              id: `${index}-${Math.random().toString(36).slice(2, 8)}`,
              name: item.name,
              price: item.price,
              displayPrice: item.price.toFixed(2),
              splitType: 'individual'
            }));

            setReceiptItems(items);
            setSelectedItem(null);
            setBountyMatches([]); 
            findBountyMatches(items); 
            setScanState('itemizing');
            return;
          }
        } catch {
          // Native AI scan failed, falling back to regex
          // Fallback to legacy regex parser
        }
      }

      // Recognize text on-device via react-native-text-recognition (uses Apple Vision on iOS)
      let lines: string[] = [];
      try {
        const recognizedLines = await TextRecognition.recognize(photo.uri);
        if (recognizedLines?.length) {
          lines = recognizedLines
            .filter((text: string) => text && text.trim().length)
            .map((text: string) => text.trim());
        }
      } catch (ocrError) {
        console.error('OCR error:', ocrError);
        Alert.alert('OCR failed', 'Text recognition failed. Please try again.');
        setScanState('idle');
        return;
      }

      if (!lines.length) {
        Alert.alert('No text found', 'We could not read this receipt. Try better lighting and alignment.');
        setScanState('idle');
        return;
      }

      const parsed = buildReceiptFromLines(lines);
      if (!parsed.items.length) {
        Alert.alert('No line items detected', 'We could not find prices. Try again.');
        setScanState('idle');
        return;
      }

      setReceiptItems(parsed.items);
      setSelectedItem(null);
      setBountyMatches([]); // Reset any previous matches
      findBountyMatches(parsed.items); // Check for shopping list matches
      setScanState('itemizing');
    } catch (err) {
      Alert.alert('Scan failed', err instanceof Error ? err.message : 'Unknown error');
      setScanState('idle');
    }
  }, [householdId, findBountyMatches]);

  const handleBountyResponse = (shoppingItemId: string, confirmed: boolean) => {
    setBountyMatches((prev) =>
      prev.map((match) =>
        match.shoppingItem.id === shoppingItemId
          ? { ...match, confirmed }
          : match
      )
    );

    // If confirmed, auto-assign the item to the buyer (current user) 
    // and potentially apply a credit if needed (handled in posting logic)
    if (confirmed && user) {
      const match = bountyMatches.find(m => m.shoppingItem.id === shoppingItemId);
      if (match) {
        setReceiptItems(prev => prev.map(item =>
          item.id === match.receiptItem.id
            ? { ...item, assignedToUserId: user.id, assignedToName: 'Mine (Bounty)' }
            : item
        ));
      }
    }
  };

  // Toggle a person in/out of the split selection and immediately apply
  const toggleSplitSelection = (userId: string) => {
    if (!selectedItem) return;

    setSplitSelection((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }

      // Automatically apply the split logic
      const selectedIds = Array.from(newSet);
      if (selectedIds.length > 0) {
        // Compute the display name
        let displayName: string;
        if (selectedIds.length === 1) {
          const id = selectedIds[0];
          if (user && id === user.id) {
            displayName = 'Me';
          } else {
            const r = roommates.find(rm => rm.id === id);
            displayName = r?.name || 'Roommate';
          }
        } else {
          displayName = `Split (${selectedIds.length})`;
        }

        setReceiptItems((items) =>
          items.map((item) =>
            item.id === selectedItem
              ? {
                ...item,
                assignedToUserId: selectedIds.length === 1 ? selectedIds[0] : undefined,
                assignedToName: displayName,
                splitType: selectedIds.length === 1 ? 'individual' : 'custom',
                splitAmongIds: selectedIds.length === 1 ? undefined : selectedIds,
              }
              : item
          )
        );
      } else {
        // Revert to default/unassigned if everyone is deselected
        setReceiptItems((items) =>
          items.map((item) =>
            item.id === selectedItem
              ? {
                ...item,
                assignedToUserId: undefined,
                assignedToName: undefined,
                splitType: 'individual',
                splitAmongIds: undefined,
              }
              : item
          )
        );
      }

      return newSet;
    });
  };

  const handleUpdatePrice = (id: string, value: string) => {
    const parsed = Number.parseFloat(value);
    setReceiptItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price: Number.isFinite(parsed) ? parsed : 0, displayPrice: value } : item))
    );
  };

  const handleUpdateName = (id: string, value: string) => {
    setReceiptItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: value } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setReceiptItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem === id) {
      setSelectedItem(null);
    }

    // If this was a shopping list item, restore it to "From Shopping List"
    // Item IDs from shopping list are formatted as: shop-{shoppingItemId}-{randomSuffix}
    if (id.startsWith('shop-')) {
      const parts = id.split('-');
      if (parts.length >= 2) {
        const shoppingItemId = parts.slice(1, -1).join('-');
        setAddedShoppingItemIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(shoppingItemId);
          return newSet;
        });
      }
    }
  };

  const handleSelectItem = (id: string | null) => {
    setSelectedItem(id);
    if (!id) return;

    const item = receiptItems.find((i) => i.id === id);
    if (!item) return;

    // Initialize selection state based on existing assignment
    const newSet = new Set<string>();

    if (item.splitType === 'custom' && item.splitAmongIds) {
      item.splitAmongIds.forEach(uid => newSet.add(uid));
    } else if (item.splitType === 'split') {
      // If 'split', it means everyone
      if (user) newSet.add(user.id);
      roommates.forEach(r => newSet.add(r.id));
    } else if (item.assignedToUserId) {
      newSet.add(item.assignedToUserId);
    } else if (item.requestedByUserId) {
      // Fallback: if from shopping list but unassigned, default to requester
      newSet.add(item.requestedByUserId);
    }

    setSplitSelection(newSet);
  };

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: `new-${Math.random().toString(36).slice(2, 8)}`,
      name: '',
      price: 0,
      displayPrice: '',
    };
    setReceiptItems((prev) => [...prev, newItem]);
    // Don't auto-open splitter - let user tap when ready
  };

  const handleAddFromShoppingList = (shoppingItem: ShoppingItem) => {
    // Determine who this item should be assigned to (requester, not buyer)
    const requesterId = shoppingItem.requested_by;
    let requesterName = 'Me';

    if (requesterId && user && requesterId !== user.id) {
      const member = members.find(m => m.member.user_id === requesterId);
      requesterName = getDisplayName(member?.profile?.display_name, member?.profile?.email, 'Roommate');
    }

    const newItem: ReceiptItem = {
      id: `shop-${shoppingItem.id}-${Math.random().toString(36).slice(2, 4)}`,
      name: shoppingItem.name,
      price: 0,
      displayPrice: '',
      assignedToUserId: requesterId ?? user?.id,
      assignedToName: requesterName,
      splitType: 'individual',
      requestedByUserId: requesterId ?? undefined,
    };
    setReceiptItems((prev) => [...prev, newItem]);
    // Track this shopping item as added
    setAddedShoppingItemIds((prev) => new Set([...prev, shoppingItem.id]));

    // If this item has a bounty, add it to bountyMatches as confirmed
    if (shoppingItem.bounty_amount && shoppingItem.bounty_amount > 0) {
      setBountyMatches((prev) => [
        ...prev,
        {
          receiptItem: newItem,
          shoppingItem,
          confirmed: true, // Auto-confirm since user explicitly added it
        },
      ]);
    }
  };

  const pendingShoppingItems = useMemo(() =>
    shoppingList.filter(item => item.status === 'pending' && !addedShoppingItemIds.has(item.id)),
    [shoppingList, addedShoppingItemIds]
  );

  const allItemsAssigned = receiptItems.every(
    (item) => item.splitType === 'split' || item.splitType === 'custom' || Boolean(item.assignedToUserId)
  );

  // Fuzzy matching helpers
  const fuzzyMatch = (a: string, b: string): { matches: boolean; isExact: boolean } => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const na = normalize(a);
    const nb = normalize(b);
    if (na === nb) return { matches: true, isExact: true };
    if (na.includes(nb) || nb.includes(na)) return { matches: true, isExact: false };
    return { matches: false, isExact: false };
  };

  const findShoppingMatches = () => {
    const pendingItems = shoppingList.filter(s => s.status === 'pending');
    const matches: typeof pendingShoppingMatches = [];

    for (const receiptItem of receiptItems) {
      for (const shoppingItem of pendingItems) {
        const result = fuzzyMatch(receiptItem.name, shoppingItem.name);
        if (result.matches) {
          // Avoid duplicates
          if (!matches.some(m => m.shoppingItem.id === shoppingItem.id)) {
            matches.push({
              receiptItem,
              shoppingItem,
              isExact: result.isExact,
              confirmed: result.isExact, // Auto-confirm exact matches
            });
          }
        }
      }
    }
    return matches;
  };

  const handlePostToHouse = async () => {
    if (!householdId || !user) {
      Alert.alert('Hold up', 'You need to be signed in and in a household.');
      return;
    }

    if (!receiptItems.length) {
      Alert.alert('No items', 'Scan and itemize a receipt first.');
      return;
    }

    if (receiptItems.some(item => !Number.isFinite(item.price) || item.price <= 0)) {
      Alert.alert('Invalid prices', 'All items must have a price greater than 0.');
      return;
    }

    if (!allItemsAssigned) {
      Alert.alert('Assignments needed', 'Assign every item or mark it as split.');
      return;
    }

    // Check for shopping list matches before posting
    const matches = findShoppingMatches();
    const fuzzyMatches = matches.filter(m => !m.isExact);

    if (fuzzyMatches.length > 0) {
      // Show confirmation for fuzzy matches
      setPendingShoppingMatches(matches);
      setShowMatchConfirmation(true);
      return;
    }

    // No fuzzy matches, proceed directly
    await actuallyPostToHouse(matches);
  };

  const actuallyPostToHouse = async (confirmedMatches: typeof pendingShoppingMatches) => {
    if (!householdId || !user) return;

    setIsPosting(true);
    setShowMatchConfirmation(false);
    let transactionId: string | null = null;

    try {
      const transaction = await transactionService.create({
        household_id: householdId,
        payer_id: user.id,
        store_name: 'Receipt Scan',
        receipt_image_path: null,
        subtotal: totalAmount,
        tax_amount: 0,
        tip_amount: 0,
        final_total: totalAmount,
      });
      transactionId = transaction.id;

      const debtEntries = roommates
        .map((roommate) => ({ roommate, amount: roommateTotals[roommate.id] || 0 }))
        .filter(({ roommate, amount }) => roommate.id !== user.id && amount > 0.01)
        .map(({ roommate, amount }) => ({
          borrower_id: roommate.id,
          lender_id: user.id,
          amount,
          transaction_id: transaction.id,
          is_settled: false,
        }));

      if (debtEntries.length) {
        await debtService.createMany(debtEntries);
      }

      // Save line items
      const lineItems = receiptItems.map(item => ({
        transaction_id: transaction.id,
        name: item.name.replace(/[^\w\s\-\.\,\$\%\(\)]/g, '').trim(),
        price: item.price,
        assigned_to_user_id: item.assignedToUserId || null,
      }));

      await transactionService.createItems(lineItems);

      // Process confirmed shopping list matches (mark as purchased + bounty debts)
      const matchesToProcess = confirmedMatches.filter(m => m.confirmed);
      if (matchesToProcess.length > 0) {
        // 1. Mark shopping items as purchased
        await Promise.all(matchesToProcess.map(m =>
          shoppingService.updateStatus(m.shoppingItem.id, 'purchased', user.id)
        ));

        // 2. Create debt entries for bounty amounts (Requester owes Buyer)
        const bountyDebts = matchesToProcess
          .filter(m => m.shoppingItem.requested_by && m.shoppingItem.bounty_amount && m.shoppingItem.requested_by !== user.id)
          .map(m => ({
            borrower_id: m.shoppingItem.requested_by!,
            lender_id: user.id,
            amount: m.shoppingItem.bounty_amount!,
            transaction_id: transaction.id,
            is_settled: false,
          }));

        if (bountyDebts.length) {
          await debtService.createMany(bountyDebts);

          // 3. Notify requesters that their bounty was claimed
          import('@/lib/services/push-service').then(({ pushService }) => {
            matchesToProcess.forEach(m => {
              if (m.shoppingItem.requested_by && m.shoppingItem.bounty_amount) {
                pushService.notifyBountyClaimed(
                  m.shoppingItem.requested_by,
                  user.user_metadata?.display_name || 'Roommate',
                  m.shoppingItem.name,
                  m.shoppingItem.bounty_amount
                );
              }
            });
          });
        }
      }

      setScanState('summary');
    } catch (err) {
      if (transactionId) {
        // Rollback: delete the partial transaction to prevent ghost entries
        try {
          await transactionService.delete(transactionId);
        } catch {
          // silently fail cleanup if network is totally dead
        }
      }
      Alert.alert('Could not post receipt', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsPosting(false);
    }
  };

  const handleConfirmMatchToggle = (index: number) => {
    setPendingShoppingMatches(prev =>
      prev.map((m, i) => i === index ? { ...m, confirmed: !m.confirmed } : m)
    );
  };

  const handleSelectAllSplit = () => {
    if (!selectedItem || !user) return;
    const allIds = [user.id, ...roommates.map(r => r.id)];
    const isAllSelected = splitSelection.size === allIds.length;

    // Toggle logic: if all selected, clear. Else select all.
    const newSet = new Set(isAllSelected ? [] : allIds);
    setSplitSelection(newSet);

    // Apply logic
    const selectedIds = Array.from(newSet);
    if (selectedIds.length > 0) {
      // Compute the display name
      let displayName: string;
      if (selectedIds.length === 1) {
        const id = selectedIds[0];
        if (user && id === user.id) {
          displayName = 'Me';
        } else {
          const r = roommates.find(rm => rm.id === id);
          displayName = r?.name || 'Roommate';
        }
      } else {
        displayName = `Split (${selectedIds.length})`;
      }

      setReceiptItems((items) =>
        items.map((item) =>
          item.id === selectedItem
            ? {
              ...item,
              assignedToUserId: selectedIds.length === 1 ? selectedIds[0] : undefined,
              assignedToName: displayName,
              splitType: selectedIds.length === 1 ? 'individual' : 'custom',
              splitAmongIds: selectedIds.length === 1 ? undefined : selectedIds,
            }
            : item
        )
      );
    } else {
      setReceiptItems((items) =>
        items.map((item) =>
          item.id === selectedItem
            ? {
              ...item,
              assignedToUserId: undefined,
              assignedToName: undefined,
              splitType: 'individual',
              splitAmongIds: undefined,
            }
            : item
        )
      );
    }
  };

  // Show offline message when trying to scan
  if (isOffline && (scanState === 'idle' || scanState === 'itemizing')) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-white dark:bg-[#222]">
        <View className="items-center px-6">
          <View
            className="h-20 w-20 items-center justify-center rounded-full mb-4 bg-orange-500/15"
          >
            <WifiOff size={36} color="#f97316" />
          </View>
          <Text className="text-xl font-semibold text-black dark:text-white mb-2">You&apos;re Offline</Text>
          <Text className="text-sm text-center text-gray-500 dark:text-[#888]">
            Receipt scanning requires an internet connection. You can still view and manage your shopping list while offline.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (scanState === 'idle' || scanState === 'processing') {
    return (
      <CameraView
        isProcessing={scanState === 'processing'}
        cameraRef={cameraRef}
        onCapture={handleCaptureAndRecognize}
        onCancel={() => setScanState('itemizing')}
        insets={insets}
        tabBarClearance={tabBarClearance}
      />
    );
  }

  if (scanState === 'summary') {
    const earnedBounty = bountyMatches
      .filter(m => m.confirmed !== false)
      // Only count bounties if the item was requested by someone else
      .filter(m => m.shoppingItem.requested_by && m.shoppingItem.requested_by !== user?.id)
      .reduce((sum, m) => sum + (m.shoppingItem.bounty_amount || 0), 0);

    // Calculate bounties per roommate (bounty is owed by the person who requested the item)
    const roommateBounties: Record<string, number> = {};
    bountyMatches
      .filter(m => m.confirmed !== false)
      .forEach(m => {
        const requesterId = m.shoppingItem.requested_by;
        if (requesterId && requesterId !== user?.id && m.shoppingItem.bounty_amount) {
          roommateBounties[requesterId] = (roommateBounties[requesterId] || 0) + m.shoppingItem.bounty_amount;
        }
      });

    return (
      <SummaryView
        totalAmount={totalAmount}
        yourShare={yourShare}
        youAreOwed={youAreOwed}
        earnedBounty={earnedBounty}
        roommates={roommates}
        roommateTotals={roommateTotals}
        roommateBounties={roommateBounties}
        onDone={() => {
          setScanState('itemizing');
          setReceiptItems([]);
          setSelectedItem(null);
          setBountyMatches([]);
        }}
        insets={insets}
        tabBarClearance={tabBarClearance}
      />
    );
  }

  return (
    <ItemEditorView
      totalAmount={totalAmount}
      receiptItems={receiptItems}
      selectedItem={selectedItem}
      bountyMatches={bountyMatches}
      pendingShoppingItems={pendingShoppingItems}
      isPosting={isPosting}
      splitSelection={splitSelection}
      roommates={roommates}
      user={user}
      insets={insets}
      tabBarClearance={tabBarClearance}

      showMatchConfirmation={showMatchConfirmation}
      pendingShoppingMatches={pendingShoppingMatches}

      onScanNew={() => setScanState('idle')}
      onAddItem={handleAddItem}
      onAddFromShoppingList={handleAddFromShoppingList}
      onUpdateName={handleUpdateName}
      onUpdatePrice={handleUpdatePrice}
      onDelete={handleDeleteItem}
      onSelect={handleSelectItem}
      onPost={handlePostToHouse}
      onBountyResponse={handleBountyResponse}
      onToggleSplitSelection={toggleSplitSelection}

      onAssignToMe={() => {/* legacy handler, logic handled via toggles now but kept for interface */ }}

      onSelectAllSplit={handleSelectAllSplit}

      onConfirmMatchToggle={handleConfirmMatchToggle}
      onConfirmPost={() => actuallyPostToHouse(pendingShoppingMatches)}
      onCancelPost={() => setShowMatchConfirmation(false)}
      isScannerSupported={Platform.OS === 'ios' && ReceiptProcessor.isSupported()}
    />
  );
}
