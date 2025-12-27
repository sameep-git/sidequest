import { DollarSign, Plus, Trophy } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type HomeTabProps = {
  houseName: string;
};

const roommates = [
  { id: 1, name: 'Sameep', initial: 'S', color: '#0F8', spent: 145, trips: 8 },
  { id: 2, name: 'Alex', initial: 'A', color: '#8b5cf6', spent: 120, trips: 6 },
  { id: 3, name: 'Jordan', initial: 'J', color: '#3b82f6', spent: 98, trips: 5 },
];

const feed = [
  { id: 1, type: 'added', user: 'Sameep', item: 'Milk', time: '2 hours ago', icon: '🥛' },
  { id: 2, type: 'payment', user: 'Alex', recipient: 'Sameep', amount: 12.5, time: '3 hours ago' },
  { id: 3, type: 'claimed', user: 'Jordan', item: 'Eggs', bounty: 2.0, time: '5 hours ago', icon: '🥚' },
  { id: 4, type: 'added', user: 'Alex', item: 'Bread', time: '1 day ago', icon: '🍞' },
  { id: 5, type: 'completed', user: 'Sameep', items: 8, amount: 45.2, time: '1 day ago' },
];

export function HomeTab({ houseName }: HomeTabProps) {
  const maxSpent = Math.max(...roommates.map((r) => r.spent));
  const insets = useSafeAreaInsets();
  const iosMajorVersion = Platform.OS === 'ios' ? Number.parseInt(String(Platform.Version), 10) : null;
  const tabBarClearance = Platform.OS !== 'ios' || (iosMajorVersion != null && iosMajorVersion >= 26) ? 88 : 0;

  return (
    <SafeAreaView className="flex-1 bg-[#222]" edges={['top']}>
      <View className="flex-1">
        <View className="border-b border-[#333] bg-[#2a2a2a] px-6 pb-6 pt-6">
          <Text className="mb-1 text-sm text-[#888]">Your Household</Text>
          <Text className="mb-4 text-[28px] font-bold text-white">{houseName}</Text>

          <View className="rounded-[22px] border border-[#333] bg-[#1a1a1a] p-5">
            <View className="mb-3 flex-row items-center">
              <Trophy size={18} color="#0F8" />
              <Text className="ml-2 text-base font-semibold text-white">Top Contributors</Text>
            </View>

            <View>
              {roommates.map((roommate, index) => (
                <View
                  key={roommate.id}
                  className="flex-row items-center"
                  style={{ marginBottom: index === roommates.length - 1 ? 0 : 14 }}
                >
                  <Text className="w-4 text-[#888]">{index + 1}</Text>
                  <View className="mr-2 h-10 w-10 items-center justify-center rounded-full border-2 border-[#333] bg-[#111]">
                    <Text className="text-base font-bold" style={{ color: roommate.color }}>
                      {roommate.initial}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <View className="mb-1 flex-row justify-between">
                      <Text className="font-semibold text-white">{roommate.name}</Text>
                      <Text className="text-[#888]">${roommate.spent}</Text>
                    </View>
                    <ProgressBar value={(roommate.spent / maxSpent) * 100} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="flex-1 px-6 pt-4" style={{ paddingBottom: 0 }}>
          <Text className="mb-3 uppercase tracking-wider text-[#aaa]">Recent Activity</Text>
          <ScrollView
            contentInsetAdjustmentBehavior={tabBarClearance > 0 ? 'automatic' : 'never'}
            contentInset={tabBarClearance > 0 ? { bottom: 24 } : undefined}
            scrollIndicatorInsets={tabBarClearance > 0 ? { bottom: 24 } : { bottom: 0 }}
            contentContainerStyle={{ paddingBottom: tabBarClearance > 0 ? 24 : 12, marginBottom: 0 }}
            style={{ marginBottom: 0 }}
            showsVerticalScrollIndicator={false}
          >
            {feed.map((event, index) => (
              <View
                key={event.id}
                className="rounded-[18px] border border-[#333] bg-[#2a2a2a] p-4"
                style={{ marginBottom: index === feed.length - 1 ? 0 : 12 }}
              >
                {event.type === 'added' && (
                  <View className="flex-row items-center">
                    <Text className="mr-3 text-2xl">{event.icon}</Text>
                    <View className="flex-1">
                      <Text className="text-[15px] text-white">
                        <Text className="font-semibold text-[#0F8]">{event.user}</Text> added {event.item}
                      </Text>
                      <Text className="mt-1 text-xs text-[#777]">{event.time}</Text>
                    </View>
                  </View>
                )}

                {event.type === 'payment' && (
                  <View className="flex-row items-center">
                    <View
                      className="mr-3 h-9 w-9 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: 'rgba(15, 248, 136, 0.2)' }}
                    >
                      <DollarSign size={16} color="#0F8" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] text-white">
                        <Text className="font-semibold text-[#0F8]">{event.user}</Text> paid{' '}
                        <Text className="font-semibold text-[#0F8]">{event.recipient}</Text> ${event.amount}
                      </Text>
                      <Text className="mt-1 text-xs text-[#777]">{event.time}</Text>
                    </View>
                  </View>
                )}

                {event.type === 'claimed' && (
                  <View className="flex-row items-center">
                    <Text className="mr-3 text-2xl">{event.icon}</Text>
                    <View className="flex-1">
                      <Text className="text-[15px] text-white">
                        <Text className="font-semibold text-[#0F8]">{event.user}</Text> claimed {event.item}{' '}
                        <Text className="font-semibold text-[#f6b044]">+${event.bounty?.toFixed(2)}</Text>
                      </Text>
                      <Text className="mt-1 text-xs text-[#777]">{event.time}</Text>
                    </View>
                  </View>
                )}

                {event.type === 'completed' && (
                  <View className="flex-row items-center">
                    <View
                      className="mr-3 h-9 w-9 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: 'rgba(15, 248, 136, 0.2)' }}
                    >
                      <Text className="font-bold text-[#0F8]">✓</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] text-white">
                        <Text className="font-semibold text-[#0F8]">{event.user}</Text> completed a shopping trip{' '}
                        <Text className="text-[#777]">({event.items} items, ${event.amount})</Text>
                      </Text>
                      <Text className="mt-1 text-xs text-[#777]">{event.time}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        <Pressable
          className="absolute right-6 h-14 w-14 items-center justify-center rounded-full bg-[#0F8]"
          style={{
            bottom: insets.bottom + tabBarClearance,
            shadowColor: '#0F8',
            shadowOpacity: 0.45,
            shadowRadius: 10,
          }}
        >
          <Plus size={24} color="#000" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ProgressBar({ value }: { value: number }) {
  const percent = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <View className="h-1.5 rounded-full bg-[#333]">
      <View className="h-full rounded-full bg-[#0F8]" style={{ width: `${percent}%` }} />
    </View>
  );
}
