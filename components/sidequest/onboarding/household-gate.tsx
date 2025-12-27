import { Home, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type HouseholdGateProps = {
  onContinue: (houseName: string) => void;
};

type Mode = 'choose' | 'join' | 'create';

export function HouseholdGate({ onContinue }: HouseholdGateProps) {
  const [mode, setMode] = useState<Mode>('choose');
  const [houseCode, setHouseCode] = useState('');
  const [houseName, setHouseName] = useState('');

  const handleJoin = () => {
    if (houseCode.length === 6) {
      onContinue('The Trap House');
    }
  };

  const handleCreate = () => {
    if (houseName.trim()) {
      onContinue(houseName.trim());
    }
  };

  if (mode === 'choose') {
    return (
      <SafeAreaView className="flex-1 bg-[#111]" edges={['top', 'bottom']}>
        <View className="flex-1 px-6 pt-6 pb-8">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-white">Find Your Household</Text>
          <Text className="text-sm text-gray-400">Join or create a house to get started</Text>
        </View>
        <View className="mt-10 gap-4">
          <Pressable
            onPress={() => setMode('join')}
            className="rounded-3xl border border-[#333] bg-[#1f1f1f] px-5 py-6"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-[#0F8]/30">
                  <Home size={20} color="#0F8" />
                </View>
                <Text className="text-xl font-semibold text-white">Join Existing House</Text>
                <Text className="text-sm text-gray-400">Enter a 6-digit code</Text>
              </View>
              <View className="rounded-full bg-white/10 px-3 py-1">
                <Text className="text-xs text-[#0F8]">Join</Text>
              </View>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setMode('create')}
            className="rounded-3xl border border-[#333] bg-[#1f1f1f] px-5 py-6"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-[#0F8]/30">
                  <Plus size={20} color="#0F8" />
                </View>
                <Text className="text-xl font-semibold text-white">Create New House</Text>
                <Text className="text-sm text-gray-400">Start fresh with roommates</Text>
              </View>
              <View className="rounded-full bg-white/10 px-3 py-1">
                <Text className="text-xs text-[#0F8]">Create</Text>
              </View>
            </View>
          </Pressable>
        </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#111]" edges={['top', 'bottom']}>
    <View className="flex-1 px-6 pt-6 pb-8">
      <Pressable onPress={() => setMode('choose')}>
        <Text className="text-sm text-[#0F8]">← Back</Text>
      </Pressable>
      <Text className="text-3xl font-bold text-white mt-4">
        {mode === 'join' ? 'Join House' : 'Create House'}
      </Text>
      <Text className="text-sm text-gray-400 mt-2">
        {mode === 'join'
          ? 'Enter the 6-digit code from your roommate'
          : 'Give your household a name'}
      </Text>
      <TextInput
        style={styles.input}
        className="mt-6 rounded-2xl border border-[#333] bg-[#1e1e1e] px-6 py-4 text-center text-2xl tracking-[12px] text-white"
        value={mode === 'join' ? houseCode : houseName}
        keyboardType={mode === 'join' ? 'number-pad' : 'default'}
        placeholder={mode === 'join' ? '000000' : 'e.g., The Trap House'}
        placeholderTextColor="#555"
        maxLength={mode === 'join' ? 6 : undefined}
        onChangeText={(value) =>
          mode === 'join' ? setHouseCode(value.replace(/\D/g, '')) : setHouseName(value)
        }
      />
      <Pressable
        onPress={mode === 'join' ? handleJoin : handleCreate}
        disabled={mode === 'join' ? houseCode.length !== 6 : !houseName.trim()}
        className="mt-6 rounded-2xl bg-[#0F8] px-6 py-4 disabled:opacity-60"
      >
        <Text className="text-center text-lg font-semibold text-black">
          {mode === 'join' ? 'Join House' : 'Create House'}
        </Text>
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
