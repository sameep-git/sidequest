import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width: width as any, height, borderRadius, opacity },
                style,
            ]}
        />
    );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
    return (
        <View style={[styles.card, style]}>
            <View style={styles.cardHeader}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={styles.cardHeaderText}>
                    <Skeleton width={120} height={16} />
                    <Skeleton width={80} height={12} style={{ marginTop: 6 }} />
                </View>
            </View>
            <Skeleton width="100%" height={12} style={{ marginTop: 12 }} />
            <Skeleton width="70%" height={12} style={{ marginTop: 8 }} />
        </View>
    );
}

export function SkeletonListItem({ style }: { style?: ViewStyle }) {
    return (
        <View style={[styles.listItem, style]}>
            <Skeleton width={48} height={48} borderRadius={12} />
            <View style={styles.listItemContent}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#333',
    },
    card: {
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardHeaderText: {
        marginLeft: 12,
        flex: 1,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    listItemContent: {
        marginLeft: 12,
        flex: 1,
    },
});
