import { authService } from '@/lib/auth';
import { Apple, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type LandingProps = {
  onContinue: () => void;
  onEmailAuth: () => void;
};

export function Landing({ onContinue, onEmailAuth }: LandingProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      await authService.signInWithApple();
      onContinue();
    } catch (error: any) {
      console.error('Apple Sign In error:', error);
      Alert.alert('Sign In Failed', error.message || 'Could not sign in with Apple');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-[#111]" edges={['top', 'bottom']}>
      <View className="flex-1 justify-between px-6 pb-10 pt-6">
        <View className="flex-1 items-center justify-center gap-4">
          <View className="h-24 w-24 items-center justify-center rounded-[28px] bg-[#0F8] shadow-[0_8px_16px_rgba(15,248,136,0.35)]">
            <Image
              source={require('@/assets/images/android-chrome-512x512.png')}
              accessibilityLabel="Sidequest logo"
              className="h-16 w-16"
              resizeMode="contain"
            />
          </View>
          <Text className="text-4xl font-bold text-white">sidequest</Text>
          <Text className="text-base text-gray-300">Making grocery runs rewarding</Text>
        </View>

        <View className="gap-4">
          <Pressable
            onPress={handleAppleSignIn}
            disabled={isLoading}
            className="flex-row items-center justify-center rounded-2xl border border-[#1f1f1f] bg-black px-4 py-4"
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <View className="mr-3">
                  <Apple size={18} color="#fff" />
                </View>
                <Text className="text-base font-semibold text-white">Sign in with Apple</Text>
              </>
            )}
          </Pressable>
          <Pressable
            onPress={onEmailAuth}
            disabled={isLoading}
            className="flex-row items-center justify-center rounded-2xl border border-[#333] bg-[#1d1d1d] px-4 py-4"
          >
            <View className="mr-3">
              <Mail size={18} color="#fff" />
            </View>
            <Text className="text-base font-semibold text-white">Sign in with Email</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
