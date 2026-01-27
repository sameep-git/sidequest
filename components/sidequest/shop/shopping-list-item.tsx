import { useHouseholdStore } from '@/lib/household-store';
import { ShoppingItem } from '@/lib/types';
import { Check, Flame, Info, Trash2 } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Animated, Text, useColorScheme, View } from 'react-native';
import { RectButton, Swipeable, TouchableOpacity } from 'react-native-gesture-handler';

type ShoppingListItemProps = {
    item: ShoppingItem;
    onToggleComplete: (item: ShoppingItem) => void;
    onLongPress: (item: ShoppingItem) => void;
    onDelete: (id: string) => void;
};

export function ShoppingListItem({ item, onToggleComplete, onLongPress, onDelete }: ShoppingListItemProps) {
    const members = useHouseholdStore((state) => state.members);
    const swipeableRef = useRef<Swipeable>(null);
    const [isSwiping, setIsSwiping] = useState(false);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const requesterInfo = useMemo(() => {
        if (!item.requested_by) {
            return { initial: '?', color: '#888' };
        }
        const member = members.find(m => m.member.user_id === item.requested_by);
        const name = member?.profile?.display_name ?? member?.profile?.email ?? 'Someone';
        const initial = name.charAt(0).toUpperCase();
        // Theme-aware palette - first color uses emerald for light mode
        const accentGreen = isDark ? '#0F8' : '#059669';
        const palette = [accentGreen, '#8b5cf6', '#3b82f6', '#f97316', '#ec4899'];
        const colorIndex = members.findIndex(m => m.member.user_id === item.requested_by);
        const color = palette[colorIndex % palette.length] || accentGreen;
        return { initial, color };
    }, [item.requested_by, members, isDark]);

    const isCompleted = item.status === 'purchased';

    const handlePress = () => {
        if (!isSwiping) {
            onToggleComplete(item);
        }
    };

    const handleLongPress = () => {
        if (!isSwiping) {
            onLongPress(item);
        }
    };

    // Dynamic colors based on theme
    const cardStyles = {
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isCompleted
            ? (isDark ? '#2a2a2a' : '#f3f4f6')
            : (isDark ? '#333' : '#e5e7eb'),
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: isCompleted
            ? (isDark ? '#1a1a1a' : '#f9fafb')
            : (isDark ? '#2a2a2a' : '#fff'),
    };

    const renderRightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const scale = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0.8],
            extrapolate: 'clamp',
        });

        return (
            <View className="flex-row items-center mr-3 mb-3">
                {/* Info Button */}
                <RectButton
                    onPress={() => {
                        swipeableRef.current?.close();
                        onLongPress(item);
                    }}
                    style={{
                        backgroundColor: '#3b82f6',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 60,
                        height: '100%',
                        borderTopLeftRadius: 16,
                        borderBottomLeftRadius: 16,
                    }}
                >
                    <Animated.View style={{ transform: [{ scale }] }}>
                        <Info size={22} color="white" />
                    </Animated.View>
                </RectButton>

                {/* Delete Button */}
                <RectButton
                    onPress={() => {
                        swipeableRef.current?.close();
                        onDelete(item.id);
                    }}
                    style={{
                        backgroundColor: '#ef4444',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 60,
                        height: '100%',
                        borderTopRightRadius: 16,
                        borderBottomRightRadius: 16,
                    }}
                >
                    <Animated.View style={{ transform: [{ scale }] }}>
                        <Trash2 size={22} color="white" />
                    </Animated.View>
                </RectButton>
            </View>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            friction={2}
            overshootRight={false}
            onSwipeableWillOpen={() => setIsSwiping(true)}
            onSwipeableClose={() => setTimeout(() => setIsSwiping(false), 100)}
        >
            <TouchableOpacity
                onPress={handlePress}
                onLongPress={handleLongPress}
                delayLongPress={400}
                activeOpacity={0.7}
                style={cardStyles}
            >
                {/* Requester Avatar */}
                <View style={{ marginRight: 12, position: 'relative' }}>
                    <View
                        style={{
                            height: 40,
                            width: 40,
                            borderRadius: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isCompleted ? '#888' : requesterInfo.color,
                            opacity: isCompleted ? 0.5 : 1,
                        }}
                    >
                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                            {requesterInfo.initial}
                        </Text>
                    </View>

                    {isCompleted && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(0,0,0,0.4)',
                            }}
                        >
                            <Check size={18} color="white" strokeWidth={3} />
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: '600',
                            flex: 1,
                            marginRight: 8,
                            color: isCompleted
                                ? (isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af')
                                : (isDark ? '#fff' : '#000'),
                            textDecorationLine: isCompleted ? 'line-through' : 'none',
                        }}
                        numberOfLines={1}
                    >
                        {item.name}
                    </Text>

                    {item.bounty_amount != null && item.bounty_amount > 0 && !isCompleted && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderRadius: 999,
                                backgroundColor: isDark ? 'rgba(249, 115, 22, 0.2)' : '#ffedd5',
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                            }}
                        >
                            <Flame size={12} color="#f97316" />
                            <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: '700', color: '#f97316' }}>
                                ${item.bounty_amount.toFixed(0)}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
}
