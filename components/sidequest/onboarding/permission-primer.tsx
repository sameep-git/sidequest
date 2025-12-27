import { Camera, MapPin } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PermissionPrimerProps = {
  onContinue: () => void;
};

export function PermissionPrimer({ onContinue }: PermissionPrimerProps) {
  return (
    <SafeAreaView className="flex-1 bg-[#111]" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 py-6">
      <View className="gap-2">
        <Text className="text-3xl font-bold text-white">We Need Your Help</Text>
        <Text className="text-sm text-gray-400">
          To make shopping effortless, we need a couple permissions
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingVertical: 32 }}>
        <View className="rounded-3xl border border-[#333] bg-[#1f1f1f] p-5 mb-4">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-[#0F8]/20">
            <MapPin size={26} color="#0F8" />
          </View>
          <Text className="text-xl font-semibold text-white">Location Access</Text>
          <Text className="text-sm text-gray-400 mt-2">
            We'll notify you when you're near a store with active bounties. Your location is never shared with roommates.
          </Text>
        </View>

        <View className="rounded-3xl border border-[#333] bg-[#1f1f1f] p-5 mb-4">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-[#0F8]/20">
            <Camera size={26} color="#0F8" />
          </View>
          <Text className="text-xl font-semibold text-white">Camera Access</Text>
          <Text className="text-sm text-gray-400 mt-2">
            Snap a photo of your receipt and we'll automatically split the items. No manual entry needed.
          </Text>
        </View>

        <View className="rounded-2xl border border-yellow-700/50 bg-yellow-900/20 p-4">
          <Text className="text-xs font-semibold uppercase tracking-wider text-yellow-200">
            Privacy Note
          </Text>
          <Text className="text-sm text-yellow-100 mt-1">
            Sidequest is not meant for collecting PII or securing sensitive data. Only use with trusted roommates.
          </Text>
        </View>
      </ScrollView>

      <View className="mt-4 gap-3">
        <Pressable onPress={onContinue} className="rounded-2xl bg-[#0F8] px-5 py-4">
          <Text className="text-center text-base font-semibold text-black">Enable Permissions</Text>
        </Pressable>
        <Pressable onPress={onContinue} className="rounded-2xl border border-[#333] px-5 py-4">
          <Text className="text-center text-base font-semibold text-gray-400">Skip for Now</Text>
        </Pressable>
      </View>
      </View>
    </SafeAreaView>
  );
}
