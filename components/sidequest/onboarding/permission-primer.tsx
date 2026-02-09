import { openAppSettings } from '@/lib/permissions';
import { Camera as CameraModule } from 'expo-camera';
import * as Location from 'expo-location';
import { Camera, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PermissionPrimerProps = {
  onContinue: () => void;
};

export function PermissionPrimer({ onContinue }: PermissionPrimerProps) {
  const [isRequesting, setIsRequesting] = useState(false);


  const handleEnablePermissions = async () => {
    setIsRequesting(true);
    try {
      // Request foreground location and camera permissions
      await Location.requestForegroundPermissionsAsync();
      await CameraModule.requestCameraPermissionsAsync();

      // Read back final states
      const fg = await Location.getForegroundPermissionsAsync();
      const cam = await CameraModule.getCameraPermissionsAsync();

      const locationGranted = fg.status === 'granted';
      const cameraGranted = cam.status === 'granted';

      if (locationGranted && cameraGranted) {
        onContinue();
        return;
      }

      // Keep the user on the screen and let them open Settings. Don't spam alerts.
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert(
        'Permission Error',
        'An error occurred while requesting permissions. Please try again.',
        [
          { text: 'Try Again', onPress: handleEnablePermissions }
        ]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#111]" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 py-6">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-black dark:text-white">We Need Your Help</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            To make shopping effortless, we need a couple permissions
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingVertical: 32 }}>
          <View className="mb-4 rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-[#333] dark:bg-[#1f1f1f]">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-[#0F8]/20">
              <MapPin size={26} className="text-emerald-600 dark:text-[#0F8]" />
            </View>
            <Text className="text-xl font-semibold text-black dark:text-white">Location Access</Text>
            <Text className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              We&apos;ll notify you when you&apos;re near a store with active bounties. Your location is never shared with roommates.
            </Text>
          </View>

          <View className="mb-4 rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-[#333] dark:bg-[#1f1f1f]">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-[#0F8]/20">
              <Camera size={26} className="text-emerald-600 dark:text-[#0F8]" />
            </View>
            <Text className="text-xl font-semibold text-black dark:text-white">Camera Access</Text>
            <Text className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Snap a photo of your receipt and we&apos;ll automatically split the items. No manual entry needed.
            </Text>
          </View>

          <View className="rounded-2xl border border-yellow-700/50 bg-yellow-900/10 p-4 dark:bg-yellow-900/20">
            <Text className="text-xs font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-200">
              Privacy Note
            </Text>
            <Text className="mt-1 text-sm text-yellow-800 dark:text-yellow-100">
              sidequest is not meant for collecting PII or securing sensitive data. Only use with trusted roommates.
            </Text>
          </View>
        </ScrollView>

        <View className="mt-4">
          <Pressable
            onPress={handleEnablePermissions}
            className="rounded-2xl bg-emerald-600 px-5 py-4 dark:bg-[#0F8]"
            disabled={isRequesting}
          >
            <Text className="text-center text-base font-semibold text-white dark:text-black">
              {isRequesting ? 'Requesting...' : 'Continue'}
            </Text>
          </Pressable>

          {/* Status removed: kept UI minimal to avoid exposing debug state to users */}

          <Pressable
            onPress={openAppSettings}
            className="mt-4 rounded-2xl border border-gray-200 px-5 py-4 dark:border-[#333]"
            disabled={isRequesting}
          >
            <Text className="text-center text-base font-semibold text-gray-500 dark:text-white">Open Settings</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
