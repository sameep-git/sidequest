import { authService } from '@/lib/auth';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type EmailAuthProps = {
  onSuccess: () => void;
  onBack: () => void;
};

export function EmailAuth({ onSuccess, onBack }: EmailAuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && !displayName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      setIsLoading(true);
      if (isSignUp) {
        await authService.signUpWithEmail(email, password, displayName);
        onSuccess();
      } else {
        await authService.signInWithEmail(email, password);
        onSuccess();
      }
    } catch (error: any) {
      console.error('Email auth error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#111]" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1 px-6 pb-10 pt-6"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={onBack} className="mb-8">
            <Text className="text-base text-emerald-600 dark:text-[#0F8]">← Back</Text>
          </Pressable>

          <View className="flex-1 justify-center gap-6">
            <View className="items-center gap-3">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-[#0F8]/20">
                <Mail size={28} className="text-emerald-600 dark:text-[#0F8]" />
              </View>
              <Text className="text-3xl font-bold text-black dark:text-white">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text className="text-center text-base text-gray-500 dark:text-gray-400">
                {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
              </Text>
            </View>

            <View className="gap-4">
              {isSignUp && (
                <TextInput
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-black dark:border-[#333] dark:bg-[#1d1d1d] dark:text-white"
                  placeholder="Display Name"
                  placeholderTextColor="#999"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              )}
              <TextInput
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-black dark:border-[#333] dark:bg-[#1d1d1d] dark:text-white"
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
              <TextInput
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-black dark:border-[#333] dark:bg-[#1d1d1d] dark:text-white"
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                editable={!isLoading}
              />
            </View>

            <View className="gap-4">
              <Pressable
                onPress={handleSubmit}
                disabled={isLoading}
                className="items-center justify-center rounded-2xl bg-emerald-600 px-4 py-4 dark:bg-[#0F8]"
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-base font-semibold text-white dark:text-black">
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                  </Text>
                )}
              </Pressable>

              <Pressable onPress={() => setIsSignUp(!isSignUp)} disabled={isLoading}>
                <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <Text className="font-semibold text-emerald-600 dark:text-[#0F8]">
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
