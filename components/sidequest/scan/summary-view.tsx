import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';
import { EdgeInsets, SafeAreaView } from 'react-native-safe-area-context';

type Roommate = {
    id: string;
    name: string;
    initial: string;
    color: string;
    venmo: string | null;
};

type SummaryViewProps = {
    totalAmount: number;
    yourShare: number;
    youAreOwed: number;
    earnedBounty: number;
    roommates: Roommate[];
    roommateTotals: Record<string, number>;
    roommateBounties: Record<string, number>;
    onDone: () => void;
    insets: EdgeInsets;
    tabBarClearance: number;
};

export function SummaryView({
    totalAmount,
    yourShare,
    youAreOwed,
    earnedBounty,
    roommates,
    roommateTotals,
    roommateBounties,
    onDone,
    insets,
    tabBarClearance,
}: SummaryViewProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const checkColor = isDark ? '#0F8' : '#10b981';

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-white dark:bg-[#222]">
            <View className="items-center pb-8 pt-8 bg-emerald-500 dark:bg-[#0F8]">
                <View className="h-20 w-20 items-center justify-center rounded-full bg-white/20 mb-4">
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-black">
                        <Check size={32} color={checkColor} strokeWidth={3} />
                    </View>
                </View>
                <Text className="text-2xl font-bold text-white dark:text-black">Receipt Posted!</Text>
                <Text className="mt-2 text-sm font-medium text-white/90 dark:text-black/80">Your roommates have been notified</Text>
            </View>

            <ScrollView contentContainerClassName="px-6 py-6 pb-0" showsVerticalScrollIndicator={false}>
                <View className="rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-[#333] dark:bg-[#2a2a2a]">
                    <Text className="mb-4 text-lg font-bold text-black dark:text-white">Summary</Text>

                    <View className="mb-3 flex-row items-center justify-between">
                        <Text className="text-base text-gray-600 dark:text-gray-300">You paid</Text>
                        <Text className="text-base font-semibold text-black dark:text-white">${totalAmount.toFixed(2)}</Text>
                    </View>

                    <View className="mb-3 flex-row items-center justify-between">
                        <Text className="text-base text-gray-600 dark:text-gray-300">Your share</Text>
                        <Text className="text-base font-semibold text-black dark:text-white">${yourShare.toFixed(2)}</Text>
                    </View>

                    {earnedBounty > 0 && (
                        <View className="mb-3 flex-row items-center justify-between">
                            <Text className="text-base text-emerald-600 dark:text-emerald-400 font-medium">Bounty Earned</Text>
                            <Text className="text-base font-bold text-emerald-600 dark:text-[#0F8]">+${earnedBounty.toFixed(2)}</Text>
                        </View>
                    )}

                    <View className="my-3 h-px bg-gray-200 dark:bg-[#444]" />

                    <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-black dark:text-white">You are owed</Text>
                        <Text className="text-xl font-bold text-emerald-600 dark:text-[#0F8]">
                            ${(youAreOwed + earnedBounty).toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View className="mt-4 rounded-3xl border border-gray-200 bg-gray-50 p-4 dark:border-[#0F8] dark:bg-[#2a2a2a]">
                    <Text className="mb-3 font-semibold text-black dark:text-white">Breakdown by Roommate</Text>
                    <View className="gap-3">
                        {roommates.map((roommate) => {
                            const shareAmount = roommateTotals[roommate.id] || 0;
                            const bountyAmount = roommateBounties[roommate.id] || 0;
                            const totalOwed = shareAmount + bountyAmount;

                            return (
                                <View key={roommate.id} className="flex-row items-center justify-between">
                                    <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: roommate.color }}>
                                        <Text className="text-base font-semibold text-black">{roommate.initial}</Text>
                                    </View>
                                    <View className="ml-3 flex-1">
                                        <Text className="text-[15px] font-semibold text-black dark:text-white">{roommate.name}</Text>
                                        {bountyAmount > 0 && (
                                            <Text className="text-xs text-orange-500 dark:text-[#f59e0b]">
                                                incl. ${bountyAmount.toFixed(2)} bounty
                                            </Text>
                                        )}
                                    </View>
                                    <Text className="font-semibold text-gray-600 dark:text-white/70">${totalOwed.toFixed(2)}</Text>
                                </View>
                            );
                        })}
                        {!roommates.length && (
                            <Text className="text-sm text-gray-500 dark:text-white/60">Invite roommates to start tracking splits.</Text>
                        )}
                    </View>
                </View>

                <View className="h-6" />
            </ScrollView>

            <View className="px-6" style={{ paddingBottom: insets.bottom + tabBarClearance }}>
                <Pressable
                    accessibilityRole="button"
                    className="items-center justify-center rounded-2xl py-4 bg-emerald-500 dark:bg-[#0F8]"
                    onPress={onDone}
                >
                    <Text className="font-semibold text-white dark:text-black">Done</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
