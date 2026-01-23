import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { useHouseholdStore } from '@/lib/household-store';
import { debtService, shoppingService, transactionService } from '@/lib/services';
import type { ShoppingItem } from '@/lib/types';
import { CameraType, CameraView } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { Camera as CameraIcon, Check, Plus, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TextRecognition from 'react-native-text-recognition';

type ReceiptItem = {
  id: string;
  name: string;
  price: number;
  displayPrice?: string; // For editing
  assignedToUserId?: string;
  assignedToName?: string;
  splitType?: 'individual' | 'split' | 'custom';
  splitAmongIds?: string[];  // For custom splits - array of user IDs to split among
};

type Roommate = {
  id: string;
  name: string;
  initial: string;
  color: string;
  venmo: string | null;
};

type ScanState = 'idle' | 'processing' | 'itemizing' | 'summary';

type ParsedReceipt = {
  items: ReceiptItem[];
};

// === RECEIPT PARSING LOGIC ===
// Designed to handle multiple store formats (Costco, Aldi, Target, Walmart, etc.)

// Price pattern: matches XX.XX format anywhere in the line
const pricePattern = /(\d{1,3}\.\d{2})/g;

// Lines to completely ignore (headers, footers, payment info, addresses)
const ignorePatterns = [
  // Store info and addresses
  /wholesale/i,
  /costco/i,
  /aldi/i,
  /walmart/i,
  /target/i,
  /kroger/i,
  /safeway/i,
  /publix/i,
  /\b(blvd|boulevard|street|st|ave|avenue|road|rd|drive|dr|lane|ln|way|parkway|pkwy)\b/i,  // Street addresses
  /\b(fort|ft)\s+worth\b/i,  // City names
  /\b[A-Z]{2}\s+\d{5}(-\d{4})?\b/,  // State + ZIP (TX 76132)
  /,\s*[A-Z]{2}\s*\d{5}/,  // City, ST 12345
  /,\s*[A-Z]{2}\s*$/,  // ends with ", TX"
  /#\d{2,}/,  // Store numbers like #489
  /store\s*#?\d/i,

  // Totals and subtotals
  /subtotal/i,
  /total/i,
  /amount\s*due/i,

  // Payment info
  /change/i,
  /balance/i,
  /debit/i,
  /credit/i,
  /cash/i,
  /payment/i,
  /tender/i,
  /visa|master|amex|discover/i,
  /\*{3,}/,  // ***1234 card numbers
  /approved/i,
  /auth|ref|seq/i,
  /\bpin\b/i,
  /aid\s+a\d/i,
  /tvr|tsi|iad/i,
  /entry\s*mode/i,

  // Receipt metadata
  /cashier/i,
  /your\s+cashier/i,
  /https?:/i,
  /www\./i,
  /thank\s*you/i,
  /member\s*\d/i,
  /self.?checkout/i,
  /^\d+\s+items?$/i,  // "11 ITEMS"
  /taxable/i,
  /^\s*[A-Z]{2,5}\s*$/,  // Just abbreviations like "FA", "ALDI"
  /^\d{2}\/\d{2}\/\d{2}/,  // Dates
  /^\d{2}:\d{2}/,  // Times
  /verified/i,
  /xxxx+/i,  // Masked card numbers
  /^[A-Z]{2,5}:[A-Z0-9]+$/i,  // Short codes like "KIN:Y"
  /^[A-Z0-9]{3,6}$/,  // Very short codes without spaces
  /dallas/i,  // Common city names
  /houston/i,
  /austin/i,
  /chicago/i,
  /new\s*york/i,
];

// Tax line detection
const isTaxLine = (line: string): boolean => {
  return /^\s*tax\b/i.test(line) && /\d+\.\d{2}/.test(line);
};

// Check if line should be ignored
const shouldIgnoreLine = (line: string): boolean => {
  return ignorePatterns.some(pattern => pattern.test(line));
};

// Extract price and name from a line
const extractItem = (line: string): { name: string; price: number } | null => {
  const trimmed = line.trim();

  // Skip short lines
  if (trimmed.length < 3) return null;

  // Find all prices in the line
  const prices: number[] = [];
  let match;
  const priceRegex = /(\d{1,3}\.\d{2})/g;
  while ((match = priceRegex.exec(trimmed)) !== null) {
    const val = parseFloat(match[1]);
    // Only consider reasonable item prices (not item codes that look like prices)
    if (val > 0 && val < 500) {
      prices.push(val);
    }
  }

  if (prices.length === 0) return null;

  // Use the last reasonable price (usually the item price)
  const price = prices[prices.length - 1];

  // Find where this price appears and get everything before it
  const priceStr = price.toFixed(2);
  const priceIndex = trimmed.lastIndexOf(priceStr);

  let name = priceIndex > 0 ? trimmed.substring(0, priceIndex) : trimmed;

  // Clean up the name - be conservative to preserve product names
  name = name
    // Remove leading item codes (Costco style: "E 1692325")
    .replace(/^[A-Z]\s+\d+\s+/, '')
    // Remove standalone long numbers (item codes)
    .replace(/\b\d{5,}\b/g, '')
    // Remove short codes at the start (like "E " but not product names)
    .replace(/^[A-Z]\s+(?=[A-Z])/, '')
    // Remove slash-numbers (like /1692325)
    .replace(/\/\d+/g, '')
    // Remove asterisk codes (like ***KSWTR40PK)  
    .replace(/\*+\w+/g, '')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();

  // If name is empty or too short, skip
  if (name.length < 2) return null;

  // Capitalize words nicely (but preserve existing mixed case like "PepJac")
  const isAllCaps = name === name.toUpperCase();
  if (isAllCaps) {
    name = name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }


  return { name, price };
};

const buildReceiptFromLines = (lines: string[]): ParsedReceipt => {

  // Separate lines into: item names, prices, and special lines (tax, etc.)
  const itemNameLines: { index: number; name: string }[] = [];
  const priceOnlyLines: { index: number; price: number }[] = [];
  let taxAmount: number | null = null;

  // Price-only pattern: just a price with optional suffix (like "23.99 A")
  const priceOnlyPattern = /^\s*(\d{1,3}\.\d{2})\s*[A-Za-z]?\s*$/;
  // Discount pattern: price with dash before letter (like "6.00-A" indicates discount/refund)
  const discountPattern = /^\s*\d{1,3}\.\d{2}\s*-[A-Za-z]?\s*$/;
  // Item name pattern: has letters, may have item codes
  const hasLettersPattern = /[A-Za-z]{2,}/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.length < 2) continue;


    // Check for tax line
    if (/^\s*tax\b/i.test(trimmed)) {
      const match = trimmed.match(/(\d+\.\d{2})/);
      if (match) {
        taxAmount = parseFloat(match[1]);
      }
      continue;
    }

    // Check if should ignore
    if (shouldIgnoreLine(trimmed)) {
      continue;
    }

    // Check if this is a discount line (price with dash like "6.00-A")
    if (discountPattern.test(trimmed)) {
      continue;
    }

    // Check if this is a price-only line
    const priceOnlyMatch = trimmed.match(priceOnlyPattern);
    if (priceOnlyMatch) {
      const price = parseFloat(priceOnlyMatch[1]);
      // Reasonable item price range - most grocery items are under $100
      // Prices above this are likely subtotals/totals
      if (price > 0 && price < 100) {
        priceOnlyLines.push({ index: i, price });
      } else {
      }
      continue;
    }

    // Check if this line contains an item name (has letters)
    if (hasLettersPattern.test(trimmed)) {
      // Check if this line has BOTH name and price
      const inlinePrice = trimmed.match(/(\d{1,3}\.\d{2})\s*[-]?[A-Za-z]?\s*$/);
      if (inlinePrice) {
        // This line has both name and price (like Aldi format)
        const price = parseFloat(inlinePrice[1]);
        let name = trimmed.substring(0, trimmed.lastIndexOf(inlinePrice[1])).trim();
        name = cleanItemName(name);

        if (name && price > 0 && price < 100) {
          itemNameLines.push({ index: i, name: `${name}|${price}` }); // Use | to mark inline price
        }
      } else {
        // Skip lines that look like discount/return codes (contain /NUMBERS)
        if (/\/\d{5,}/.test(trimmed)) {
          continue;
        }

        // Name only line
        let name = cleanItemName(trimmed);
        if (name) {
          itemNameLines.push({ index: i, name });
        }
      }
    }
  }


  // Build final items list
  const items: ReceiptItem[] = [];
  let priceIndex = 0;

  for (const itemLine of itemNameLines) {
    // Check if this already has a price (inline)
    if (itemLine.name.includes('|')) {
      const [name, priceStr] = itemLine.name.split('|');
      items.push({
        id: `${itemLine.index}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        price: parseFloat(priceStr),
      });
    } else if (priceIndex < priceOnlyLines.length) {
      // Match with next available price
      const price = priceOnlyLines[priceIndex].price;
      items.push({
        id: `${itemLine.index}-${Math.random().toString(36).slice(2, 8)}`,
        name: itemLine.name,
        price,
      });
      priceIndex++;
    }
  }

  // Add tax as splittable item
  if (taxAmount !== null && taxAmount > 0) {
    items.push({
      id: `tax-${Math.random().toString(36).slice(2, 8)}`,
      name: 'Tax',
      price: taxAmount,
      splitType: 'split',
      assignedToName: 'Split',
    });
  }

  return { items };
};

// Clean up item name
const cleanItemName = (raw: string): string => {
  let name = raw
    // Remove leading letter + item code (like "E 1692325")
    .replace(/^[A-Z]\s+\d{5,}\s*/, '')
    // Remove standalone long numbers (item codes)  
    .replace(/\b\d{5,}\b/g, '')
    // Remove leading single letter codes
    .replace(/^[A-Z]\s+(?=[A-Z])/, '')
    // Remove slash-numbers
    .replace(/\/\d+/g, '')
    // Remove asterisk codes
    .replace(/\*+\w+/g, '')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();

  if (name.length < 2) return '';

  // Capitalize nicely if all caps
  if (name === name.toUpperCase()) {
    name = name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  return name;
};


export function ScanTab() {
  const insets = useSafeAreaInsets();
  const iosMajorVersion = Platform.OS === 'ios' ? Number.parseInt(String(Platform.Version), 10) : null;
  const tabBarClearance = Platform.OS !== 'ios' || (iosMajorVersion != null && iosMajorVersion >= 26) ? 88 : 0;
  const [scanState, setScanState] = useState<ScanState>('itemizing');
  const [cameraType] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [splitSelection, setSplitSelection] = useState<Set<string>>(new Set()); // For custom split selection
  const [isPosting, setIsPosting] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [bountyMatches, setBountyMatches] = useState<Array<{
    receiptItem: ReceiptItem;
    shoppingItem: ShoppingItem;
    confirmed: boolean | null; // null = not yet answered
  }>>([]);
  const [addedShoppingItemIds, setAddedShoppingItemIds] = useState<Set<string>>(new Set());
  const [pendingShoppingMatches, setPendingShoppingMatches] = useState<Array<{
    receiptItem: ReceiptItem;
    shoppingItem: ShoppingItem;
    isExact: boolean;
    confirmed: boolean;
  }>>([]);
  const [showMatchConfirmation, setShowMatchConfirmation] = useState(false);
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
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

      const displayName = profile?.display_name || profile?.email || `Roommate ${paletteIndex + 1}`;
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
  }, [members, user?.id]);

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
  }, [participantCount, receiptItems, user?.id]);

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
  }, [participantCount, receiptItems, roommates, user?.id]);

  const youAreOwed = Math.max(totalAmount - yourShare, 0);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];
  };

  useEffect(() => () => clearTimeouts(), []);

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

  const handleAssignToRoommate = (roommate: Roommate) => {
    if (!selectedItem) {
      return;
    }
    setReceiptItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem
          ? {
            ...item,
            assignedToUserId: roommate.id,
            assignedToName: roommate.name,
            splitType: 'individual',
            splitAmongIds: undefined,
          }
          : item
      )
    );
    setSelectedItem(null);
    setSplitSelection(new Set());
  };

  const handleSplit = () => {
    if (!selectedItem) {
      return;
    }
    setReceiptItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem
          ? { ...item, assignedToUserId: undefined, assignedToName: 'Split', splitType: 'split', splitAmongIds: undefined }
          : item
      )
    );
    setSelectedItem(null);
    setSplitSelection(new Set());
  };

  const handleAssignToMe = () => {
    if (!selectedItem || !user) {
      return;
    }
    setReceiptItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem
          ? {
            ...item,
            assignedToUserId: user.id,
            assignedToName: 'Mine',
            splitType: 'individual',
            splitAmongIds: undefined,
          }
          : item
      )
    );
    setSelectedItem(null);
    setSplitSelection(new Set());
  };



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
        setReceiptItems((items) =>
          items.map((item) =>
            item.id === selectedItem
              ? {
                ...item,
                assignedToUserId: undefined,
                assignedToName: `Split (${selectedIds.length})`,
                splitType: 'custom',
                splitAmongIds: selectedIds,
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

  // Apply the current split selection to the selected item
  const handleApplyCustomSplit = () => {
    if (!selectedItem || splitSelection.size === 0) return;

    const selectedIds = Array.from(splitSelection);
    const names = selectedIds.map((id) => {
      if (user && id === user.id) return 'Me';
      const roommate = roommates.find((r) => r.id === id);
      return roommate?.name?.split(' ')[0] || 'Unknown';
    });

    setReceiptItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem
          ? {
            ...item,
            assignedToUserId: undefined,
            assignedToName: names.length <= 2 ? names.join(' & ') : `${names.length} people`,
            splitType: 'custom',
            splitAmongIds: selectedIds,
          }
          : item
      )
    );
    setSelectedItem(null);
    setSplitSelection(new Set());
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
  };

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: `new-${Math.random().toString(36).slice(2, 8)}`,
      name: '',
      price: 0,
      displayPrice: '',
    };
    setReceiptItems((prev) => [...prev, newItem]);
    setSelectedItem(newItem.id);
  };

  const handleAddFromShoppingList = (shoppingItem: ShoppingItem) => {
    const newItem: ReceiptItem = {
      id: `shop-${shoppingItem.id}-${Math.random().toString(36).slice(2, 4)}`,
      name: shoppingItem.name,
      price: 0,
      displayPrice: '',
      assignedToUserId: user?.id,
      splitType: 'individual',
    };
    setReceiptItems((prev) => [...prev, newItem]);
    setSelectedItem(newItem.id);
    // Track this shopping item as added
    setAddedShoppingItemIds((prev) => new Set([...prev, shoppingItem.id]));
  };

  const pendingShoppingItems = useMemo(() =>
    shoppingList.filter(item => item.status === 'pending' && !addedShoppingItemIds.has(item.id)),
    [shoppingList, addedShoppingItemIds]
  );

  const allItemsAssigned = receiptItems.every(
    (item) => item.splitType === 'split' || item.splitType === 'custom' || Boolean(item.assignedToUserId)
  );

  // Fuzzy matching: normalize and check if one contains the other
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
        }
      }

      setScanState('summary');
    } catch (err) {
      Alert.alert('Could not post receipt', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsPosting(false);
    }
  };

  if (scanState === 'idle') {
    return (
      <SafeAreaView
        edges={['top']}
        className="flex-1 bg-black"
      >
        <View className="flex-1 px-6">
          <View className="flex-row justify-end py-4">
            <Pressable onPress={() => setScanState('itemizing')} className="p-2 bg-[#333] rounded-full">
              <Text className="text-white font-semibold">Cancel</Text>
            </Pressable>
          </View>

          <View className="flex-1 w-full items-center justify-center">
            <View className="h-[400px] w-full overflow-hidden rounded-3xl border-4" style={{ borderColor: 'rgba(15, 248, 136, 0.5)' }}>
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing={cameraType}
                autofocus="on"
              />
            </View>
          </View>
        </View>

        <View className="items-center w-full" style={{ paddingBottom: insets.bottom + tabBarClearance + 24 }}>
          <Text className="mb-6 text-lg text-white font-medium text-center">Align the receipt and tap capture</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Capture" onPress={handleCaptureAndRecognize}>
            <View
              className="h-20 w-20 items-center justify-center rounded-full border-4"
              style={{ backgroundColor: '#0F8', borderColor: 'rgba(15, 248, 136, 0.3)' }}
            >
              <CameraIcon size={28} color="#000" />
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (scanState === 'processing') {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center" style={{ backgroundColor: '#222' }}>
        <View className="items-center">
          <ActivityIndicator size="large" color="#0F8" />
          <Text className="mt-3 text-xl font-semibold text-white">Analyzing Receipt</Text>
          <Text className="mt-1 text-sm text-white/70">Detecting items and prices...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (scanState === 'summary') {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: '#222' }}>
        <View className="items-center pb-6" style={{ backgroundColor: '#0F8', paddingTop: 40 }}>
          <View className="h-18 w-18 items-center justify-center rounded-full bg-black">
            <Check size={28} color="#0F8" />
          </View>
          <Text className="mt-3 text-2xl font-semibold text-black">Receipt Posted!</Text>
          <Text className="mt-1 text-sm text-black/80">Your roommates have been notified</Text>
        </View>

        <ScrollView contentContainerClassName="px-6 py-6 pb-0" showsVerticalScrollIndicator={false}>
          <View className="rounded-3xl border p-4" style={{ backgroundColor: '#2a2a2a', borderColor: '#333' }}>
            <Text className="mb-3 font-semibold text-white">Summary</Text>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-white/70">You paid:</Text>
              <Text className="font-semibold text-white">${totalAmount.toFixed(2)}</Text>
            </View>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-white/70">Your share:</Text>
              <Text className="font-semibold text-white">${yourShare.toFixed(2)}</Text>
            </View>
            <View className="my-2 h-px" style={{ backgroundColor: '#333' }} />
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-white">You are owed:</Text>
              <Text className="font-semibold" style={{ color: '#0F8' }}>
                ${youAreOwed.toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="mt-4 rounded-3xl border p-4" style={{ backgroundColor: '#2a2a2a', borderColor: '#0F8' }}>
            <Text className="mb-3 font-semibold text-white">Breakdown by Roommate</Text>
            <View className="gap-3">
              {roommates.map((roommate) => (
                <View key={roommate.id} className="flex-row items-center justify-between">
                  <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: roommate.color }}>
                    <Text className="text-base font-semibold text-black">{roommate.initial}</Text>
                  </View>
                  <Text className="ml-3 flex-1 text-[15px] font-semibold text-white">{roommate.name}</Text>
                  <Text className="font-semibold text-white/70">${(roommateTotals[roommate.id] || 0).toFixed(2)}</Text>
                </View>
              ))}
              {!roommates.length && (
                <Text className="text-sm text-white/60">Invite roommates to start tracking splits.</Text>
              )}
            </View>
          </View>

          <View className="h-6" />
        </ScrollView>

        <View className="px-6" style={{ paddingBottom: insets.bottom + tabBarClearance }}>
          <Pressable
            accessibilityRole="button"
            className="items-center justify-center rounded-2xl py-4"
            style={{ backgroundColor: '#0F8' }}
            onPress={() => {
              setScanState('itemizing');
              setReceiptItems([]);
              setSelectedItem(null);
              setBountyMatches([]);
            }}
          >
            <Text className="font-semibold text-black">Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: '#222' }}>
      <View className="px-6 pb-4" style={{ paddingTop: 32, borderBottomWidth: 1, borderBottomColor: '#333' }}>
        <View className="mb-3">
          <Text className="text-3xl font-semibold text-white">New Expense</Text>
          <Text className="mt-1 text-sm text-white/60">Total: ${totalAmount.toFixed(2)}</Text>
        </View>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setScanState('idle')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="flex-1 flex-row items-center justify-center rounded-xl bg-[#333] px-4 py-3"
          >
            <CameraIcon size={18} color="#0F8" />
            <Text className="ml-2 font-semibold text-white">Scan Receipt</Text>
          </Pressable>
          <Pressable
            onPress={handleAddItem}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="flex-1 flex-row items-center justify-center rounded-xl px-4 py-3"
            style={{ backgroundColor: '#0F8' }}
          >
            <Plus size={18} color="#000" />
            <Text className="ml-2 font-semibold text-black">Add Item</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 pb-2" showsVerticalScrollIndicator={false}>
        {/* Bounty Matches Section */}
        {bountyMatches.some(m => m.confirmed === null) && (
          <View className="mb-6 rounded-2xl border border-[#f59e0b] bg-[#f59e0b]/10 p-4">
            <View className="flex-row items-center mb-3">
              <Text className="text-xl mr-2">🎯</Text>
              <Text className="text-lg font-bold text-[#f59e0b]">Bounty Detected!</Text>
            </View>
            <Text className="text-white/80 mb-4">Did you buy these items from the list?</Text>

            <View className="gap-3">
              {bountyMatches.filter(m => m.confirmed === null).map((match, index) => (
                <View key={`${match.shoppingItem.id}-${index}`} className="bg-black/20 rounded-xl p-3">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 mr-2">
                      <Text className="text-white font-semibold">{match.shoppingItem.name}</Text>
                      <Text className="text-xs text-white/60"> matched "{match.receiptItem.name}"</Text>
                    </View>
                    {match.shoppingItem.bounty_amount && (
                      <View className="bg-[#f59e0b] px-2 py-1 rounded-lg">
                        <Text className="text-black font-bold text-xs">
                          +${match.shoppingItem.bounty_amount.toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row gap-2">
                    <Pressable
                      className="flex-1 bg-[#333] py-2 rounded-lg items-center"
                      onPress={() => handleBountyResponse(match.shoppingItem.id, false)}
                    >
                      <Text className="text-white font-medium">No</Text>
                    </Pressable>
                    <Pressable
                      className="flex-1 bg-[#f59e0b] py-2 rounded-lg items-center"
                      onPress={() => handleBountyResponse(match.shoppingItem.id, true)}
                    >
                      <Text className="text-black font-bold">Yes, I did!</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Shopping List Quick-Add Section */}
        {pendingShoppingItems.length > 0 && (
          <View className="mb-4">
            <Text className="text-xs text-white/50 uppercase mb-2">From Shopping List</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
              <View className="flex-row gap-2">
                {pendingShoppingItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleAddFromShoppingList(item)}
                    className="flex-row items-center rounded-full px-3 py-2"
                    style={{ backgroundColor: item.bounty_amount ? '#f59e0b20' : '#333' }}
                  >
                    <Plus size={14} color={item.bounty_amount ? '#f59e0b' : '#888'} />
                    <Text className="ml-1 text-white font-medium text-sm" numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.bounty_amount ? (
                      <Text className="ml-1 text-[#f59e0b] font-bold text-xs">
                        +${item.bounty_amount.toFixed(0)}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View className="gap-3">
          {receiptItems.map((item) => {
            const isSelected = selectedItem === item.id;
            const isAssigned = Boolean(item.assignedToUserId) || item.splitType === 'split';
            const isSplit = item.splitType === 'split';

            let borderColor = '#333';
            let backgroundColor = '#2a2a2a';
            if (isSelected) {
              borderColor = '#0F8';
              backgroundColor = 'rgba(15, 248, 136, 0.15)';
            } else if (isAssigned) {
              if (isSplit) {
                borderColor = '#8b5cf6';
                backgroundColor = 'rgba(139, 92, 246, 0.08)';
              } else {
                borderColor = '#0F8';
                backgroundColor = 'rgba(15, 248, 136, 0.08)';
              }
            }

            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => setSelectedItem(item.id)}
                className="rounded-2xl border-2 px-4 py-4"
                style={{ borderColor, backgroundColor }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs text-white/50 uppercase">Item Name</Text>
                  <Text className="text-xs text-white/50 uppercase">Price</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="flex-1 rounded-xl border px-3 py-2 text-white font-semibold"
                    style={{ backgroundColor: '#1a1a1a', borderColor: '#444' }}
                    value={item.name}
                    onChangeText={(value) => handleUpdateName(item.id, value)}
                    placeholder="Item name"
                    placeholderTextColor="#666"
                  />
                  <View className="flex-row items-center">
                    <Text className="text-white/60 mr-1">$</Text>
                    <TextInput
                      className="w-20 rounded-xl border px-3 py-2 text-white font-semibold text-right"
                      style={{ backgroundColor: '#1a1a1a', borderColor: '#444' }}
                      keyboardType="decimal-pad"
                      value={item.displayPrice ?? (Number.isFinite(item.price) ? item.price.toFixed(2) : '')}
                      onChangeText={(value) => handleUpdatePrice(item.id, value)}
                      placeholder="0.00"
                      placeholderTextColor="#666"
                    />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete item"
                    onPress={() => handleDeleteItem(item.id)}
                    className="p-2 ml-1"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </Pressable>
                </View>
                {item.assignedToName && (
                  <View className="mt-3 flex-row items-center">
                    <View
                      className="h-2 w-2 rounded-full mr-2"
                      style={{
                        backgroundColor: item.splitType === 'split'
                          ? '#8b5cf6'
                          : item.splitType === 'custom'
                            ? '#f97316'
                            : '#0F8'
                      }}
                    />
                    <Text
                      className="text-sm font-semibold"
                      style={{
                        color: item.splitType === 'split'
                          ? '#8b5cf6'
                          : item.splitType === 'custom'
                            ? '#f97316'
                            : '#0F8'
                      }}
                    >
                      {item.assignedToName}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        {!receiptItems.length && (
          <View className="items-center py-12">
            <Text className="text-lg font-semibold text-white mb-2">No items yet</Text>
            <Text className="text-sm text-white/60 text-center">
              Use the buttons above to add items
            </Text>
          </View>
        )}

        {/* Add Item Button */}
        <Pressable
          accessibilityRole="button"
          onPress={handleAddItem}
          className="mt-4 flex-row items-center justify-center rounded-xl border-2 border-dashed py-3"
          style={{ borderColor: '#444' }}
        >
          <Plus size={20} color="#666" />
          <Text className="ml-2 text-white/60 font-medium">Add Item</Text>
        </Pressable>
      </ScrollView>

      {selectedItem !== null && (
        <View className="px-6 py-4" style={{ borderTopWidth: 1, borderTopColor: '#333' }}>
          <Text className="mb-3 text-sm text-white/70">Assign to:</Text>

          <View className="flex-row flex-wrap gap-2 mb-4">
            {/* All toggle */}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: splitSelection.size === roommates.length + 1 }}
              onPress={() => {
                if (!selectedItem || !user) return;
                const allIds = [user.id, ...roommates.map(r => r.id)];
                const isAllSelected = splitSelection.size === allIds.length;

                // Toggle logic: if all selected, clear. Else select all.
                const newSet = new Set(isAllSelected ? [] : allIds);
                setSplitSelection(newSet);

                // Apply logic
                const selectedIds = Array.from(newSet);
                if (selectedIds.length > 0) {
                  setReceiptItems((items) =>
                    items.map((item) =>
                      item.id === selectedItem
                        ? {
                          ...item,
                          assignedToUserId: undefined,
                          assignedToName: `Split (${selectedIds.length})`,
                          splitType: 'custom',
                          splitAmongIds: selectedIds,
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
              }}
              className="flex-row items-center px-4 py-2 rounded-xl"
              style={{
                backgroundColor: splitSelection.size === roommates.length + 1 ? 'rgba(139, 92, 246, 0.2)' : '#333',
                borderWidth: 2,
                borderColor: splitSelection.size === roommates.length + 1 ? '#8b5cf6' : 'transparent',
              }}
            >
              <Text className="text-white font-medium">All</Text>
            </Pressable>

            {/* Me toggle */}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: user ? splitSelection.has(user.id) : false }}
              onPress={() => user && toggleSplitSelection(user.id)}
              className="flex-row items-center px-4 py-2 rounded-xl"
              style={{
                backgroundColor: user && splitSelection.has(user.id) ? 'rgba(15, 248, 136, 0.2)' : '#333',
                borderWidth: 2,
                borderColor: user && splitSelection.has(user.id) ? '#0F8' : 'transparent',
              }}
            >
              <Text className="text-white font-medium">Me</Text>
            </Pressable>

            {/* Roommate toggles */}
            {roommates.map((roommate) => (
              <Pressable
                key={roommate.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: splitSelection.has(roommate.id) }}
                onPress={() => toggleSplitSelection(roommate.id)}
                className="flex-row items-center px-3 py-2 rounded-xl"
                style={{
                  backgroundColor: splitSelection.has(roommate.id) ? 'rgba(139, 92, 246, 0.2)' : '#333',
                  borderWidth: 2,
                  borderColor: splitSelection.has(roommate.id) ? '#8b5cf6' : 'transparent',
                }}
              >
                <Text className="text-white font-medium">{roommate.name.split(' ')[0]}</Text>
              </Pressable>
            ))}
          </View>

          {/* Done Button */}
          <Pressable
            onPress={() => setSelectedItem(null)}
            className="items-center justify-center rounded-xl bg-[#333] py-3"
          >
            <Text className="font-semibold text-white">Done</Text>
          </Pressable>
        </View>
      )}

      <View className="px-6" style={{ paddingBottom: insets.bottom + tabBarClearance }}>
        <Pressable
          accessibilityRole="button"
          className="items-center justify-center rounded-2xl py-4"
          style={{
            backgroundColor: '#0F8',
            opacity: !receiptItems.length || !allItemsAssigned || isPosting ? 0.4 : 1,
          }}
          onPress={handlePostToHouse}
          disabled={!receiptItems.length || !allItemsAssigned || isPosting}
        >
          <Text className="font-semibold text-black">{isPosting ? 'Posting...' : 'Post to House'}</Text>
        </Pressable>
      </View>

      {/* Shopping List Match Confirmation Modal */}
      <Modal
        visible={showMatchConfirmation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMatchConfirmation(false)}
      >
        <View className="flex-1" style={{ backgroundColor: '#222' }}>
          <SafeAreaView edges={['top']} className="flex-1">
            <View className="px-6 py-4 border-b" style={{ borderBottomColor: '#333' }}>
              <Text className="text-2xl font-bold text-white">Confirm Matches</Text>
              <Text className="text-white/60 mt-1">These items match your shopping list</Text>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
              {pendingShoppingMatches.map((match, index) => (
                <Pressable
                  key={match.shoppingItem.id}
                  onPress={() => {
                    setPendingShoppingMatches(prev =>
                      prev.map((m, i) => i === index ? { ...m, confirmed: !m.confirmed } : m)
                    );
                  }}
                  className="flex-row items-center justify-between p-4 rounded-xl mb-3"
                  style={{ backgroundColor: match.confirmed ? 'rgba(15, 248, 136, 0.2)' : '#333' }}
                >
                  <View className="flex-1">
                    <Text className="text-white font-semibold">{match.receiptItem.name}</Text>
                    <Text className="text-white/60 text-sm">
                      {match.isExact ? 'Exact match: ' : 'Possible match: '}"{match.shoppingItem.name}"
                    </Text>
                    {match.shoppingItem.bounty_amount ? (
                      <Text className="text-[#f59e0b] font-bold text-sm mt-1">
                        Bounty: +${match.shoppingItem.bounty_amount.toFixed(2)}
                      </Text>
                    ) : null}
                  </View>
                  <View className="h-8 w-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: match.confirmed ? '#0F8' : '#555' }}>
                    {match.confirmed && <Check size={18} color="#000" />}
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <View className="px-6 pb-6">
              <Pressable
                onPress={() => actuallyPostToHouse(pendingShoppingMatches)}
                className="items-center justify-center rounded-2xl py-4"
                style={{ backgroundColor: '#0F8' }}
              >
                <Text className="font-semibold text-black">
                  {isPosting ? 'Posting...' : 'Confirm & Post'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowMatchConfirmation(false)}
                className="items-center justify-center py-3 mt-2"
              >
                <Text className="text-white/60">Cancel</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView >
  );
}


