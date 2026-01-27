import { CameraView as ExpoCameraView } from 'expo-camera';
import { Camera as CameraIcon } from 'lucide-react-native';
import { RefObject } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { EdgeInsets, SafeAreaView } from 'react-native-safe-area-context';

type CameraViewProps = {
    isProcessing: boolean;
    cameraRef: RefObject<ExpoCameraView | null>;
    onCapture: () => void;
    onCancel: () => void;
    insets: EdgeInsets;
    tabBarClearance: number;
};

export function CameraView({
    isProcessing,
    cameraRef,
    onCapture,
    onCancel,
    insets,
    tabBarClearance,
}: CameraViewProps) {
    if (isProcessing) {
        return (
            <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-white dark:bg-[#222]">
                <View className="items-center">
                    <ActivityIndicator size="large" color="#0F8" />
                    <Text className="mt-3 text-xl font-semibold text-black dark:text-white">Analyzing Receipt</Text>
                    <Text className="mt-1 text-sm text-gray-500 dark:text-white/70">Detecting items and prices...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-black">
            <View className="flex-1 px-6">
                <View className="flex-row justify-end py-4">
                    <Pressable onPress={onCancel} className="p-2 bg-[#333] rounded-full">
                        <Text className="text-white font-semibold">Cancel</Text>
                    </Pressable>
                </View>

                <View className="flex-1 w-full items-center justify-center">
                    <View
                        className="h-[400px] w-full overflow-hidden rounded-3xl border-4"
                        style={{ borderColor: 'rgba(15, 248, 136, 0.5)' }}
                    >
                        <ExpoCameraView
                            ref={cameraRef}
                            style={{ flex: 1 }}
                            facing={'back'}
                            autofocus="on"
                        />
                    </View>
                </View>
            </View>

            <View
                className="items-center w-full"
                style={{ paddingBottom: insets.bottom + tabBarClearance + 24 }}
            >
                <Text className="mb-6 text-lg text-white font-medium text-center">
                    Align the receipt and tap capture
                </Text>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Capture"
                    onPress={onCapture}
                >
                    <View
                        className="h-20 w-20 items-center justify-center rounded-full border-4"
                        style={{ backgroundColor: '#0F8', borderColor: 'rgba(15, 248, 136, 0.3)' }}
                    >
                        <CameraIcon size={28} color="#000" />
                    </View>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
