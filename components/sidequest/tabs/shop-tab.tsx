import { AddItemModal } from '@/components/sidequest/shop/add-item-modal';
import { ItemDetailsSheet } from '@/components/sidequest/shop/item-details-sheet';
import { ShoppingListItem } from '@/components/sidequest/shop/shopping-list-item';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { useHouseholdStore } from '@/lib/household-store';
import { shoppingService } from '@/lib/services';
import { useShoppingStore } from '@/lib/shopping-store';
import type { ShoppingItem } from '@/lib/types';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, ShoppingBag, WifiOff } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export function ShopTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const iosMajorVersion = Platform.OS === 'ios' ? Number.parseInt(String(Platform.Version), 10) : null;
  const tabBarClearance = Platform.OS !== 'ios' || (iosMajorVersion != null && iosMajorVersion >= 26) ? 88 : 0;

  const householdId = useHouseholdStore((state) => state.householdId);
  const members = useHouseholdStore((state) => state.members);
  const { user } = useSupabaseUser();
  const { isOffline } = useNetworkStatus();

  // Zustand store for offline persistence
  const storeItems = useShoppingStore((state) => state.items);
  const setStoreItems = useShoppingStore((state) => state.setItems);
  const addStoreItem = useShoppingStore((state) => state.addItem);
  const updateStoreItem = useShoppingStore((state) => state.updateItem);
  const removeStoreItem = useShoppingStore((state) => state.removeItem);
  const replaceStoreItem = useShoppingStore((state) => state.replaceItem);
  const queueAction = useShoppingStore((state) => state.queueAction);
  const syncOfflineActions = useShoppingStore((state) => state.syncOfflineActions);
  const offlineQueue = useShoppingStore((state) => state.offlineQueue);
  const isHydrated = useShoppingStore((state) => state.isHydrated);

  const [showAddModal, setShowAddModal] = useState(false);
  const [primaryCtaHeight, setPrimaryCtaHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailItem, setDetailItem] = useState<ShoppingItem | null>(null);
  const deletedItemIds = useRef<Set<string>>(new Set());

  const remainingItems = useMemo(
    () => storeItems.filter((item) => item.status !== 'purchased'),
    [storeItems]
  );

  // Sync offline actions when coming back online
  useEffect(() => {
    if (!isOffline && offlineQueue.length > 0) {
      syncOfflineActions();
    }
  }, [isOffline, offlineQueue.length, syncOfflineActions]);

  const fetchItems = useCallback(async () => {
    if (!householdId || isOffline) {
      setIsLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await shoppingService.list(householdId);
      // Filter out items that are currently being deleted
      const filteredData = data.filter(item => !deletedItemIds.current.has(item.id));
      setStoreItems(filteredData);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [householdId, isOffline, setStoreItems]);

  const handleRefresh = useCallback(() => {
    if (isOffline) {
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    fetchItems();
  }, [fetchItems, isOffline]);

  useFocusEffect(
    useCallback(() => {
      if (!householdId) return;
      // Only show loading if no cached items
      if (storeItems.length === 0) {
        setIsLoading(true);
      }
      if (!isOffline) {
        fetchItems();
      } else {
        setIsLoading(false);
      }
    }, [fetchItems, householdId, isOffline, storeItems.length])
  );

  const handleToggleComplete = async (item: ShoppingItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextStatus = item.status === 'pending' ? 'purchased' : 'pending';

    // Optimistic update
    updateStoreItem(item.id, { status: nextStatus, purchased_by: nextStatus === 'purchased' ? user?.id ?? null : null });

    if (isOffline) {
      queueAction({
        type: 'update',
        payload: { id: item.id, status: nextStatus, purchased_by: nextStatus === 'purchased' ? user?.id ?? null : null },
      });
    } else {
      try {
        await shoppingService.updateStatus(item.id, nextStatus, user?.id ?? null);
      } catch (err) {
        // Revert on error
        updateStoreItem(item.id, { status: item.status, purchased_by: item.purchased_by });
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update item');
      }
    }
  };

  const handleDelete = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Track pending delete
    deletedItemIds.current.add(id);

    // Optimistic delete
    const deletedItem = storeItems.find((item) => item.id === id);
    removeStoreItem(id);

    if (isOffline) {
      queueAction({ type: 'delete', payload: { id } });
      // In offline mode, we can keep the ID in the set until sync potentially?
      // Or just let the queue handle it. The queue acts as the source of truth for pending.
      // But for the fetchItems filter, we might want to clean it up eventually or just leave it.
      // Since fetchItems returns early in offline mode, it doesn't matter much.
      setTimeout(() => deletedItemIds.current.delete(id), 1000); // Cleanup anyway
    } else {
      try {
        await shoppingService.delete(id);
      } catch (err) {
        // Revert on error
        if (deletedItem) addStoreItem(deletedItem);
        deletedItemIds.current.delete(id); // Clear immediately on error so it reappears
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete item');
      } finally {
        // Keep in tracking for a bit longer to prevent flicker from stale data refetch
        setTimeout(() => {
          deletedItemIds.current.delete(id);
        }, 2000);
      }
    }
  };

  const handleAddItem = async (name: string, category: string | null, bounty: number | null) => {
    if (!householdId) return;

    const tempId = `temp-${Date.now()}`;
    const newItem: ShoppingItem = {
      id: tempId,
      household_id: householdId,
      name,
      category,
      requested_by: user?.id ?? null,
      bounty_amount: bounty,
      status: 'pending',
      purchased_by: null,
      purchased_at: null,
      created_at: new Date().toISOString(),
    };

    // Optimistic add
    addStoreItem(newItem);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddModal(false);

    if (isOffline) {
      queueAction({
        type: 'add',
        payload: {
          household_id: householdId,
          name,
          category,
          requested_by: user?.id ?? null,
          bounty_amount: bounty,
          status: 'pending',
        },
      });
    } else {
      try {
        const created = await shoppingService.create({
          household_id: householdId,
          name,
          category,
          requested_by: user?.id ?? null,
          bounty_amount: bounty,
          status: 'pending',
        });

        // Notify household if bounty added
        if (bounty && user) {
          // Get display name from members store (not auth metadata)
          const currentUserProfile = members.find(m => m.member.user_id === user.id);
          const displayName = currentUserProfile?.profile?.display_name || 'Roommate';

          import('@/lib/services/push-service').then(({ pushService }) => {
            pushService.notifyBountyAdded(
              householdId,
              user.id,
              displayName,
              name,
              bounty
            );
          });
        }

        // Replace temp item with real one atomically (no flicker)
        replaceStoreItem(tempId, created);
      } catch (err) {
        removeStoreItem(tempId);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add item');
      }
    }
  };

  if (!householdId) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-white dark:bg-[#222] px-6">
        <Text className="text-center text-black dark:text-white">Join or create a household to view the shopping list.</Text>
      </SafeAreaView>
    );
  }

  // Wait for hydration before showing loading
  if (!isHydrated) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center" style={{ backgroundColor: '#222' }}>
        <ActivityIndicator className="text-[#0F8]" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white dark:bg-[#222]">
      <View className="px-6 pb-3 pt-4 border-b border-gray-200 dark:border-[#333]">
        <View className="flex-row items-center justify-between">
          <Text className="text-3xl font-semibold text-black dark:text-white">Shopping List</Text>
          {isOffline && (
            <View className="flex-row items-center rounded-full bg-orange-500/20 px-3 py-1">
              <WifiOff size={14} color="#f97316" />
              <Text className="ml-1.5 text-xs font-medium" style={{ color: '#f97316' }}>Offline</Text>
            </View>
          )}
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-sm" style={{ color: '#888' }}>
            {remainingItems.length} items to buy
            {offlineQueue.length > 0 && ` • ${offlineQueue.length} pending sync`}
          </Text>
          <Button
            onPress={() => setShowAddModal(true)}
            size="sm"
          >
            <Plus size={18} className="text-white dark:text-black" />
            <Text className="ml-2 font-semibold text-white dark:text-black">Add</Text>
          </Button>
        </View>
      </View>

      {isLoading && storeItems.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator className="text-emerald-600 dark:text-[#0F8]" />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          contentContainerClassName="px-6 pt-4"
          contentContainerStyle={{
            paddingBottom: primaryCtaHeight + insets.bottom + tabBarClearance + 16,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={user ? undefined : undefined} // Let native handle default or use dynamic color if possible, but safely we can remove hardcoded tint or use conditional if we had explicit color scheme ref.
            // Easier: just remove tintColor to let system decide, or use a prop if we have scheme.
            // I'll leave tintColor out or set to theme dependent if I can.
            // Actually, I can't easily put conditional hook logic inside JSX prop if I don't have the value.
            // I will use a simple specialized component or just remove it to fallback to default (usually gray/black).
            />
          }
          data={storeItems.sort((a, b) => {
            if (a.status === b.status) return 0;
            return a.status === 'pending' ? -1 : 1;
          })}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: ShoppingItem }) => (
            <ShoppingListItem
              item={item}
              onToggleComplete={handleToggleComplete}
              onLongPress={setDetailItem}
              onDelete={handleDelete}
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <View
                className="h-20 w-20 items-center justify-center rounded-full mb-4 bg-emerald-100 dark:bg-green-500/15"
              >
                <ShoppingBag size={36} className="text-emerald-600 dark:text-[#0F8]" />
              </View>
              <Text className="text-xl font-semibold text-black dark:text-white">Nothing to buy</Text>
              <Text className="mt-2 text-sm text-center px-8 text-gray-500 dark:text-[#888]">
                Tap &quot;Add&quot; to add items to your shared shopping list
              </Text>
            </View>
          }
        />
      )}

      <View
        className="absolute left-0 right-0 px-6"
        style={{ bottom: insets.bottom + tabBarClearance }}
        onLayout={(event) => setPrimaryCtaHeight(event.nativeEvent.layout.height)}
      >
        <Button
          size="lg"
          onPress={() => router.push('/scan')}
          label={isOffline ? "I'm Shopping Now (Offline)" : "I'm Shopping Now"}
          className="w-full"
          disabled={isOffline}
        />
      </View>

      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
      />

      <ItemDetailsSheet
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onToggleComplete={handleToggleComplete}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}
