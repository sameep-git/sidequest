import { useNetworkStatus } from '@/hooks/use-network-status';
import { WifiOff } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function OfflineBanner() {
    const { isOffline } = useNetworkStatus();
    const insets = useSafeAreaInsets();

    if (!isOffline) return null;

    return (
        <View
            className="absolute left-0 right-0 z-50 flex-row items-center justify-center py-2"
            style={{
                top: insets.top,
                backgroundColor: '#f97316',
            }}
        >
            <WifiOff size={14} color="#fff" />
            <Text className="ml-2 text-sm font-medium text-white">
                You&apos;re offline — some features are disabled
            </Text>
        </View>
    );
}
