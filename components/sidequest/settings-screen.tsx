import { authService } from '@/lib/auth';
import { useHouseholdStore } from '@/lib/household-store';
import { householdService, userService } from '@/lib/services';
import { useThemeStore } from '@/lib/theme-store';
import { useRouter } from 'expo-router';
import { ChevronRight, DoorOpen, LogOut, Mail, Moon, Shield, Smartphone, Sun, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { Alert, AlertButton, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    const insets = useSafeAreaInsets();
    const householdId = useHouseholdStore((state) => state.householdId);
    const setMembers = useHouseholdStore((state) => state.setMembers);
    const resetHousehold = useHouseholdStore((state) => state.reset);
    const { themeMode, setThemeMode } = useThemeStore();
    const { colorScheme, setColorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [displayName, setDisplayName] = useState(user.display_name ?? '');
    const [venmoHandle, setVenmoHandle] = useState(user.venmo_handle ?? '');
    const [isSaving, setIsSaving] = useState(false);

    const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
        setColorScheme(mode);
        setThemeMode(mode);
    };

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

            // Refresh household members to update displayName in UI
            if (householdId) {
                const updatedMembers = await householdService.getMembers(householdId);
                setMembers(updatedMembers);
            }

            Alert.alert('Success', 'Profile updated');
        } catch {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        const buttons: AlertButton[] = [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    try {
                        onClose();
                        await authService.signOut();
                        resetHousehold();
                        // Small delay to ensure modal is dismissed before navigating
                        setTimeout(() => {
                            router.replace('/');
                        }, 100);
                    } catch (e) {
                        console.error('Sign out failed:', e);
                        Alert.alert('Error', 'Failed to sign out. Please try again.');
                    }
                },
            },
        ];

        Alert.alert('Sign Out', 'Are you sure you want to sign out?', buttons);
    };

    const handleLeaveHousehold = async () => {
        if (!householdId) return;

        const buttons: AlertButton[] = [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Leave',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await householdService.leave(householdId, user.id);
                        onClose();
                        resetHousehold();
                        // Navigate back to root which will show join/create screen
                        setTimeout(() => {
                            router.replace('/');
                        }, 100);
                    } catch (e) {
                        console.error('Leave household failed:', e);
                        Alert.alert('Error', 'Failed to leave household. Please try again.');
                    }
                },
            },
        ];

        Alert.alert(
            'Leave Household',
            'Are you sure you want to leave? You will need a new join code to rejoin this household.',
            buttons
        );
    };

    // Use inline styles for immediate theme reactivity
    const bgColor = isDark ? '#222' : '#f2f2f2';
    const cardBg = isDark ? '#2a2a2a' : '#fff';
    const borderColor = isDark ? '#333' : '#e5e7eb';
    const textColor = isDark ? '#fff' : '#000';
    const mutedText = isDark ? '#888' : '#6b7280';
    const accentColor = isDark ? '#0F8' : '#059669';

    return (
        <View style={{ flex: 1, backgroundColor: bgColor, paddingTop: insets.top }}>
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
                paddingHorizontal: 24,
                paddingVertical: 16,
                backgroundColor: isDark ? '#222' : '#fff',
            }}>
                <Pressable
                    onPress={onClose}
                    style={{ padding: 8, marginLeft: -8 }}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <Text style={{ color: accentColor, fontWeight: '600', fontSize: 16 }}>Done</Text>
                </Pressable>
                <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>Settings</Text>
                <View style={{ width: 48 }} />
            </View>

            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>
                {/* Profile Section */}
                <Text style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: mutedText, marginBottom: 12 }}>Profile</Text>
                <View style={{ borderRadius: 16, borderWidth: 1, backgroundColor: cardBg, borderColor, marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderColor }}>
                        <User size={18} color={mutedText} />
                        <TextInput
                            style={{ flex: 1, marginLeft: 12, height: 24, color: textColor, fontSize: 16, padding: 0 }}
                            placeholder="Display Name"
                            placeholderTextColor="#999"
                            value={displayName}
                            onChangeText={setDisplayName}
                            textAlignVertical="center"
                        />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderColor }}>
                        <Mail size={18} color={mutedText} />
                        <Text style={{ flex: 1, marginLeft: 12, color: mutedText, fontSize: 16 }}>{user.email ?? 'No email'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
                        <Text style={{ color: '#008CFF', fontSize: 16, fontWeight: '700' }}>V</Text>
                        <TextInput
                            style={{ flex: 1, marginLeft: 12, height: 24, color: textColor, fontSize: 16, padding: 0 }}
                            placeholder="Venmo Handle (e.g., @username)"
                            placeholderTextColor="#666"
                            value={venmoHandle}
                            onChangeText={setVenmoHandle}
                            autoCapitalize="none"
                            textAlignVertical="center"
                        />
                    </View>
                </View>

                <Pressable
                    onPress={handleSaveProfile}
                    disabled={isSaving}
                    style={{ borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 24, backgroundColor: accentColor }}
                >
                    <Text style={{ textAlign: 'center', fontWeight: '600', color: isDark ? '#000' : '#fff' }}>
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </Text>
                </Pressable>

                {/* Appearance Section */}
                <Text style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: mutedText, marginBottom: 12 }}>Appearance</Text>
                <View style={{ borderRadius: 16, borderWidth: 1, backgroundColor: cardBg, borderColor, marginBottom: 24, flexDirection: 'row', overflow: 'hidden' }}>
                    <Pressable
                        onPress={() => handleThemeChange('system')}
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 12,
                            borderRightWidth: 1,
                            borderRightColor: borderColor,
                            backgroundColor: themeMode === 'system' ? (isDark ? '#333' : '#f3f4f6') : 'transparent',
                        }}
                    >
                        <Smartphone size={20} color={themeMode === 'system' ? accentColor : mutedText} />
                        <Text style={{ fontSize: 12, marginTop: 4, color: themeMode === 'system' ? textColor : mutedText }}>System</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => handleThemeChange('dark')}
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 12,
                            borderRightWidth: 1,
                            borderRightColor: borderColor,
                            backgroundColor: themeMode === 'dark' ? (isDark ? '#333' : '#f3f4f6') : 'transparent',
                        }}
                    >
                        <Moon size={20} color={themeMode === 'dark' ? accentColor : mutedText} />
                        <Text style={{ fontSize: 12, marginTop: 4, color: themeMode === 'dark' ? textColor : mutedText }}>Dark</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => handleThemeChange('light')}
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 12,
                            backgroundColor: themeMode === 'light' ? (isDark ? '#333' : '#f3f4f6') : 'transparent',
                        }}
                    >
                        <Sun size={20} color={themeMode === 'light' ? accentColor : mutedText} />
                        <Text style={{ fontSize: 12, marginTop: 4, color: themeMode === 'light' ? textColor : mutedText }}>Light</Text>
                    </Pressable>
                </View>

                {/* Legal Section */}
                <Text style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: mutedText, marginBottom: 12 }}>Legal</Text>
                <View style={{ borderRadius: 16, borderWidth: 1, backgroundColor: cardBg, borderColor, marginBottom: 24 }}>
                    <Pressable
                        onPress={() => Alert.alert('Privacy Policy', 'This would open the privacy policy.')}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderColor }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Shield size={18} color={mutedText} />
                            <Text style={{ marginLeft: 12, color: textColor, fontSize: 16 }}>Privacy Policy</Text>
                        </View>
                        <ChevronRight size={18} color={isDark ? '#666' : '#9ca3af'} />
                    </Pressable>
                    <Pressable
                        onPress={() => Alert.alert('Terms of Service', 'This would open the terms of service.')}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Shield size={18} color={mutedText} />
                            <Text style={{ marginLeft: 12, color: textColor, fontSize: 16 }}>Terms of Service</Text>
                        </View>
                        <ChevronRight size={18} color={isDark ? '#666' : '#9ca3af'} />
                    </Pressable>
                </View>

                {/* Leave Household Section */}
                {householdId && (
                    <Pressable
                        onPress={handleLeaveHousehold}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(251, 146, 60, 0.4)', backgroundColor: 'rgba(251, 146, 60, 0.1)', paddingVertical: 16, marginBottom: 12 }}
                    >
                        <DoorOpen size={18} color="#fb923c" />
                        <Text style={{ marginLeft: 8, fontWeight: '600', color: '#fb923c' }}>Leave Household</Text>
                    </Pressable>
                )}

                {/* Logout Section */}
                <Pressable
                    onPress={handleLogout}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 16 }}
                >
                    <LogOut size={18} color="#ef4444" />
                    <Text style={{ marginLeft: 8, fontWeight: '600', color: '#f87171' }}>Sign Out</Text>
                </Pressable>

                {/* App Version */}
                <Text style={{ textAlign: 'center', fontSize: 12, color: '#666', marginTop: 24 }}>
                    sidequest v1.0.0
                </Text>
            </View>
        </View>
    );
}
