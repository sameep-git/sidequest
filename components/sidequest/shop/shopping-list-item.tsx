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
            className="rounded-2xl border px-4 py-4 mb-3"
            style={{ backgroundColor: '#2a2a2a', borderColor: '#333' }}
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
                        className="h-6 w-6 items-center justify-center rounded-full border-2"
                        style={{ borderColor: isCompleted ? '#0F8' : '#444' }}
                    >
                        {isCompleted && (
                            <View className="h-3 w-3 rounded-full" style={{ backgroundColor: '#0F8' }} />
                        )}
                    </View>
                </Pressable>

                {/* Content */}
                <View className="flex-1">
                    {/* Top Row: Name + Chips */}
                    <View className="flex-row items-center flex-wrap gap-2">
                        <Text
                            className={`text-base font-semibold ${isCompleted ? 'text-white/50 line-through' : 'text-white'}`}
                        >
                            {item.name}
                        </Text>

                        {/* Bounty Chip */}
                        {item.bounty_amount != null && item.bounty_amount > 0 && (
                            <View
                                className="flex-row items-center rounded-full px-2.5 py-1"
                                style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)', borderWidth: 1, borderColor: '#f97316' }}
                            >
                                <Flame size={12} color="#f97316" />
                                <Text className="ml-1 text-xs font-bold" style={{ color: '#f97316' }}>
                                    +${item.bounty_amount.toFixed(2)}
                                </Text>
                            </View>
                        )}

                        {/* Claimed By Chip */}
                        {purchaserName && (
                            <View
                                className="flex-row items-center rounded-full px-2.5 py-1"
                                style={{ backgroundColor: 'rgba(15, 248, 136, 0.2)', borderWidth: 1, borderColor: '#0F8' }}
                            >
                                <User size={12} color="#0F8" />
                                <Text className="ml-1 text-xs font-semibold" style={{ color: '#0F8' }}>
                                    {purchaserName}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Bottom Row: Category */}
                    {item.category && (
                        <Text className="mt-1.5 text-xs" style={{ color: '#888' }}>
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
