import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
    roommates: Roommate[];
    roommateTotals: Record<string, number>;
    onDone: () => void;
    insets: EdgeInsets;
    tabBarClearance: number;
};

export function SummaryView({
    totalAmount,
    yourShare,
    youAreOwed,
    roommates,
    roommateTotals,
    onDone,
    insets,
    tabBarClearance,
}: SummaryViewProps) {
    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-[#222]">
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
                    onPress={onDone}
                >
                    <Text className="font-semibold text-black">Done</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
