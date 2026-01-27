import { useHouseholdStore } from '@/lib/household-store';
import { ShoppingItem } from '@/lib/types';
import { Check, Flame, Trash2, User, X } from 'lucide-react-native';
import { useMemo } from 'react';
import { Modal, Pressable, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ItemDetailsSheetProps = {
    item: ShoppingItem | null;
    onClose: () => void;
    onToggleComplete: (item: ShoppingItem) => void;
    onDelete: (id: string) => void;
};

export function ItemDetailsSheet({ item, onClose, onToggleComplete, onDelete }: ItemDetailsSheetProps) {
    const insets = useSafeAreaInsets();
    const members = useHouseholdStore((state) => state.members);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const accentGreen = isDark ? '#0F8' : '#059669';

    const requesterInfo = useMemo(() => {
        if (!item?.requested_by) return null;
        const member = members.find(m => m.member.user_id === item.requested_by);
        const name = member?.profile?.display_name ?? member?.profile?.email ?? 'Someone';
        const initial = name.charAt(0).toUpperCase();
        const palette = [accentGreen, '#8b5cf6', '#3b82f6', '#f97316', '#ec4899'];
        const colorIndex = members.findIndex(m => m.member.user_id === item.requested_by);
        const color = palette[colorIndex % palette.length] || accentGreen;
        return { name, initial, color };
    }, [item?.requested_by, members, accentGreen]);

    const purchaserName = useMemo(() => {
        if (!item?.purchased_by) return null;
        const member = members.find(m => m.member.user_id === item.purchased_by);
        return member?.profile?.display_name ?? member?.profile?.email ?? 'Someone';
    }, [item?.purchased_by, members]);

    if (!item) return null;

    const isCompleted = item.status === 'purchased';

    const handleToggle = () => {
        onToggleComplete(item);
        onClose();
    };

    const handleDelete = () => {
        onDelete(item.id);
        onClose();
    };

    return (
        <Modal
            visible={!!item}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-white dark:bg-[#222]">
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200 dark:border-[#333]">
                    <Text className="text-xl font-bold text-black dark:text-white">Item Details</Text>
                    <Pressable
                        onPress={onClose}
                        className="p-2 -mr-2 rounded-full bg-gray-100 dark:bg-[#333]"
                    >
                        <X size={20} className="text-gray-600 dark:text-white" />
                    </Pressable>
                </View>

                {/* Content */}
                <View className="flex-1 px-6 py-6">
                    {/* Item Name */}
                    <Text className="text-2xl font-bold text-black dark:text-white mb-6">
                        {item.name}
                    </Text>

                    {/* Details List */}
                    <View className="gap-4">
                        {/* Requested By */}
                        {requesterInfo && (
                            <View className="flex-row items-center">
                                <View
                                    className="h-10 w-10 rounded-full items-center justify-center mr-3"
                                    style={{ backgroundColor: requesterInfo.color }}
                                >
                                    <Text className="text-white font-semibold text-base">{requesterInfo.initial}</Text>
                                </View>
                                <View>
                                    <Text className="text-xs text-gray-500 dark:text-[#888]">Requested by</Text>
                                    <Text className="text-base font-semibold text-black dark:text-white">{requesterInfo.name}</Text>
                                </View>
                            </View>
                        )}

                        {/* Category */}
                        {item.category && (
                            <View className="flex-row items-center">
                                <View className="h-10 w-10 rounded-full items-center justify-center mr-3 bg-gray-200 dark:bg-[#333]">
                                    <Text className="text-gray-600 dark:text-white">📦</Text>
                                </View>
                                <View>
                                    <Text className="text-xs text-gray-500 dark:text-[#888]">Category</Text>
                                    <Text className="text-base font-semibold text-black dark:text-white">{item.category}</Text>
                                </View>
                            </View>
                        )}

                        {/* Bounty */}
                        {item.bounty_amount != null && item.bounty_amount > 0 && (
                            <View className="flex-row items-center">
                                <View className="h-10 w-10 rounded-full items-center justify-center mr-3 bg-orange-100 dark:bg-orange-500/20">
                                    <Flame size={20} color="#f97316" />
                                </View>
                                <View>
                                    <Text className="text-xs text-gray-500 dark:text-[#888]">Bounty</Text>
                                    <Text className="text-base font-bold text-orange-500">${item.bounty_amount.toFixed(2)}</Text>
                                </View>
                            </View>
                        )}

                        {/* Status */}
                        <View className="flex-row items-center">
                            <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 ${isCompleted ? 'bg-emerald-100 dark:bg-[#0F8]/20' : 'bg-gray-200 dark:bg-[#333]'}`}>
                                {isCompleted ? (
                                    <Check size={20} className="text-emerald-500 dark:text-[#0F8]" />
                                ) : (
                                    <User size={20} className="text-gray-500 dark:text-[#888]" />
                                )}
                            </View>
                            <View>
                                <Text className="text-xs text-gray-500 dark:text-[#888]">Status</Text>
                                <Text className={`text-base font-semibold ${isCompleted ? 'text-emerald-500 dark:text-[#0F8]' : 'text-black dark:text-white'}`}>
                                    {isCompleted ? `Purchased by ${purchaserName}` : 'Pending'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View className="px-6 gap-3" style={{ paddingBottom: insets.bottom + 16 }}>
                    <Pressable
                        onPress={handleToggle}
                        className={`items-center justify-center rounded-2xl py-4 ${isCompleted
                            ? 'bg-gray-200 dark:bg-[#333]'
                            : 'bg-emerald-500 dark:bg-[#0F8]'
                            }`}
                    >
                        <Text className={`font-semibold ${isCompleted ? 'text-black dark:text-white' : 'text-white dark:text-black'}`}>
                            {isCompleted ? 'Mark as Pending' : 'Mark as Purchased'}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={handleDelete}
                        className="items-center justify-center rounded-2xl py-4 border-2 border-red-400 bg-red-50 dark:bg-red-500/10"
                    >
                        <View className="flex-row items-center">
                            <Trash2 size={18} color="#ef4444" />
                            <Text className="ml-2 font-semibold text-red-500">Delete Item</Text>
                        </View>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
