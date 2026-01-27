import { useHouseholdStore } from '@/lib/household-store';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { Pressable, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

type HouseholdInviteProps = {
  onClose: () => void;
};

export function HouseholdInvite({ onClose }: HouseholdInviteProps) {
  const houseName = useHouseholdStore((state) => state.houseName);
  const joinCode = useHouseholdStore((state) => state.joinCode);

  const inviteMessage = `Join "${houseName}" on sidequest! Use code: ${joinCode}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: inviteMessage,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(joinCode || '');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Code copied!', {
      description: `${joinCode} copied to clipboard`,
    });
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <SafeAreaView className="flex-1 bg-black/80" edges={[]}>
      <Pressable className="flex-1" onPress={onClose} />
      <View className="rounded-t-3xl bg-white px-6 pb-8 pt-6 dark:bg-[#1f1f1f]">
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-black dark:text-white">Invite Roommates</Text>
          <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-[#333]" hitSlop={20}>
            <X size={24} className="text-gray-500 dark:text-white" />
          </Pressable>
        </View>

        <View className="mb-6 items-center rounded-2xl border border-gray-200 bg-gray-50 px-6 py-8 dark:border-[#333] dark:bg-[#111]">
          <Text className="mb-2 text-sm text-gray-500 dark:text-gray-400">Join Code</Text>
          <Text className="text-4xl font-bold tracking-[12px] text-black dark:text-white">{joinCode}</Text>
        </View>

        <Text className="text-center text-gray-500 dark:text-gray-400">
          Ask your roommate to tap &quot;Join Household&quot; and enter this code:
        </Text>

        <Pressable
          onPress={handleShare}
          className="mb-3 mt-6 rounded-2xl bg-emerald-600 px-6 py-4 dark:bg-[#0F8]"
        >
          <Text className="text-center text-lg font-semibold text-white dark:text-black">Share Invite</Text>
        </Pressable>

        <Pressable
          onPress={handleCopy}
          className="rounded-2xl border border-gray-200 bg-gray-100 px-6 py-4 dark:border-[#333] dark:bg-[#2a2a2a]"
        >
          <Text className="text-center text-lg font-semibold text-black dark:text-white">Copy Code</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
