import { useHouseholdStore } from '@/lib/household-store';
import { ShoppingItem } from '@/lib/types';
import { Flame, Trash2, User } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

type ShoppingListItemProps = {
    item: ShoppingItem;
    onToggleComplete: (item: ShoppingItem) => void;
    onDelete: (id: string) => void;
};

export function ShoppingListItem({ item, onToggleComplete, onDelete }: ShoppingListItemProps) {
    const members = useHouseholdStore((state) => state.members);

    const purchaserName = useMemo(() => {
        if (!item.purchased_by) return null;
        const member = members.find(m => m.member.user_id === item.purchased_by);
        const name = member?.profile?.display_name ?? member?.profile?.email ?? 'Someone';
        return name.split(' ')[0]; // First name only
    }, [item.purchased_by, members]);

    const isCompleted = item.status === 'purchased';

    return (
        <View
            className="mb-3 rounded-2xl border border-gray-200 px-4 py-4 bg-white dark:border-[#333] dark:bg-[#2a2a2a]"
        >
            <View className="flex-row items-start">
                {/* Checkbox */}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={isCompleted ? 'Mark pending' : 'Mark complete'}
                    onPress={() => onToggleComplete(item)}
                    className="mr-3 p-1"
                >
                    <View
                        className={`h-6 w-6 items-center justify-center rounded-full border-2 ${isCompleted ? 'border-emerald-500 dark:border-[#0F8]' : 'border-gray-300 dark:border-[#444]'
                            }`}
                    >
                        {isCompleted && (
                            <View className="h-3 w-3 rounded-full bg-emerald-500 dark:bg-[#0F8]" />
                        )}
                    </View>
                </Pressable>

                {/* Content */}
                <View className="flex-1">
                    {/* Top Row: Name + Chips */}
                    <View className="flex-row items-center flex-wrap gap-2">
                        <Text
                            className={`text-base font-semibold ${isCompleted
                                    ? 'text-gray-400 line-through dark:text-white/50'
                                    : 'text-black dark:text-white'
                                }`}
                        >
                            {item.name}
                        </Text>

                        {/* Bounty Chip */}
                        {item.bounty_amount != null && item.bounty_amount > 0 && (
                            <View
                                className="flex-row items-center rounded-full border border-orange-500 bg-orange-50 px-2.5 py-1 dark:bg-orange-500/20"
                            >
                                <Flame size={12} color="#f97316" />
                                <Text className="ml-1 text-xs font-bold text-orange-500">
                                    +${item.bounty_amount.toFixed(2)}
                                </Text>
                            </View>
                        )}

                        {/* Claimed By Chip */}
                        {purchaserName && (
                            <View
                                className="flex-row items-center rounded-full border border-emerald-500 bg-emerald-50 px-2.5 py-1 dark:border-[#0F8] dark:bg-[#0F8]/20"
                            >
                                <User size={12} className="text-emerald-500 dark:text-[#0F8]" />
                                <Text className="ml-1 text-xs font-semibold text-emerald-500 dark:text-[#0F8]">
                                    {purchaserName}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Bottom Row: Category */}
                    {item.category && (
                        <Text className="mt-1.5 text-xs text-gray-500 dark:text-[#888]">
                            {item.category}
                        </Text>
                    )}
                </View>

                {/* Delete Button */}
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete item"
                    onPress={() => onDelete(item.id)}
                    className="p-2 -mr-2"
                >
                    <Trash2 size={18} color="#ff7f7f" />
                </Pressable>
            </View>
        </View>
    );
}
