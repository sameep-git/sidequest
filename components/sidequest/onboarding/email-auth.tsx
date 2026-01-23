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
        // Alert.alert('Success', 'Check your email to verify your account', [
        //   { text: 'OK', onPress: onSuccess },
        // ]);
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
    <SafeAreaView className="flex-1 bg-[#111]" edges={['top', 'bottom']}>
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
            <Text className="text-base text-[#0F8]">← Back</Text>
          </Pressable>

          <View className="flex-1 justify-center gap-6">
          <View className="items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#0F8]/20">
              <Mail size={28} color="#0F8" />
            </View>
            <Text className="text-3xl font-bold text-white">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text className="text-center text-base text-gray-400">
              {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
            </Text>
          </View>

          <View className="gap-4">
            {isSignUp && (
              <TextInput
                className="rounded-2xl border border-[#333] bg-[#1d1d1d] px-4 py-4 text-white"
                placeholder="Display Name"
                placeholderTextColor="#666"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            )}
            <TextInput
              className="rounded-2xl border border-[#333] bg-[#1d1d1d] px-4 py-4 text-white"
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
            <TextInput
              className="rounded-2xl border border-[#333] bg-[#1d1d1d] px-4 py-4 text-white"
              placeholder="Password"
              placeholderTextColor="#666"
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
              className="items-center justify-center rounded-2xl bg-[#0F8] px-4 py-4"
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-base font-semibold text-black">
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </Pressable>

            <Pressable onPress={() => setIsSignUp(!isSignUp)} disabled={isLoading}>
              <Text className="text-center text-sm text-gray-400">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text className="font-semibold text-[#0F8]">
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
