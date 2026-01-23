import { ShoppingItem } from '@/lib/types';
import { Trash2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

type ShoppingListItemProps = {
    item: ShoppingItem;
    onToggleComplete: (item: ShoppingItem) => void;
    onDelete: (id: string) => void;
};

export function ShoppingListItem({ item, onToggleComplete, onDelete }: ShoppingListItemProps) {
    return (
        <View
            className="rounded-2xl border px-4 py-4 mb-3"
            style={{ backgroundColor: '#2a2a2a', borderColor: '#333' }}
        >
            <View className="flex-row items-center">
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.status === 'pending' ? 'Mark complete' : 'Mark pending'}
                    onPress={() => onToggleComplete(item)}
                    className="mr-3 h-6 w-6 items-center justify-center rounded-full border-2"
                    style={{ borderColor: '#333' }}
                >
                    {item.status === 'purchased' && (
                        <View className="h-3 w-3 rounded-full" style={{ backgroundColor: '#0F8' }} />
                    )}
                </Pressable>

                <View className="flex-1">
                    <Text className={item.status === 'purchased' ? 'text-white/50 line-through' : 'text-white'}>
                        {item.name}
                    </Text>
                    <Text className="mt-1 text-xs" style={{ color: '#888' }}>
                        {item.bounty_amount ? `Bounty +$${item.bounty_amount.toFixed(2)}` : 'No bounty'}
                    </Text>
                </View>

                <Pressable
                    accessibilityRole="button"
                    onPress={() => onDelete(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Trash2 size={18} color="#ff7f7f" />
                </Pressable>
            </View>
        </View>
    );
}
