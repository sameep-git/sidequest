import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { useHouseholdStore } from '@/lib/household-store';
import { debtService, transactionService } from '@/lib/services';
import type { DebtLedger, Transaction } from '@/lib/types';
import { useFocusEffect } from 'expo-router';
import { DollarSign, ShoppingCart, Star, Trophy, UserPlus } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HouseholdInvite } from '../household-invite';


export function ProfileTab() {
  const householdId = useHouseholdStore((state) => state.householdId);
  const houseName = useHouseholdStore((state) => state.houseName);
  const members = useHouseholdStore((state) => state.members);
  const { user, isLoading: isAuthLoading } = useSupabaseUser();
  const [debts, setDebts] = useState<DebtLedger[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const memberLookup = useMemo(() => {
    const palette = ['#0F8', '#8b5cf6', '#3b82f6', '#f97316', '#ec4899'];
    return members.reduce<Map<string, { name: string; color: string; venmo: string | null }>>((map, entry, index) => {
      const id = entry.profile?.id ?? entry.member.user_id;
      if (!id) {
        return map;
      }
      const color = palette[index % palette.length];
      const name = entry.profile?.display_name ?? entry.profile?.email ?? 'Roommate';
      map.set(id, { name, color, venmo: entry.profile?.venmo_handle ?? null });
      return map;
    }, new Map());
  }, [members]);

  const currentMember = useMemo(
    () => members.find((entry) => entry.member.user_id === user?.id),
    [members, user?.id]
  );

  const displayName = currentMember?.profile?.display_name ?? user?.email ?? 'You';
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
    setIsLoading(true);
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
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      const cleanup = fetchData();
      return cleanup;
    }, [fetchData])
  );

  const debtsYouOwe = useMemo(
    () => (user ? debts.filter((debt) => !debt.is_settled && debt.borrower_id === user.id) : []),
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

  const reliabilityScore = totalSpent > 0
    ? Math.max(55, Math.min(100, 100 - amountYouOwe + amountOwedToYou * 0.3))
    : null;
  const reliabilityDescription =
    amountYouOwe === 0
      ? 'All expenses are settled. Keep it up!'
      : 'Settle outstanding IOUs to keep your score high.';

  const stats = [
    { label: 'Trips Logged', value: String(tripsLogged), Icon: ShoppingCart, color: '#0F8' },
    { label: 'Total Spent', value: `$${totalSpent.toFixed(0)}`, Icon: DollarSign, color: '#0F8' },
    { label: 'You Are Owed', value: `$${amountOwedToYou.toFixed(2)}`, Icon: Trophy, color: '#facc15' },
    { label: 'You Owe', value: `$${amountYouOwe.toFixed(2)}`, Icon: Star, color: '#8b5cf6' },
  ];

  const handlePayWithVenmo = (lenderId: string, amount: number) => {
    const target = memberLookup.get(lenderId);
    if (target?.venmo) {
      Alert.alert('Venmo', `Opening Venmo to pay ${target.name} $${amount.toFixed(2)} (@${target.venmo})`);
      return;
    }
    Alert.alert('Heads up', `${target?.name ?? 'Roommate'} has not added a Venmo handle yet.`);
  };

  const handleRemindRoommate = (borrowerId: string, amount: number) => {
    const target = memberLookup.get(borrowerId);
    Alert.alert('Reminder sent', `Pinged ${target?.name ?? 'your roommate'} about $${amount.toFixed(2)}.`);
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
        <Text className="text-center text-white">Sign in to view your Sidequest profile.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: '#222' }}>
      <ScrollView className="flex-1" contentContainerClassName="pb-10" showsVerticalScrollIndicator={false}>
        <View className="items-center border-b py-8" style={{ backgroundColor: '#2a2a2a', borderBottomColor: '#333' }}>
          <View
            className="mb-3 h-[88px] w-[88px] items-center justify-center rounded-full"
            style={{ backgroundColor: '#0F8' }}
          >
            <Text className="text-4xl font-semibold text-black">{initials}</Text>
          </View>
          <Text className="text-2xl font-semibold text-white">{displayName}</Text>
          <Text className="mt-1 text-sm text-white/70">
            {memberSince ? `Member since ${memberSince}` : householdId ? `Member of ${houseName || 'your house'}` : 'Add a household'}
          </Text>
          {householdId && (
            <Pressable
              onPress={() => setShowInvite(true)}
              className="mt-4 flex-row items-center rounded-full border border-[#0F8] bg-[#0F8]/10 px-4 py-2"
            >
              <UserPlus size={16} color="#0F8" />
              <Text className="ml-2 font-semibold" style={{ color: '#0F8' }}>
                Invite Roommates
              </Text>
            </Pressable>
          )}
        </View>

        <View className="flex-row flex-wrap justify-between px-6 pt-6">
          {stats.map((item) => (
            <View
              key={item.label}
              className="mb-3 w-[48%] rounded-2xl border p-4"
              style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}
            >
              <View className="mb-3 h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}33` }}>
                <item.Icon size={24} color={item.color} />
              </View>
              <Text className="text-xl font-semibold text-white">{item.value}</Text>
              <Text className="mt-1 text-xs" style={{ color: '#888' }}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Household Members Section */}
        {householdId && members.length > 0 && (
          <View className="mx-6 mb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-semibold text-white">Household Members</Text>
              <Text className="text-xs" style={{ color: '#888' }}>{houseName}</Text>
            </View>
            <View className="rounded-2xl border p-4" style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
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
                      className="flex-row items-center py-2"
                      style={{ borderBottomWidth: index < members.length - 1 ? 1 : 0, borderBottomColor: '#333' }}
                    >
                      <View
                        className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: color }}
                      >
                        <Text className="text-sm font-semibold text-white">{name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-medium text-white">
                          {name} {isCurrentUser && <Text style={{ color: '#0F8' }}>(You)</Text>}
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
                              style={{ color: netAmount > 0 ? '#0F8' : '#f97316' }}
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
                  className="rounded-xl p-3"
                  style={{ backgroundColor: '#2a2a2a' }}
                >
                  <Text className="text-xs mb-2" style={{ color: '#888' }}>Your Balance</Text>
                  <View className="flex-row items-center justify-between">
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold" style={{ color: '#0F8' }}>
                        ${amountOwedToYou.toFixed(2)}
                      </Text>
                      <Text className="text-xs" style={{ color: '#666' }}>Owed to you</Text>
                    </View>
                    <View className="h-8 w-px" style={{ backgroundColor: '#444' }} />
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold" style={{ color: '#f97316' }}>
                        ${amountYouOwe.toFixed(2)}
                      </Text>
                      <Text className="text-xs" style={{ color: '#666' }}>You owe</Text>
                    </View>
                    <View className="h-8 w-px" style={{ backgroundColor: '#444' }} />
                    <View className="items-center flex-1">
                      <Text
                        className="text-lg font-bold"
                        style={{ color: amountOwedToYou - amountYouOwe >= 0 ? '#0F8' : '#f97316' }}
                      >
                        {amountOwedToYou - amountYouOwe >= 0 ? '+' : ''}${(amountOwedToYou - amountYouOwe).toFixed(2)}
                      </Text>
                      <Text className="text-xs" style={{ color: '#666' }}>Net</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {reliabilityScore !== null && (
          <View className="mx-6 mb-4 rounded-3xl border p-4" style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-semibold text-white">Reliability Score</Text>
              <Text className="font-semibold" style={{ color: '#0F8' }}>
                {reliabilityScore.toFixed(0)}%
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: '#333' }}>
              <View className="h-full" style={{ backgroundColor: '#0F8', width: `${reliabilityScore}%` }} />
            </View>
            <Text className="mt-3 text-sm text-white/70">{reliabilityDescription}</Text>
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

        {debtsYouOwe.length > 0 && (
          <View className="mb-4 px-6">
            <Text className="mb-3 text-sm" style={{ color: '#888' }}>
              You Owe
            </Text>
            <View className="gap-3">
              {debtsYouOwe.map((debt) => {
                const lender = memberLookup.get(debt.lender_id);
                const lenderName = lender?.name ?? 'Roommate';
                return (
                  <View
                    key={debt.id}
                    className="rounded-2xl border p-4"
                    style={{ backgroundColor: '#2a2a2a', borderColor: '#333' }}
                  >
                    <View className="mb-3 flex-row items-center">
                      <View
                        className="mr-3 h-11 w-11 items-center justify-center rounded-full"
                        style={{ backgroundColor: lender?.color ?? '#0F8' }}
                      >
                        <Text className="text-base font-semibold text-white">{lenderName.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text className="font-semibold text-white">You owe {lenderName}</Text>
                        <Text className="mt-1 text-2xl font-semibold text-white">${debt.amount.toFixed(2)}</Text>
                      </View>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handlePayWithVenmo(debt.lender_id, debt.amount)}
                      className="items-center justify-center rounded-2xl py-3"
                      style={({ pressed }) => ({ backgroundColor: '#008CFF', opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text className="font-semibold text-white">Pay with Venmo</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {debtsOwedToYou.length > 0 && (
          <View className="mb-4 px-6">
            <Text className="mb-3 text-sm" style={{ color: '#888' }}>
              You're Owed
            </Text>
            <View className="gap-3">
              {debtsOwedToYou.map((debt) => {
                const borrower = memberLookup.get(debt.borrower_id);
                const borrowerName = borrower?.name ?? 'Roommate';
                return (
                  <View
                    key={debt.id}
                    className="rounded-2xl border p-4"
                    style={{ backgroundColor: '#1f1f1f', borderColor: '#333' }}
                  >
                    <View className="mb-3 flex-row items-center">
                      <View
                        className="mr-3 h-11 w-11 items-center justify-center rounded-full"
                        style={{ backgroundColor: borrower?.color ?? '#0F8' }}
                      >
                        <Text className="text-base font-semibold text-white">{borrowerName.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text className="font-semibold text-white">{borrowerName} owes you</Text>
                        <Text className="mt-1 text-2xl font-semibold" style={{ color: '#0F8' }}>
                          ${debt.amount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs" style={{ color: '#777' }}>
                        Pending
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleRemindRoommate(debt.borrower_id, debt.amount)}
                        className="rounded-full px-3 py-1"
                        style={{ backgroundColor: '#333' }}
                      >
                        <Text className="text-xs font-semibold text-white">Nudge</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {!debtsYouOwe.length && !debtsOwedToYou.length && !isLoading && (
          <View className="px-6">
            <View className="items-center rounded-2xl border p-6" style={{ backgroundColor: '#2a2a2a', borderColor: '#333' }}>
              <Text className="text-5xl">💳</Text>
              <Text className="mt-3 text-xl font-semibold text-white">No Debts</Text>
              <Text className="mt-2 text-sm" style={{ color: '#888' }}>
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
    </SafeAreaView>
  );
}

