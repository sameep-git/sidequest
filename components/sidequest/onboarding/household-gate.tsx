import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { householdService } from '@/lib/services';
import { Home, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type HouseholdGateProps = {
  onContinue: (householdId: string, houseName: string, joinCode: string | null) => void;
};

type Mode = 'choose' | 'join' | 'create';

export function HouseholdGate({ onContinue }: HouseholdGateProps) {
  const { user } = useSupabaseUser();
  const [mode, setMode] = useState<Mode>('choose');
  const [houseCode, setHouseCode] = useState('');
  const [houseName, setHouseName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accentGreen = isDark ? '#0F8' : '#059669';

  const handleJoin = async () => {
    if (!user || houseCode.length !== 6) return;

    setIsLoading(true);
    try {
      const { household } = await householdService.joinByCode(houseCode, user.id);
      onContinue(household.id, household.name, household.join_code);
    } catch (err) {
      Alert.alert('Failed to join', err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !houseName.trim()) return;

    setIsLoading(true);
    try {
      const { household } = await householdService.create(houseName.trim(), user.id);
      onContinue(household.id, household.name, household.join_code);
    } catch (err) {
      Alert.alert('Failed to create', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'choose') {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#111]" edges={['top', 'bottom']}>
        <View className="flex-1 px-6 pt-6 pb-8">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-black dark:text-white">Find Your Household</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">Join or create a house to get started</Text>
          </View>
          <View className="mt-10 gap-4">
            <Pressable
              onPress={() => setMode('join')}
              className="rounded-3xl border border-gray-200 bg-gray-50 px-5 py-6 dark:border-[#333] dark:bg-[#1f1f1f]"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <View
                    className="mb-3 h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: isDark ? 'rgba(0, 255, 136, 0.3)' : 'rgba(5, 150, 105, 0.2)' }}
                  >
                    <Home size={20} color={accentGreen} />
                  </View>
                  <Text className="text-xl font-semibold text-black dark:text-white">Join Existing House</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">Enter a 6-digit code</Text>
                </View>
                <View className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
                  <Text style={{ color: accentGreen }} className="text-xs font-semibold">Join</Text>
                </View>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setMode('create')}
              className="rounded-3xl border border-gray-200 bg-gray-50 px-5 py-6 dark:border-[#333] dark:bg-[#1f1f1f]"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <View
                    className="mb-3 h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: isDark ? 'rgba(0, 255, 136, 0.3)' : 'rgba(5, 150, 105, 0.2)' }}
                  >
                    <Plus size={20} color={accentGreen} />
                  </View>
                  <Text className="text-xl font-semibold text-black dark:text-white">Create New House</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">Start fresh with roommates</Text>
                </View>
                <View className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
                  <Text style={{ color: accentGreen }} className="text-xs font-semibold">Create</Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#111]" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 pt-6 pb-8">
        <Pressable onPress={() => setMode('choose')}>
          <Text style={{ color: accentGreen }} className="text-sm font-medium">← Back</Text>
        </Pressable>
        <Text className="text-3xl font-bold text-black dark:text-white mt-4">
          {mode === 'join' ? 'Join House' : 'Create House'}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {mode === 'join'
            ? 'Enter the 6-digit code from your roommate'
            : 'Give your household a name'}
        </Text>
        <TextInput
          style={styles.input}
          className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 text-center text-2xl tracking-[12px] text-black dark:border-[#333] dark:bg-[#1e1e1e] dark:text-white"
          value={mode === 'join' ? houseCode : houseName}
          keyboardType={mode === 'join' ? 'number-pad' : 'default'}
          placeholder={mode === 'join' ? '000000' : 'e.g., The Trap House'}
          placeholderTextColor="#999"
          maxLength={mode === 'join' ? 6 : undefined}
          onChangeText={(value) =>
            mode === 'join' ? setHouseCode(value.replace(/\D/g, '')) : setHouseName(value)
          }
        />
        <Pressable
          onPress={mode === 'join' ? handleJoin : handleCreate}
          disabled={isLoading || (mode === 'join' ? houseCode.length !== 6 : !houseName.trim())}
          style={{ backgroundColor: accentGreen }}
          className="mt-6 rounded-2xl px-6 py-4 disabled:opacity-60"
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-center text-lg font-semibold text-black">
              {mode === 'join' ? 'Join House' : 'Create House'}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    letterSpacing: 6,
  },
});
