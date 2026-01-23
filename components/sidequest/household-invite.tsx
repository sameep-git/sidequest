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

  const inviteMessage = `Join "${houseName}" on Sidequest! Use code: ${joinCode}`;

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
      <View className="rounded-t-3xl bg-[#1f1f1f] px-6 pb-8 pt-6">
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-white">Invite Roommates</Text>
          <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center">
            <X size={24} color="#888" />
          </Pressable>
        </View>

        <View className="mb-6 items-center rounded-2xl border border-[#333] bg-[#111] px-6 py-8">
          <Text className="mb-2 text-sm text-gray-400">Join Code</Text>
          <Text className="text-4xl font-bold tracking-[12px] text-white">{joinCode}</Text>
        </View>

        <Text className="mb-4 text-center text-sm text-gray-400">
          Share this code with your roommates so they can join "{houseName}"
        </Text>

        <Pressable
          onPress={handleShare}
          className="mb-3 rounded-2xl bg-[#0F8] px-6 py-4"
        >
          <Text className="text-center text-lg font-semibold text-black">Share Invite</Text>
        </Pressable>

        <Pressable
          onPress={handleCopy}
          className="rounded-2xl border border-[#333] bg-[#2a2a2a] px-6 py-4"
        >
          <Text className="text-center text-lg font-semibold text-white">Copy Code</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
