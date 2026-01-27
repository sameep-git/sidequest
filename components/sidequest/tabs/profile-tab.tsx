import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { useHouseholdStore } from '@/lib/household-store';
import { debtService, transactionService } from '@/lib/services';
import type { DebtLedger, Transaction } from '@/lib/types';
import { getDisplayName } from '@/lib/utils/display-name';
import { openVenmoPay, openVenmoRequest } from '@/lib/utils/venmo';
import { useFocusEffect } from 'expo-router';
import { DollarSign, Settings, ShoppingCart, UserPlus } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HouseholdInvite } from '../household-invite';
import { SettingsScreen } from '../settings-screen';


export function ProfileTab() {
  const { colorScheme } = useColorScheme();
  const householdId = useHouseholdStore((state) => state.householdId);
  const houseName = useHouseholdStore((state) => state.houseName);
  const members = useHouseholdStore((state) => state.members);
  const { user, isLoading: isAuthLoading } = useSupabaseUser();
  const [debts, setDebts] = useState<DebtLedger[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const memberLookup = useMemo(() => {
    const isDark = colorScheme === 'dark';
    const accentGreen = isDark ? '#0F8' : '#059669';
    const palette = [accentGreen, '#8b5cf6', '#3b82f6', '#f97316', '#ec4899'];
    return members.reduce<Map<string, { name: string; color: string; venmo: string | null }>>((map, entry, index) => {
      const id = entry.profile?.id ?? entry.member.user_id;
      if (!id) {
        return map;
      }
      const color = palette[index % palette.length];
      const name = getDisplayName(entry.profile?.display_name, entry.profile?.email, 'Roommate');
      map.set(id, { name, color, venmo: entry.profile?.venmo_handle ?? null });
      return map;
    }, new Map());
  }, [members]);

  const currentMember = useMemo(
    () => members.find((entry) => entry.member.user_id === user?.id),
    [members, user?.id]
  );

  const displayName = getDisplayName(currentMember?.profile?.display_name, user?.email, 'You');
  const initials = displayName.charAt(0).toUpperCase();
  const memberSince = currentMember?.member.joined_at
    ? new Date(currentMember.member.joined_at).toLocaleString('en-US', {
      month: 'short',
      year: 'numeric',
    })
    : null;

  const fetchData = useCallback(() => {
    if (!user?.id) return;
    let isMounted = true;
    setError(null);

    Promise.all([debtService.listByUser(user.id), transactionService.listByUser(user.id)])
      .then(([debtsData, transactionData]) => {
        if (!isMounted) return;
        setDebts(debtsData || []);
        setTransactions(transactionData || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load profile data.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      const cleanup = fetchData();
      return cleanup;
    }, [fetchData])
  );

  // Calculate NET balance per roommate
  // Positive = they owe you, Negative = you owe them
  const netBalances = useMemo(() => {
    if (!user) return [];

    const balanceMap = new Map<string, number>();

    debts.forEach((debt) => {
      if (debt.is_settled) return;

      if (debt.lender_id === user.id) {
        // They owe me (borrower owes me)
        const current = balanceMap.get(debt.borrower_id) || 0;
        balanceMap.set(debt.borrower_id, current + debt.amount);
      } else if (debt.borrower_id === user.id) {
        // I owe them (lender is owed by me)
        const current = balanceMap.get(debt.lender_id) || 0;
        balanceMap.set(debt.lender_id, current - debt.amount);
      }
    });

    return Array.from(balanceMap.entries())
      .filter(([_, net]) => Math.abs(net) > 0.01) // Filter out zero balances
      .map(([personId, netAmount]) => ({
        personId,
        netAmount, // positive = they owe me, negative = I owe them
      }));
  }, [debts, user]);

  // Keep legacy calculations for the stats cards
  const debtsYouOwe = useMemo(
    () => {
      if (!user) return [];
      const myDebts = debts.filter((debt) => !debt.is_settled && debt.borrower_id === user.id);

      // Aggregate by lender
      const aggregated = new Map<string, DebtLedger>();
      myDebts.forEach(debt => {
        const existing = aggregated.get(debt.lender_id);
        if (existing) {
          existing.amount += debt.amount;
        } else {
          aggregated.set(debt.lender_id, { ...debt });
        }
      });

      return Array.from(aggregated.values());
    },
    [debts, user?.id]
  );

  const debtsOwedToYou = useMemo(
    () => {
      if (!user) return [];
      const userDebts = debts.filter((debt) => !debt.is_settled && debt.lender_id === user.id);

      // Aggregate by borrower
      const aggregated = new Map<string, DebtLedger>();
      userDebts.forEach(debt => {
        const existing = aggregated.get(debt.borrower_id);
        if (existing) {
          existing.amount += debt.amount;
        } else {
          aggregated.set(debt.borrower_id, { ...debt });
        }
      });

      return Array.from(aggregated.values());
    },
    [debts, user?.id]
  );

  const amountYouOwe = debtsYouOwe.reduce((sum, debt) => sum + debt.amount, 0);
  const amountOwedToYou = debtsOwedToYou.reduce((sum, debt) => sum + debt.amount, 0);
  const totalSpent = transactions.reduce((sum, tx) => sum + tx.final_total, 0);
  const tripsLogged = transactions.length;



  const stats = [
    { label: 'Trips Logged', value: String(tripsLogged), Icon: ShoppingCart, color: colorScheme === 'dark' ? '#0F8' : '#059669' },
    { label: 'Total Spent', value: `$${totalSpent.toFixed(0)}`, Icon: DollarSign, color: colorScheme === 'dark' ? '#0F8' : '#059669' },
  ];

  const handlePayWithVenmo = async (lenderId: string, amount: number) => {
    const target = memberLookup.get(lenderId);
    if (!target?.venmo) {
      Alert.alert('Venmo handle missing', `${target?.name ?? 'Roommate'} hasn't added their Venmo handle yet. Ask them to add it in Settings.`);
      return;
    }

    const success = await openVenmoPay(
      target.venmo,
      amount,
      `Sidequest: Payment to ${target.name}`
    );

    if (!success) {
      Alert.alert('Could not open Venmo', 'Make sure Venmo is installed or try again.');
    }
  };

  const handleRequestWithVenmo = async (borrowerId: string, amount: number) => {
    const target = memberLookup.get(borrowerId);
    if (!target?.venmo) {
      Alert.alert('Venmo handle missing', `${target?.name ?? 'Roommate'} hasn't added their Venmo handle yet. Ask them to add it in Settings.`);
      return;
    }

    const success = await openVenmoRequest(
      target.venmo,
      amount,
      `Sidequest: Request from ${displayName}`
    );

    if (!success) {
      Alert.alert('Could not open Venmo', 'Make sure Venmo is installed or try again.');
    }
  };

  const handleSettleDebt = async (borrowerId: string, lenderId: string, otherPersonName: string) => {
    Alert.alert(
      'Mark as Settled',
      `Are you sure all debts with ${otherPersonName} are settled?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, All Settled',
          onPress: async () => {
            try {
              await debtService.settleAllDebts(borrowerId, lenderId);
              // Remove from local state
              setDebts((prev) => prev.filter((d) =>
                !(d.borrower_id === borrowerId && d.lender_id === lenderId)
              ));
            } catch {
              Alert.alert('Error', 'Failed to settle debts. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!user && isAuthLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center" style={{ backgroundColor: '#222' }}>
        <ActivityIndicator color="#0F8" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center px-6" style={{ backgroundColor: '#222' }}>
        <Text className="text-center text-white">Sign in to view your sidequest profile.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white dark:bg-[#222]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colorScheme === 'dark' ? '#0F8' : '#059669'}
          />
        }
      >
        <View className="items-center border-b border-gray-200 dark:border-[#333] py-8 bg-gray-50 dark:bg-[#2a2a2a]">
          {/* Settings Gear Button */}
          <Pressable
            onPress={() => setShowSettings(true)}
            className="absolute right-4 top-4 p-2"
            accessibilityLabel="Settings"
            hitSlop={20}
          >
            <Settings size={22} color="#888" />
          </Pressable>

          <View
            className="mb-3 h-[88px] w-[88px] items-center justify-center rounded-full bg-emerald-500 dark:bg-[#0F8]"
          >
            <Text className="text-4xl font-semibold text-white dark:text-black">{initials}</Text>
          </View>
          <Text className="text-2xl font-semibold text-black dark:text-white">{displayName}</Text>
          <Text className="mt-1 text-sm text-gray-600 dark:text-white/70">
            {memberSince ? `Member since ${memberSince}` : householdId ? `Member of ${houseName || 'your house'}` : 'Add a household'}
          </Text>
          {householdId && (
            <Pressable
              onPress={() => setShowInvite(true)}
              className="mt-4 flex-row items-center rounded-full border border-emerald-500 bg-emerald-50 px-4 py-2 dark:border-[#0F8] dark:bg-[#0F8]/10"
            >
              <UserPlus size={16} className="text-emerald-500 dark:text-[#0F8]" />
              <Text className="ml-2 font-semibold text-emerald-500 dark:text-[#0F8]">
                Invite Roommates
              </Text>
            </Pressable>
          )}
        </View>

        <View className="flex-row flex-wrap justify-between px-6 pt-6">
          {stats.map((item) => (
            <View
              key={item.label}
              className="mb-3 w-[48%] rounded-2xl border p-4 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333]"
            >
              <View
                className="mb-3 h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: colorScheme === 'dark'
                    ? 'rgba(0, 255, 136, 0.15)'
                    : 'rgba(5, 150, 105, 0.1)'
                }}
              >
                <item.Icon size={24} color={item.color} />
              </View>
              <Text className="text-xl font-semibold text-black dark:text-white">{item.value}</Text>
              <Text className="mt-1 text-xs text-gray-500 dark:text-[#888]">
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Household Members Section */}
        {householdId && members.length > 0 && (
          <View className="mx-6 mb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-semibold text-black dark:text-white">Household Members</Text>
              <Text className="text-xs text-gray-500 dark:text-[#888]">{houseName}</Text>
            </View>
            <View className="rounded-2xl border p-4 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333]">
              {/* Member List */}
              <View className="mb-4">
                {members.map((entry, index) => {
                  const id = entry.profile?.id ?? entry.member.user_id;
                  const name = entry.profile?.display_name ?? entry.profile?.email ?? 'Roommate';
                  const isCurrentUser = id === user?.id;
                  const palette = ['#0F8', '#8b5cf6', '#3b82f6', '#f97316', '#ec4899'];
                  const color = palette[index % palette.length];

                  // Calculate what this member owes/is owed
                  let owesAmount = 0;
                  let owedAmount = 0;
                  debts.forEach((debt) => {
                    if (!debt.is_settled) {
                      if (debt.borrower_id === id) owesAmount += debt.amount;
                      if (debt.lender_id === id) owedAmount += debt.amount;
                    }
                  });
                  const netAmount = owedAmount - owesAmount;

                  return (
                    <View
                      key={id}
                      className="flex-row items-center py-2 border-b border-gray-200 dark:border-[#333]"
                      style={{ borderBottomWidth: index < members.length - 1 ? 1 : 0 }}
                    >
                      <View
                        className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: color }}
                      >
                        <Text className="text-sm font-semibold text-white">{name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-medium text-black dark:text-white">
                          {name} {isCurrentUser && <Text className="text-emerald-500 dark:text-[#0F8]">(You)</Text>}
                        </Text>
                        <Text className="text-xs" style={{ color: '#888' }}>
                          {entry.member.role === 'admin' ? 'Admin' : 'Member'}
                        </Text>
                      </View>
                      <View className="items-end">
                        {netAmount !== 0 && (
                          <>
                            <Text
                              className="text-sm font-semibold"
                              style={{ color: netAmount > 0 ? (colorScheme === 'dark' ? '#0F8' : '#10b981') : '#f97316' }}
                            >
                              {netAmount > 0 ? '+' : ''}${netAmount.toFixed(2)}
                            </Text>
                            <Text className="text-xs" style={{ color: '#666' }}>
                              {netAmount > 0 ? 'owed' : 'owes'}
                            </Text>
                          </>
                        )}
                        {netAmount === 0 && owesAmount === 0 && owedAmount === 0 && (
                          <Text className="text-xs" style={{ color: '#666' }}>Settled</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Quick Summary */}
              {(amountYouOwe > 0 || amountOwedToYou > 0) && (
                <View
                  className="rounded-xl p-3 bg-gray-100 dark:bg-[#2a2a2a]"
                >
                  <Text className="text-xs mb-2 text-gray-500 dark:text-[#888]">Your Balance</Text>
                  <View className="flex-row items-center justify-between">
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold" style={{ color: colorScheme === 'dark' ? '#0F8' : '#059669' }}>
                        ${amountOwedToYou.toFixed(2)}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-[#666]">Owed to you</Text>
                    </View>
                    <View className="h-8 w-px bg-gray-300 dark:bg-[#444]" />
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold" style={{ color: '#f97316' }}>
                        ${amountYouOwe.toFixed(2)}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-[#666]">You owe</Text>
                    </View>
                    <View className="h-8 w-px bg-gray-300 dark:bg-[#444]" />
                    <View className="items-center flex-1">
                      <Text
                        className="text-lg font-bold"
                        style={{ color: amountOwedToYou - amountYouOwe >= 0 ? (colorScheme === 'dark' ? '#0F8' : '#059669') : '#f97316' }}
                      >
                        {amountOwedToYou - amountYouOwe >= 0 ? '+' : ''}${(amountOwedToYou - amountYouOwe).toFixed(2)}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-[#666]">Net</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}



        {isLoading && (
          <View className="items-center py-4">
            <ActivityIndicator color="#0F8" />
            <Text className="mt-2 text-sm text-white/70">Syncing with Supabase...</Text>
          </View>
        )}

        {error && (
          <View className="mx-6 mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
            <Text className="text-sm text-red-200">{error}</Text>
          </View>
        )}

        {/* Unified Balances Section */}
        {netBalances.length > 0 && (
          <View className="mb-4 px-6">
            <Text className="mb-3 text-sm text-gray-500 dark:text-[#888]">
              Balances
            </Text>
            <View className="gap-3">
              {netBalances.map(({ personId, netAmount }) => {
                const person = memberLookup.get(personId);
                const personName = person?.name ?? 'Roommate';
                const theyOweMe = netAmount > 0;
                const absAmount = Math.abs(netAmount);

                return (
                  <View
                    key={personId}
                    className="rounded-2xl border p-4 bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-[#333]"
                  >
                    <View className="mb-3 flex-row items-center">
                      <View
                        className="mr-3 h-11 w-11 items-center justify-center rounded-full"
                        style={{ backgroundColor: person?.color ?? '#0F8' }}
                      >
                        <Text className="text-base font-semibold text-white">{personName.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text className="font-semibold text-black dark:text-white">
                          {theyOweMe ? `${personName} owes you` : `You owe ${personName}`}
                        </Text>
                        <Text
                          className="mt-1 text-2xl font-semibold"
                          style={{ color: theyOweMe ? (colorScheme === 'dark' ? '#0F8' : '#059669') : '#f97316' }}
                        >
                          ${absAmount.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {/* Show Pay OR Request based on net balance */}
                    {theyOweMe ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleRequestWithVenmo(personId, absAmount)}
                        style={{
                          backgroundColor: '#008CFF',
                          borderRadius: 16,
                          paddingVertical: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Request on Venmo</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handlePayWithVenmo(personId, absAmount)}
                        style={{
                          backgroundColor: '#008CFF',
                          borderRadius: 16,
                          paddingVertical: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Pay with Venmo</Text>
                      </Pressable>
                    )}

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        // For settle, we need both borrower and lender
                        // If they owe me: borrower = personId, lender = me
                        // If I owe them: borrower = me, lender = personId
                        const borrowerId = theyOweMe ? personId : user!.id;
                        const lenderId = theyOweMe ? user!.id : personId;
                        handleSettleDebt(borrowerId, lenderId, personName);
                      }}
                      className="mt-2 items-center justify-center rounded-2xl py-2 bg-gray-100 dark:bg-[#333]"
                    >
                      <Text className="text-sm font-semibold text-emerald-600 dark:text-[#0F8]">Mark as All Settled</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {netBalances.length === 0 && !isLoading && (
          <View className="px-6">
            <View className="items-center rounded-2xl border p-6 bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-[#333]">
              <Text className="text-5xl">💳</Text>
              <Text className="mt-3 text-xl font-semibold text-black dark:text-white">No Debts</Text>
              <Text className="mt-2 text-sm text-gray-500 dark:text-[#888]">
                Peace and harmony in the house!
              </Text>
            </View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      <Modal visible={showInvite} transparent animationType="slide" onRequestClose={() => setShowInvite(false)}>
        <HouseholdInvite onClose={() => setShowInvite(false)} />
      </Modal>

      <Modal visible={showSettings} animationType="slide" onRequestClose={() => setShowSettings(false)}>
        {user && (
          <SettingsScreen
            user={{
              id: user.id,
              email: user.email ?? null,
              display_name: currentMember?.profile?.display_name ?? null,
              venmo_handle: currentMember?.profile?.venmo_handle ?? null,
            }}
            onClose={() => setShowSettings(false)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

