import { ShoppingItem } from '@/lib/types';
import { ReceiptItem } from '@/lib/utils/receipt-parser';
import { User } from '@supabase/supabase-js';
import { Camera as CameraIcon, Check, Plus, Trash2 } from 'lucide-react-native';
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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

    const allItemsAssigned = receiptItems.every(
        (item) => item.splitType === 'split' || item.splitType === 'custom' || Boolean(item.assignedToUserId)
    );

    return (
        <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: '#222' }}>
            <View className="px-6 pb-4" style={{ paddingTop: 32, borderBottomWidth: 1, borderBottomColor: '#333' }}>
                <View className="mb-3">
                    <Text className="text-3xl font-semibold text-white">New Expense</Text>
                    <Text className="mt-1 text-sm text-white/60">Total: ${totalAmount.toFixed(2)}</Text>
                </View>
                <View className="flex-row gap-3">
                    <Pressable
                        onPress={onScanNew}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        className="flex-1 flex-row items-center justify-center rounded-xl bg-[#333] px-4 py-3"
                    >
                        <CameraIcon size={18} color="#0F8" />
                        <Text className="ml-2 font-semibold text-white">Scan Receipt</Text>
                    </Pressable>
                    <Pressable
                        onPress={onAddItem}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        className="flex-1 flex-row items-center justify-center rounded-xl px-4 py-3"
                        style={{ backgroundColor: '#0F8' }}
                    >
                        <Plus size={18} color="#000" />
                        <Text className="ml-2 font-semibold text-black">Add Item</Text>
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
                                <Text className="text-xs text-white/50 uppercase mb-2">From Shopping List</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                                    <View className="flex-row gap-2">
                                        {pendingShoppingItems.map((item) => (
                                            <Pressable
                                                key={item.id}
                                                onPress={() => onAddFromShoppingList(item)}
                                                className="flex-row items-center rounded-full px-3 py-2"
                                                style={{ backgroundColor: item.bounty_amount ? '#f59e0b20' : '#333' }}
                                            >
                                                <Plus size={14} color={item.bounty_amount ? '#f59e0b' : '#888'} />
                                                <Text className="ml-1 text-white font-medium text-sm" numberOfLines={1}>
                                                    {item.name}
                                                </Text>
                                                {item.bounty_amount ? (
                                                    <Text className="ml-1 text-[#f59e0b] font-bold text-xs">
                                                        +${item.bounty_amount.toFixed(0)}
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

                    let borderColor = '#333';
                    let backgroundColor = '#2a2a2a';
                    if (isSelected) {
                        borderColor = '#0F8';
                        backgroundColor = 'rgba(15, 248, 136, 0.15)';
                    } else if (isAssigned) {
                        if (isSplit) {
                            borderColor = '#8b5cf6';
                            backgroundColor = 'rgba(139, 92, 246, 0.08)';
                        } else {
                            borderColor = '#0F8';
                            backgroundColor = 'rgba(15, 248, 136, 0.08)';
                        }
                    }

                    return (
                        <Pressable
                            key={item.id}
                            accessibilityRole="button"
                            onPress={() => onSelect(item.id)}
                            className="rounded-2xl border-2 px-4 py-4 mb-3"
                            style={{ borderColor, backgroundColor }}
                        >
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-xs text-white/50 uppercase">Item Name</Text>
                                <Text className="text-xs text-white/50 uppercase">Price</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <TextInput
                                    className="flex-1 rounded-xl border px-3 py-2 text-white font-semibold"
                                    style={{ backgroundColor: '#1a1a1a', borderColor: '#444' }}
                                    value={item.name}
                                    onChangeText={(value) => onUpdateName(item.id, value)}
                                    placeholder="Item name"
                                    placeholderTextColor="#666"
                                />
                                <View className="flex-row items-center">
                                    <Text className="text-white/60 mr-1">$</Text>
                                    <TextInput
                                        className="w-20 rounded-xl border px-3 py-2 text-white font-semibold text-right"
                                        style={{ backgroundColor: '#1a1a1a', borderColor: '#444' }}
                                        keyboardType="decimal-pad"
                                        value={item.displayPrice ?? (Number.isFinite(item.price) ? item.price.toFixed(2) : '')}
                                        onChangeText={(value) => onUpdatePrice(item.id, value)}
                                        placeholder="0.00"
                                        placeholderTextColor="#666"
                                    />
                                </View>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Delete item"
                                    onPress={() => onDelete(item.id)}
                                    className="p-3 ml-1"
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
                                                    : '#0F8'
                                        }}
                                    />
                                    <Text
                                        className="text-sm font-semibold"
                                        style={{
                                            color: item.splitType === 'split'
                                                ? '#8b5cf6'
                                                : item.splitType === 'custom'
                                                    ? '#f97316'
                                                    : '#0F8'
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
                        <Text className="text-lg font-semibold text-white mb-2">No items yet</Text>
                        <Text className="text-sm text-white/60 text-center">
                            Use the buttons above to add items
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    <Pressable
                        accessibilityRole="button"
                        onPress={onAddItem}
                        className="mt-4 flex-row items-center justify-center rounded-xl border-2 border-dashed py-3"
                        style={{ borderColor: '#444' }}
                    >
                        <Plus size={20} color="#666" />
                        <Text className="ml-2 text-white/60 font-medium">Add Item</Text>
                    </Pressable>
                }
            />

            {selectedItem !== null && (
                <View className="px-6 py-4" style={{ borderTopWidth: 1, borderTopColor: '#333' }}>
                    <Text className="mb-3 text-sm text-white/70">Assign to:</Text>

                    <View className="flex-row flex-wrap gap-2 mb-4">
                        {/* All toggle */}
                        <Pressable
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: splitSelection.size === roommates.length + 1 }}
                            onPress={onSelectAllSplit}
                            className="flex-row items-center px-4 py-2 rounded-xl"
                            style={{
                                backgroundColor: splitSelection.size === roommates.length + 1 ? 'rgba(139, 92, 246, 0.2)' : '#333',
                                borderWidth: 2,
                                borderColor: splitSelection.size === roommates.length + 1 ? '#8b5cf6' : 'transparent',
                            }}
                        >
                            <Text className="text-white font-medium">All</Text>
                        </Pressable>

                        {/* Me toggle */}
                        <Pressable
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: user ? splitSelection.has(user.id) : false }}
                            onPress={() => user && onToggleSplitSelection(user.id)}
                            className="flex-row items-center px-4 py-2 rounded-xl"
                            style={{
                                backgroundColor: user && splitSelection.has(user.id) ? 'rgba(15, 248, 136, 0.2)' : '#333',
                                borderWidth: 2,
                                borderColor: user && splitSelection.has(user.id) ? '#0F8' : 'transparent',
                            }}
                        >
                            <Text className="text-white font-medium">Me</Text>
                        </Pressable>

                        {/* Roommate toggles */}
                        {roommates.map((roommate) => (
                            <Pressable
                                key={roommate.id}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: splitSelection.has(roommate.id) }}
                                onPress={() => onToggleSplitSelection(roommate.id)}
                                className="flex-row items-center px-3 py-2 rounded-xl"
                                style={{
                                    backgroundColor: splitSelection.has(roommate.id) ? 'rgba(139, 92, 246, 0.2)' : '#333',
                                    borderWidth: 2,
                                    borderColor: splitSelection.has(roommate.id) ? '#8b5cf6' : 'transparent',
                                }}
                            >
                                <Text className="text-white font-medium">{roommate.name.split(' ')[0]}</Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Done Button */}
                    <Pressable
                        onPress={() => onSelect(null)}
                        className="items-center justify-center rounded-xl bg-[#333] py-3"
                    >
                        <Text className="font-semibold text-white">Done</Text>
                    </Pressable>
                </View>
            )}

            <View className="px-6" style={{ paddingBottom: insets.bottom + tabBarClearance }}>
                <Pressable
                    accessibilityRole="button"
                    className="items-center justify-center rounded-2xl py-4"
                    style={{
                        backgroundColor: '#0F8',
                        opacity: !receiptItems.length || !allItemsAssigned || isPosting ? 0.4 : 1,
                    }}
                    onPress={onPost}
                    disabled={!receiptItems.length || !allItemsAssigned || isPosting}
                >
                    <Text className="font-semibold text-black">{isPosting ? 'Posting...' : 'Post to House'}</Text>
                </Pressable>
            </View>

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
                                className="items-center justify-center rounded-2xl py-4"
                                style={{ backgroundColor: '#0F8' }}
                            >
                                <Text className="font-semibold text-black">
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
