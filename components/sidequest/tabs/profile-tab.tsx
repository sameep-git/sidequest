import { DollarSign, ShoppingCart, Star, Trophy } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockDebts = [
  { id: 1, name: 'Alex', amount: 15.0, color: '#8b5cf6' },
  { id: 2, name: 'Jordan', amount: 8.5, color: '#3b82f6' },
];

const mockOwed = [
  { id: 1, name: 'Sameep', amount: 12.5, color: '#0F8' },
];

const stats: Array<{
  label: string;
  value: string;
  Icon: typeof ShoppingCart;
  color: string;
}> = [
  { label: 'Trips Made', value: '8', Icon: ShoppingCart, color: '#0F8' },
  { label: 'Bounties Claimed', value: '12', Icon: Trophy, color: '#facc15' },
  { label: 'Total Spent', value: '$145', Icon: DollarSign, color: '#0F8' },
  { label: 'Reliability', value: '92%', Icon: Star, color: '#8b5cf6' },
];

export function ProfileTab() {
  const handlePayWithVenmo = (name: string, amount: number) => {
    Alert.alert('Venmo', `Opening Venmo to pay ${name} $${amount.toFixed(2)}`);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: '#222' }}>
      <ScrollView className="flex-1" contentContainerClassName="pb-10" showsVerticalScrollIndicator={false}>
        <View className="items-center border-b py-8" style={{ backgroundColor: '#2a2a2a', borderBottomColor: '#333' }}>
          <View className="mb-3 h-[88px] w-[88px] items-center justify-center rounded-full" style={{ backgroundColor: '#0F8' }}>
            <Text className="text-4xl font-semibold text-black">Y</Text>
          </View>
          <Text className="text-2xl font-semibold text-white">You</Text>
          <Text className="mt-1 text-sm text-white/70">Member since Dec 2024</Text>
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

        <View className="mx-6 mb-4 rounded-3xl border p-4" style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-semibold text-white">Reliability Score</Text>
            <Text className="font-semibold" style={{ color: '#0F8' }}>
              92%
            </Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: '#333' }}>
            <View className="h-full" style={{ backgroundColor: '#0F8', width: '92%' }} />
          </View>
          <Text className="mt-3 text-sm text-white/70">
            Based on completed trips, claimed bounties, and payment history. Keep it up! 🎉
          </Text>
        </View>

        {mockDebts.length > 0 && (
          <View className="mb-4 px-6">
            <Text className="mb-3 text-sm" style={{ color: '#888' }}>
              You Owe
            </Text>
            <View className="gap-3">
              {mockDebts.map((debt) => (
                <View
                  key={debt.id}
                  className="rounded-2xl border p-4"
                  style={{ backgroundColor: '#2a2a2a', borderColor: '#333' }}
                >
                  <View className="mb-3 flex-row items-center">
                    <View className="mr-3 h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: debt.color }}>
                      <Text className="text-base font-semibold text-white">{debt.name[0]}</Text>
                    </View>
                    <View>
                      <Text className="font-semibold text-white">You owe {debt.name}</Text>
                      <Text className="mt-1 text-2xl font-semibold text-white">${debt.amount.toFixed(2)}</Text>
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handlePayWithVenmo(debt.name, debt.amount)}
                    className="items-center justify-center rounded-2xl py-3"
                    style={({ pressed }) => ({ backgroundColor: '#008CFF', opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="font-semibold text-white">Pay with Venmo</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        {mockOwed.length > 0 && (
          <View className="mb-4 px-6">
            <Text className="mb-3 text-sm" style={{ color: '#888' }}>
              You're Owed
            </Text>
            <View className="gap-3">
              {mockOwed.map((owed) => (
                <View
                  key={owed.id}
                  className="rounded-2xl border p-4"
                  style={{ backgroundColor: '#1f1f1f', borderColor: '#333' }}
                >
                  <View className="mb-3 flex-row items-center">
                    <View className="mr-3 h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: owed.color }}>
                      <Text className="text-base font-semibold text-white">{owed.name[0]}</Text>
                    </View>
                    <View>
                      <Text className="font-semibold text-white">{owed.name} owes you</Text>
                      <Text className="mt-1 text-2xl font-semibold" style={{ color: '#0F8' }}>
                        ${owed.amount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs" style={{ color: '#777' }}>
                    Pending
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {!mockDebts.length && !mockOwed.length && (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#0F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    color: '#aaa',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 24,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginBottom: 12,
  },
  statIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
  },
  reliabilityCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  reliabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reliabilityTitle: {
    color: '#fff',
    fontWeight: '700',
  },
  reliabilityValue: {
    color: '#0F8',
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 6,
    backgroundColor: '#333',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0F8',
  },
  reliabilityText: {
    color: '#aaa',
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#888',
    marginBottom: 12,
  },
  debtCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginBottom: 12,
  },
  owedCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginBottom: 12,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitialSmall: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  debtLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  debtAmount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  debtAmountAccent: {
    color: '#0F8',
    fontSize: 22,
    fontWeight: '700',
  },
  venmoButton: {
    backgroundColor: '#008CFF',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  venmoText: {
    color: '#fff',
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  status: {
    color: '#777',
    fontSize: 12,
  },
  emptyState: {
    backgroundColor: '#2a2a2a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#333',
    padding: 24,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#888',
  },
});
