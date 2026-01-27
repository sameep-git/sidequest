import { ShoppingItem } from '@/lib/types';
import { ReceiptItem } from '@/lib/utils/receipt-parser';
import { User } from '@supabase/supabase-js';
import { Camera as CameraIcon, Check, Plus, Trash2 } from 'lucide-react-native';
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';
import { EdgeInsets, SafeAreaView } from 'react-native-safe-area-context';

type Roommate = {
    id: string;
    name: string;
    initial: string;
    color: string;
    venmo: string | null;
};

type ItemEditorViewProps = {
    totalAmount: number;
    receiptItems: ReceiptItem[];
    selectedItem: string | null;
    bountyMatches: {
        receiptItem: ReceiptItem;
        shoppingItem: ShoppingItem;
        confirmed: boolean | null;
    }[];
    pendingShoppingItems: ShoppingItem[];
    isPosting: boolean;
    splitSelection: Set<string>;
    roommates: Roommate[];
    user: User | null;
    insets: EdgeInsets;
    tabBarClearance: number;

    // State for Confirmation Modal
    showMatchConfirmation: boolean;
    pendingShoppingMatches: {
        receiptItem: ReceiptItem;
        shoppingItem: ShoppingItem;
        isExact: boolean;
        confirmed: boolean;
    }[];

    // Actions
    onScanNew: () => void;
    onAddItem: () => void;
    onAddFromShoppingList: (item: ShoppingItem) => void;
    onUpdateName: (id: string, value: string) => void;
    onUpdatePrice: (id: string, value: string) => void;
    onDelete: (id: string) => void;
    onSelect: (id: string | null) => void;
    onPost: () => void;
    onBountyResponse: (shoppingItemId: string, confirmed: boolean) => void;
    onAssignToMe: () => void; // Unused in main view but logic exists
    onToggleSplitSelection: (userId: string) => void;
    onSelectAllSplit: () => void;

    // Modal Actions
    onConfirmMatchToggle: (index: number) => void;
    onConfirmPost: () => void;
    onCancelPost: () => void;
};

export function ItemEditorView({
    totalAmount,
    receiptItems,
    selectedItem,
    bountyMatches,
    pendingShoppingItems,
    isPosting,
    splitSelection,
    roommates,
    user,
    insets,
    tabBarClearance,
    showMatchConfirmation,
    pendingShoppingMatches,
    onScanNew,
    onAddItem,
    onAddFromShoppingList,
    onUpdateName,
    onUpdatePrice,
    onDelete,
    onSelect,
    onPost,
    onBountyResponse,
    onToggleSplitSelection,
    onSelectAllSplit,
    onConfirmMatchToggle,
    onConfirmPost,
    onCancelPost,
}: ItemEditorViewProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    // Theme-aware accent color (visible in both modes)
    const accentGreen = isDark ? '#0F8' : '#059669';

    const allItemsAssigned = receiptItems.every(
        (item) => item.splitType === 'split' || item.splitType === 'custom' || Boolean(item.assignedToUserId)
    );

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-white dark:bg-[#222]">
            <View className="border-b border-gray-200 px-6 pb-4 pt-8 dark:border-[#333]">
                <View className="mb-3">
                    <Text className="text-3xl font-semibold text-black dark:text-white">New Expense</Text>
                    <Text className="mt-1 text-sm text-gray-500 dark:text-white/60">Total: ${totalAmount.toFixed(2)}</Text>
                </View>
                <View className="flex-row gap-3">
                    <Pressable
                        onPress={onScanNew}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        className="flex-1 flex-row items-center justify-center rounded-xl bg-gray-100 px-4 py-3 dark:bg-[#333]"
                    >
                        <CameraIcon size={18} className="text-emerald-500 dark:text-[#0F8]" />
                        <Text className="ml-2 font-semibold text-black dark:text-white">Scan Receipt</Text>
                    </Pressable>
                    <Pressable
                        onPress={onAddItem}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        className="flex-1 flex-row items-center justify-center rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-3 dark:border-0 dark:bg-[#0F8]"
                    >
                        <Plus size={18} className="text-emerald-700 dark:text-black" />
                        <Text className="ml-2 font-semibold text-emerald-700 dark:text-black">Add Item</Text>
                    </Pressable>
                </View>
            </View>

            <FlatList
                className="flex-1"
                contentContainerClassName="px-6 py-6 pb-2"
                showsVerticalScrollIndicator={false}
                data={receiptItems}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                    <>
                        {/* Bounty Matches Section */}
                        {bountyMatches.some(m => m.confirmed === null) && (
                            <View className="mb-6 rounded-2xl border border-[#f59e0b] bg-[#f59e0b]/10 p-4">
                                <View className="flex-row items-center mb-3">
                                    <Text className="text-xl mr-2">🎯</Text>
                                    <Text className="text-lg font-bold text-[#f59e0b]">Bounty Detected!</Text>
                                </View>
                                <Text className="text-white/80 mb-4">Did you buy these items from the list?</Text>

                                <View className="gap-3">
                                    {bountyMatches.filter(m => m.confirmed === null).map((match, index) => (
                                        <View key={`${match.shoppingItem.id}-${index}`} className="bg-black/20 rounded-xl p-3">
                                            <View className="flex-row justify-between items-start mb-3">
                                                <View className="flex-1 mr-2">
                                                    <Text className="text-white font-semibold">{match.shoppingItem.name}</Text>
                                                    <Text className="text-xs text-white/60"> matched &quot;{match.receiptItem.name}&quot;</Text>
                                                </View>
                                                {match.shoppingItem.bounty_amount && (
                                                    <View className="bg-[#f59e0b] px-2 py-1 rounded-lg">
                                                        <Text className="text-black font-bold text-xs">
                                                            +${match.shoppingItem.bounty_amount.toFixed(2)}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View className="flex-row gap-2">
                                                <Pressable
                                                    className="flex-1 bg-[#333] py-2 rounded-lg items-center"
                                                    onPress={() => onBountyResponse(match.shoppingItem.id, false)}
                                                >
                                                    <Text className="text-white font-medium">No</Text>
                                                </Pressable>
                                                <Pressable
                                                    className="flex-1 bg-[#f59e0b] py-2 rounded-lg items-center"
                                                    onPress={() => onBountyResponse(match.shoppingItem.id, true)}
                                                >
                                                    <Text className="text-black font-bold">Yes, I did!</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Shopping List Quick-Add Section */}
                        {pendingShoppingItems.length > 0 && (
                            <View className="mb-4">
                                <Text className="mb-2 text-xs uppercase text-gray-500 dark:text-white/50">From Shopping List</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                                    <View className="flex-row gap-2">
                                        {pendingShoppingItems.map((item) => (
                                            <Pressable
                                                key={item.id}
                                                onPress={() => onAddFromShoppingList(item)}
                                                className={`flex-row items-center rounded-full px-3 py-2 ${item.bounty_amount
                                                    ? 'bg-orange-50 dark:bg-[#f59e0b20]'
                                                    : 'bg-gray-200 dark:bg-[#333]'
                                                    }`}
                                            >
                                                <Plus size={14} color={item.bounty_amount ? '#f59e0b' : '#888'} />
                                                <Text className={`ml-1 text-sm font-medium ${item.bounty_amount ? 'text-orange-600 dark:text-white' : 'text-black dark:text-white'
                                                    }`} numberOfLines={1}>
                                                    {item.name}
                                                </Text>
                                                {item.bounty_amount ? (
                                                    <Text className="ml-1 text-xs font-bold text-orange-500 dark:text-[#f59e0b]">
                                                        +${item.bounty_amount.toFixed(2)}
                                                    </Text>
                                                ) : null}
                                            </Pressable>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        )}
                    </>
                }
                renderItem={({ item }: { item: ReceiptItem }) => {
                    const isSelected = selectedItem === item.id;
                    const isAssigned = Boolean(item.assignedToUserId) || item.splitType === 'split';
                    const isSplit = item.splitType === 'split';

                    // Determine container styles based on state and theme handled by NativeWind classes where possible,
                    // but complex logic ensures we might need inline styles or clsx/utils.
                    // Simplified approach: Default border logic.

                    return (
                        <Pressable
                            key={item.id}
                            accessibilityRole="button"
                            onPress={() => onSelect(item.id)}
                            style={isSelected ? {
                                marginBottom: 12,
                                borderRadius: 16,
                                borderWidth: 2,
                                borderColor: accentGreen,
                                backgroundColor: isDark ? 'rgba(0, 255, 136, 0.2)' : 'rgba(5, 150, 105, 0.1)',
                                paddingHorizontal: 16,
                                paddingVertical: 16,
                            } : undefined}
                            className={!isSelected ? 'mb-3 rounded-2xl border-2 px-4 py-4 border-gray-200 bg-white dark:border-[#333] dark:bg-[#2a2a2a]' : ''}
                        >

                            <View className="flex-row items-center gap-2">
                                <TextInput
                                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 font-semibold text-black dark:border-[#444] dark:bg-[#1a1a1a] dark:text-white"
                                    value={item.name}
                                    onChangeText={(value) => onUpdateName(item.id, value)}
                                    placeholder="Item name"
                                    placeholderTextColor="#999"
                                />
                                <View className="flex-row items-center">
                                    <Text className="mr-1 text-gray-400 dark:text-white/60">$</Text>
                                    <TextInput
                                        className="w-20 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-right font-semibold text-black dark:border-[#444] dark:bg-[#1a1a1a] dark:text-white"
                                        keyboardType="decimal-pad"
                                        value={item.displayPrice ?? (Number.isFinite(item.price) ? item.price.toFixed(2) : '')}
                                        onChangeText={(value) => onUpdatePrice(item.id, value)}
                                        placeholder="0.00"
                                        placeholderTextColor="#999"
                                    />
                                </View>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Delete item"
                                    onPress={() => onDelete(item.id)}
                                    className="ml-1 p-3"
                                >
                                    <Trash2 size={18} color="#ef4444" />
                                </Pressable>
                            </View>
                            {item.assignedToName && (
                                <View className="mt-3 flex-row items-center">
                                    <View
                                        className="h-2 w-2 rounded-full mr-2"
                                        style={{
                                            backgroundColor: item.splitType === 'split'
                                                ? '#8b5cf6'
                                                : item.splitType === 'custom'
                                                    ? '#f97316'
                                                    : accentGreen
                                        }}
                                    />
                                    <Text
                                        className="text-sm font-semibold"
                                        style={{
                                            color: item.splitType === 'split'
                                                ? '#8b5cf6'
                                                : item.splitType === 'custom'
                                                    ? '#f97316'
                                                    : accentGreen
                                        }}
                                    >
                                        {item.assignedToName}
                                    </Text>
                                </View>
                            )}
                        </Pressable>
                    );
                }}
                ListEmptyComponent={
                    <View className="items-center py-12">
                        <Text className="mb-2 text-lg font-semibold text-black dark:text-white">No items yet</Text>
                        <Text className="text-center text-sm text-gray-500 dark:text-white/60">
                            Use the buttons above to add items
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    <Pressable
                        accessibilityRole="button"
                        onPress={onAddItem}
                        className="mt-4 flex-row items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-3 dark:border-[#444]"
                    >
                        <Plus size={20} className="text-gray-400 dark:text-[#666]" />
                        <Text className="ml-2 font-medium text-gray-500 dark:text-white/60">Add Item</Text>
                    </Pressable>
                }
            />

            {selectedItem !== null && (
                <View
                    className="border-t border-gray-200 px-6 py-4 dark:border-[#333]"
                    style={{ paddingBottom: insets.bottom + tabBarClearance + 16 }}
                >
                    <Text className="mb-3 text-sm text-gray-500 dark:text-white/70">Assign to:</Text>

                    <View className="mb-4 flex-row flex-wrap gap-2">
                        {/* All toggle */}
                        <Pressable
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: splitSelection.size === roommates.length + 1 }}
                            onPress={onSelectAllSplit}
                            className={`flex-row items-center rounded-xl border-2 px-4 py-2 ${splitSelection.size === roommates.length + 1
                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/20'
                                : 'border-transparent bg-gray-200 dark:bg-[#333]'
                                }`}
                        >
                            <Text className="font-medium text-black dark:text-white">All</Text>
                        </Pressable>

                        {/* Me toggle */}
                        <Pressable
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: user ? splitSelection.has(user.id) : false }}
                            onPress={() => user && onToggleSplitSelection(user.id)}
                            className={`flex-row items-center rounded-xl border-2 px-4 py-2 ${user && splitSelection.has(user.id)
                                ? 'border-[#0F8] bg-green-50 dark:bg-[#0F8/20]'
                                : 'border-transparent bg-gray-200 dark:bg-[#333]'
                                }`}
                        >
                            <Text className="font-medium text-black dark:text-white">Me</Text>
                        </Pressable>

                        {/* Roommate toggles */}
                        {roommates.map((roommate) => (
                            <Pressable
                                key={roommate.id}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: splitSelection.has(roommate.id) }}
                                onPress={() => onToggleSplitSelection(roommate.id)}
                                className={`flex-row items-center rounded-xl border-2 px-3 py-2 ${splitSelection.has(roommate.id)
                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/20'
                                    : 'border-transparent bg-gray-200 dark:bg-[#333]'
                                    }`}
                            >
                                <Text className="font-medium text-black dark:text-white">{roommate.name.split(' ')[0]}</Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Done Button */}
                    <Pressable
                        onPress={() => onSelect(null)}
                        className="items-center justify-center rounded-xl bg-black py-3 dark:bg-[#333]"
                    >
                        <Text className="font-semibold text-white">Done</Text>
                    </Pressable>
                </View>
            )}

            {/* Post button only shows when splitter is closed */}
            {selectedItem === null && (
                <View className="px-6" style={{ paddingBottom: insets.bottom + tabBarClearance }}>
                    <Pressable
                        accessibilityRole="button"
                        className="items-center justify-center rounded-2xl py-4 bg-emerald-500 dark:bg-[#0F8]"
                        style={{
                            opacity: !receiptItems.length || !allItemsAssigned || isPosting ? 0.4 : 1,
                        }}
                        onPress={onPost}
                        disabled={!receiptItems.length || !allItemsAssigned || isPosting}
                    >
                        <Text className="font-semibold text-white dark:text-black">{isPosting ? 'Posting...' : 'Post to House'}</Text>
                    </Pressable>
                </View>
            )}

            {/* Shopping List Match Confirmation Modal */}
            <Modal
                visible={showMatchConfirmation}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={onCancelPost}
            >
                <View className="flex-1" style={{ backgroundColor: '#222' }}>
                    <SafeAreaView edges={['top']} className="flex-1">
                        <View className="px-6 py-4 border-b" style={{ borderBottomColor: '#333' }}>
                            <Text className="text-2xl font-bold text-white">Confirm Matches</Text>
                            <Text className="text-white/60 mt-1">These items match your shopping list</Text>
                        </View>

                        <ScrollView className="flex-1 px-6 py-4">
                            {pendingShoppingMatches.map((match, index) => (
                                <Pressable
                                    key={match.shoppingItem.id}
                                    onPress={() => onConfirmMatchToggle(index)}
                                    className="flex-row items-center justify-between p-4 rounded-xl mb-3"
                                    style={{ backgroundColor: match.confirmed ? 'rgba(15, 248, 136, 0.2)' : '#333' }}
                                >
                                    <View className="flex-1">
                                        <Text className="text-white font-semibold">{match.receiptItem.name}</Text>
                                        <Text className="text-white/60 text-sm">
                                            {match.isExact ? 'Exact match: ' : 'Possible match: '}&quot;{match.shoppingItem.name}&quot;
                                        </Text>
                                        {match.shoppingItem.bounty_amount ? (
                                            <Text className="text-[#f59e0b] font-bold text-sm mt-1">
                                                Bounty: +${match.shoppingItem.bounty_amount.toFixed(2)}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <View className="h-8 w-8 rounded-full items-center justify-center"
                                        style={{ backgroundColor: match.confirmed ? '#0F8' : '#555' }}>
                                        {match.confirmed && <Check size={18} color="#000" />}
                                    </View>
                                </Pressable>
                            ))}
                        </ScrollView>

                        <View className="px-6 pb-6">
                            <Pressable
                                onPress={onConfirmPost}
                                className="items-center justify-center rounded-2xl py-4 bg-emerald-500 dark:bg-[#0F8]"
                            >
                                <Text className="font-semibold text-white dark:text-black">
                                    {isPosting ? 'Posting...' : 'Confirm & Post'}
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={onCancelPost}
                                className="items-center justify-center py-3 mt-2"
                            >
                                <Text className="text-white/60">Cancel</Text>
                            </Pressable>
                        </View>
                    </SafeAreaView>
                </View>
            </Modal>
        </SafeAreaView >
    );
}
