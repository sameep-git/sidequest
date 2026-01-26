import { authService } from '@/lib/auth';
import { useHouseholdStore } from '@/lib/household-store';
import { userService } from '@/lib/services';
import { useRouter } from 'expo-router';
import { ChevronRight, LogOut, Mail, Shield, User } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SettingsScreenProps = {
    user: {
        id: string;
        email: string | null;
        display_name: string | null;
        venmo_handle: string | null;
    };
    onClose: () => void;
};

export function SettingsScreen({ user, onClose }: SettingsScreenProps) {
    const router = useRouter();
    const resetHousehold = useHouseholdStore((state) => state.reset);
    const [displayName, setDisplayName] = useState(user.display_name ?? '');
    const [venmoHandle, setVenmoHandle] = useState(user.venmo_handle ?? '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await userService.upsert({
                id: user.id,
                email: user.email,
                display_name: displayName || null,
                avatar_url: null,
                venmo_handle: venmoHandle || null,
            });
            Alert.alert('Success', 'Profile updated');
        } catch {
            Alert.alert('Error', 'Failed to update Venmo handle');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authService.signOut();
                            resetHousehold();
                            router.replace('/');
                        } catch {
                            Alert.alert('Error', 'Failed to sign out');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: '#222' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-[#333] px-6 py-4">
                <Pressable onPress={onClose} className="p-2 -ml-2">
                    <Text className="text-[#0F8] font-semibold text-base">Done</Text>
                </Pressable>
                <Text className="text-lg font-bold text-white">Settings</Text>
                <View className="w-12" />
            </View>

            <View className="flex-1 px-6 pt-6">
                {/* Profile Section */}
                <Text className="text-xs uppercase tracking-wider text-[#888] mb-3">Profile</Text>
                <View className="rounded-2xl border border-[#333] bg-[#2a2a2a] mb-6">
                    <View className="flex-row items-center px-4 py-3 border-b border-[#333]">
                        <User size={18} color="#888" />
                        <TextInput
                            className="flex-1 ml-3 text-white text-base"
                            placeholder="Display Name"
                            placeholderTextColor="#666"
                            value={displayName}
                            onChangeText={setDisplayName}
                        />
                    </View>
                    <View className="flex-row items-center px-4 py-3 border-b border-[#333]">
                        <Mail size={18} color="#888" />
                        <Text className="flex-1 ml-3 text-[#666] text-base">{user.email ?? 'No email'}</Text>
                    </View>
                    <View className="flex-row items-center px-4 py-3">
                        <Text className="text-[#008CFF] text-base font-bold">V</Text>
                        <TextInput
                            className="flex-1 ml-3 text-white text-base"
                            placeholder="Venmo Handle (e.g., @username)"
                            placeholderTextColor="#666"
                            value={venmoHandle}
                            onChangeText={setVenmoHandle}
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                <Pressable
                    onPress={handleSaveProfile}
                    disabled={isSaving}
                    className="rounded-2xl py-3 px-4 mb-6"
                    style={{ backgroundColor: '#0F8' }}
                >
                    <Text className="text-center font-semibold text-black">
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </Text>
                </Pressable>

                {/* Legal Section */}
                <Text className="text-xs uppercase tracking-wider text-[#888] mb-3">Legal</Text>
                <View className="rounded-2xl border border-[#333] bg-[#2a2a2a] mb-6">
                    <Pressable className="flex-row items-center justify-between px-4 py-3 border-b border-[#333]">
                        <View className="flex-row items-center">
                            <Shield size={18} color="#888" />
                            <Text className="ml-3 text-white text-base">Privacy Policy</Text>
                        </View>
                        <ChevronRight size={18} color="#666" />
                    </Pressable>
                    <Pressable className="flex-row items-center justify-between px-4 py-3">
                        <View className="flex-row items-center">
                            <Shield size={18} color="#888" />
                            <Text className="ml-3 text-white text-base">Terms of Service</Text>
                        </View>
                        <ChevronRight size={18} color="#666" />
                    </Pressable>
                </View>

                {/* Logout Section */}
                <Pressable
                    onPress={handleLogout}
                    className="flex-row items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 py-4"
                >
                    <LogOut size={18} color="#ef4444" />
                    <Text className="ml-2 font-semibold text-red-400">Sign Out</Text>
                </Pressable>

                {/* App Version */}
                <Text className="text-center text-xs text-[#666] mt-6">
                    sidequest v1.0.0
                </Text>
            </View>
        </SafeAreaView>
    );
}
