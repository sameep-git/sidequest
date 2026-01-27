import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { useHouseholdStore } from '@/lib/household-store';
import { shoppingService, transactionService } from '@/lib/services';
import { locationService, type GroceryStore } from '@/lib/services/location-service';
import type { ShoppingItem, Transaction, TransactionItem } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import { DollarSign, Trophy, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

type HomeTabProps = {
  houseName: string;
};

type FeedEntry =
  | {
    id: string;
    kind: 'item';
    title: string;
    timestamp: string | null | undefined;
    bounty?: number | null;
  }
  | {
    id: string;
    kind: 'transaction';
    title: string;
    timestamp: string | null | undefined;
    amount: number;
    originalTxn: Transaction;
  };

export function HomeTab({ houseName }: HomeTabProps) {

  const iosMajorVersion = Platform.OS === 'ios' ? Number.parseInt(String(Platform.Version), 10) : null;
  const tabBarClearance = Platform.OS !== 'ios' || (iosMajorVersion != null && iosMajorVersion >= 26) ? 88 : 0;

  const { colorScheme } = useColorScheme();
  const householdId = useHouseholdStore((state) => state.householdId);
  const members = useHouseholdStore((state) => state.members);

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user } = useSupabaseUser();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  // Theme-aware accent color
  const isDark = colorScheme === 'dark';
  const accentGreen = isDark ? '#0F8' : '#059669';

  // Open navigation to a store using device's default map app
  const handleOpenNavigation = useCallback((store: GroceryStore) => {
    const { latitude, longitude, name } = store;
    const encodedName = encodeURIComponent(name);

    // Use Apple Maps on iOS, Google Maps on Android
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${encodedName}`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: `https://maps.google.com/maps?daddr=${latitude},${longitude}`,
    });

    Linking.openURL(url).catch(() => {
      // Fallback to Google Maps web if native fails
      Linking.openURL(`https://maps.google.com/maps?daddr=${latitude},${longitude}`);
    });
  }, []);
  const [txnItems, setTxnItems] = useState<TransactionItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [stores, setStores] = useState<GroceryStore[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (Platform.OS === 'ios' && user) {
      locationService.getCurrentLocation().then(loc => {
        if (loc) {
          setUserLocation(loc.coords);
          locationService.findNearbyStores().then(fetchedStores => {
            setStores(fetchedStores);
            // Start monitoring when we find them
            locationService.startGeofencing(fetchedStores);
          });
          // Register for push notifications
          import('@/lib/services/push-service').then(({ pushService }) => {
            pushService.registerForPushNotifications(user.id);
          });
        }
      });
    }
  }, [user]);

  const handleSelectTransaction = async (txn: Transaction) => {
    setSelectedTxn(txn);
    setLoadingItems(true);
    try {
      const items = await transactionService.getItems(txn.id);
      setTxnItems(items);
    } catch (e) {
      console.error('Failed to load items', e);
    } finally {
      setLoadingItems(false);
    }
  };

  const memberLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    members.forEach(({ member, profile }) => {
      const name = profile?.display_name || profile?.email || 'Roommate';
      lookup[member.user_id] = name;
    });
    return lookup;
  }, [members]);

  const fetchData = useCallback(async () => {
    if (!householdId) return;
    setRefreshing(true);
    setIsLoading(false);
    try {
      const [remoteItems, remoteTransactions] = await Promise.all([
        shoppingService.list(householdId),
        transactionService.listByHousehold(householdId),
      ]);
      setItems(remoteItems);
      setTransactions(remoteTransactions);
    } finally {
      setRefreshing(false);
    }
  }, [householdId]);

  useFocusEffect(
    useCallback(() => {
      if (!householdId) return;
      setIsLoading(true);
      fetchData().finally(() => setIsLoading(false));
    }, [fetchData, householdId])
  );

  const topContributors = useMemo(() => {
    if (!transactions.length) return [] as { userId: string; amount: number; name: string }[];

    const totals = new Map<string, number>();
    transactions.forEach((txn) => {
      totals.set(txn.payer_id, (totals.get(txn.payer_id) ?? 0) + txn.final_total);
    });

    return [...totals.entries()]
      .map(([userId, amount]) => ({
        userId,
        amount,
        name: memberLookup[userId] || 'Roommate',
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [transactions, memberLookup]);

  const feedEntries: FeedEntry[] = useMemo(() => {
    const entries: FeedEntry[] = [
      ...items.map((item) => ({
        id: `item-${item.id}`,
        kind: 'item' as const,
        title: `${item.name} added to the list`,
        timestamp: item.created_at,
        bounty: item.bounty_amount,
      })),
      ...transactions.map((txn) => ({
        id: `txn-${txn.id}`,
        kind: 'transaction' as const,
        title: `${memberLookup[txn.payer_id] || 'Roommate'} completed a trip`,
        timestamp: txn.created_at,
        amount: txn.final_total,
        originalTxn: txn,
      })),
    ];

    const parseTime = (value: string | null | undefined) => {
      if (!value) return 0;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    };

    return entries
      .sort((a, b) => parseTime(b.timestamp) - parseTime(a.timestamp))
      .slice(0, 12);
  }, [items, transactions, memberLookup]);

  const maxSpent = topContributors.length
    ? Math.max(...topContributors.map((contributor) => contributor.amount))
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#222]" edges={['top']}>
      <View className="flex-1">
        <View className="border-b border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#2a2a2a] px-6 pb-6 pt-6">
          <Text className="mb-1 text-sm text-gray-500 dark:text-[#888]">Your Household</Text>
          <Text className="mb-4 text-[28px] font-bold text-black dark:text-white">{houseName || 'Household'}</Text>

          <View className="rounded-[22px] border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] p-5">
            <View className="mb-3 flex-row items-center">
              <Trophy size={18} className="text-emerald-600 dark:text-[#0F8]" />
              <Text className="ml-2 text-base font-semibold text-black dark:text-white">Top Contributors</Text>
            </View>

            {topContributors.length === 0 ? (
              <Text className="text-sm text-[#777]">
                No trips yet. Scan a receipt to start earning bounties.
              </Text>
            ) : (
              topContributors.map((roommate, index) => (
                <View
                  key={roommate.userId}
                  className="flex-row items-center"
                  style={{ marginBottom: index === topContributors.length - 1 ? 0 : 14 }}
                >
                  <Text className="w-4 text-gray-400 dark:text-[#888]">{index + 1}</Text>
                  <View className="mr-2 h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 dark:border-[#333] bg-gray-100 dark:bg-[#111]">
                    <Text className="text-base font-bold text-black dark:text-white">
                      {roommate.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <View className="mb-1 flex-row justify-between">
                      <Text className="font-semibold text-black dark:text-white">{roommate.name}</Text>
                      <Text className="text-gray-500 dark:text-[#888]">${roommate.amount.toFixed(2)}</Text>
                    </View>
                    <ProgressBar value={maxSpent ? (roommate.amount / maxSpent) * 100 : 0} />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>




        <View className="flex-1 px-6 pt-4" style={{ paddingBottom: 0 }}>
          {Platform.OS === 'ios' && userLocation && (
            <View className="mb-6 h-48 overflow-hidden rounded-3xl border border-gray-200 dark:border-[#333]">
              <MapView
                provider={PROVIDER_DEFAULT}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.04,
                  longitudeDelta: 0.04,
                }}
                showsUserLocation
                userInterfaceStyle={isDark ? 'dark' : 'light'}
              >
                {stores.map((store, index) => (
                  <Marker
                    key={`${store.name}-${index}`}
                    coordinate={{ latitude: store.latitude, longitude: store.longitude }}
                    title={store.name}
                    description="Tap for directions"
                    pinColor={accentGreen}
                    onCalloutPress={() => handleOpenNavigation(store)}
                  >
                    <Callout tooltip={false}>
                      <View style={{ padding: 8, minWidth: 120 }}>
                        <Text style={{ fontWeight: '600', fontSize: 14, color: '#000' }}>{store.name}</Text>
                        <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Tap for directions →</Text>
                      </View>
                    </Callout>
                  </Marker>
                ))}
              </MapView>
            </View>
          )}


          <Text className="mb-3 uppercase tracking-wider text-gray-500 dark:text-[#aaa]">Recent Activity</Text>

          <ScrollView
            contentInsetAdjustmentBehavior={tabBarClearance > 0 ? 'automatic' : 'never'}
            contentInset={tabBarClearance > 0 ? { bottom: 24 } : undefined}
            scrollIndicatorInsets={tabBarClearance > 0 ? { bottom: 24 } : { bottom: 0 }}
            contentContainerStyle={{ paddingBottom: tabBarClearance > 0 ? 24 : 12, marginBottom: 0 }}
            style={{ marginBottom: 0 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={accentGreen} />}
          >
            {isLoading ? (
              <Text className="text-sm text-gray-500 dark:text-[#777]">Loading activity...</Text>
            ) : feedEntries.length === 0 ? (
              <Text className="text-sm text-gray-500 dark:text-[#777]">No activity yet.</Text>
            ) : (
              <View className="gap-4">
                {feedEntries.map((entry) => (
                  <Pressable
                    key={entry.id}
                    onPress={() => entry.kind === 'transaction' && handleSelectTransaction(entry.originalTxn)}
                    className="rounded-[18px] border border-gray-200 dark:border-[#333] bg-white dark:bg-[#2a2a2a] p-4"
                    style={({ pressed }) => ({
                      opacity: pressed && entry.kind === 'transaction' ? 0.7 : 1,
                    })}
                  >
                    {entry.kind === 'item' ? (
                      <View className="flex-row items-center">
                        <Text className="mr-3 text-2xl">🛒</Text>
                        <View className="flex-1">
                          <Text className="text-[15px] font-medium text-black dark:text-white">{entry.title}</Text>
                          <Text className="mt-1 text-xs text-gray-500 dark:text-[#777]">{timeAgo(entry.timestamp)}</Text>
                        </View>
                        {entry.bounty ? (
                          <Text className="font-semibold" style={{ color: '#f6b044' }}>
                            +${entry.bounty.toFixed(2)}
                          </Text>
                        ) : null}
                      </View>
                    ) : (
                      <View className="flex-row items-center">
                        <View
                          className="mr-3 h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-[#0F8]/20"
                        >
                          <DollarSign size={16} className="text-emerald-600 dark:text-[#0F8]" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[15px] font-medium text-black dark:text-white">{entry.title}</Text>
                          <Text className="mt-1 text-xs text-gray-500 dark:text-[#777]">{timeAgo(entry.timestamp)}</Text>
                        </View>
                        <Text className="font-semibold text-black dark:text-white">${entry.amount.toFixed(2)}</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </View>



        <Modal
          visible={!!selectedTxn}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedTxn(null)}
        >
          <View className="flex-1 bg-white dark:bg-[#222]">
            <View className="flex-row items-center justify-between border-b border-gray-200 dark:border-[#333] px-4 py-4">
              <Text className="text-lg font-bold text-black dark:text-white">Trip Details</Text>
              <Pressable
                onPress={() => setSelectedTxn(null)}
                className="p-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} className="text-black dark:text-white" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-6">
              <View className="mb-6">
                <Text className="text-sm text-gray-500 dark:text-[#888] mb-1">Paid by</Text>
                <View className="flex-row items-center">
                  <Text className="text-xl font-semibold text-black dark:text-white">
                    {selectedTxn ? (memberLookup[selectedTxn.payer_id] || 'Unknown') : ''}
                  </Text>
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-sm text-gray-500 dark:text-[#888] mb-1">Total</Text>
                <Text className="text-3xl font-bold text-emerald-600 dark:text-[#0F8]">
                  ${selectedTxn?.final_total.toFixed(2)}
                </Text>
              </View>

              <Text className="text-base font-semibold text-black dark:text-white mb-3">Items</Text>
              {loadingItems ? (
                <Text className="text-gray-500 dark:text-[#888]">Loading items...</Text>
              ) : txnItems.length === 0 ? (
                <Text className="text-gray-500 dark:text-[#888]">No item details available.</Text>
              ) : (
                <View className="gap-3">
                  {txnItems.map((item) => (
                    <View key={item.id} className="flex-row justify-between bg-gray-50 dark:bg-[#333] p-3 rounded-xl">
                      <Text className="text-black dark:text-white font-medium">{item.name}</Text>
                      <Text className="text-black dark:text-white">${item.price.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function timeAgo(timestamp: string | null | undefined) {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return formatDistanceToNow(date, { addSuffix: true });
}

function ProgressBar({ value }: { value: number }) {
  const percent = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <View className="h-1.5 rounded-full bg-gray-200 dark:bg-[#333]">
      <View className="h-full rounded-full bg-emerald-500 dark:bg-[#0F8]" style={{ width: `${percent}%` }} />
    </View>
  );
}
