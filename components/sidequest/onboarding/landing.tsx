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
    <SafeAreaView className="flex-1 bg-white dark:bg-[#111]" edges={['top', 'bottom']}>
      <View className="flex-1 justify-between px-6 pb-10 pt-6">
        <View className="flex-1 items-center justify-center gap-4">
          <View className="h-24 w-24 items-center justify-center rounded-[28px] bg-emerald-600 shadow-[0_8px_16px_rgba(5,150,105,0.35)] dark:bg-[#0F8] dark:shadow-[0_8px_16px_rgba(15,248,136,0.35)]">
            <Image
              source={require('@/assets/images/android-chrome-512x512.png')}
              accessibilityLabel="sidequest logo"
              className="h-16 w-16"
              resizeMode="contain"
            />
          </View>
          <Text className="text-4xl font-bold text-black dark:text-white">sidequest</Text>
          <Text className="text-base text-gray-500 dark:text-gray-300">Making grocery runs rewarding</Text>
        </View>

        <View className="gap-4">
          <Pressable
            onPress={handleAppleSignIn}
            disabled={isLoading}
            className="flex-row items-center justify-center rounded-2xl border border-gray-200 bg-black px-4 py-4 dark:border-[#1f1f1f]"
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
            className="flex-row items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 px-4 py-4 dark:border-[#333] dark:bg-[#1d1d1d]"
          >
            <View className="mr-3">
              <Mail size={18} className="text-black dark:text-white" />
            </View>
            <Text className="text-base font-semibold text-black dark:text-white">Sign in with Email</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
