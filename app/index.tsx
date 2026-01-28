import { EmailAuth } from '@/components/sidequest/onboarding/email-auth';
import { HouseholdGate } from '@/components/sidequest/onboarding/household-gate';
import { Landing } from '@/components/sidequest/onboarding/landing';
import { PermissionPrimer } from '@/components/sidequest/onboarding/permission-primer';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { useHouseholdStore } from '@/lib/household-store';
import { hasRequiredPermissions } from '@/lib/permissions';
import { householdService } from '@/lib/services';
import { getPendingJoinCode, hasPendingJoinCode } from '@/lib/utils/deep-link';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, View } from 'react-native';

type AppPhase = 'loading' | 'landing' | 'email-auth' | 'household' | 'permissions' | 'main';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useSupabaseUser();
  const [phase, setPhase] = useState<AppPhase>('loading');
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasCheckedHousehold, setHasCheckedHousehold] = useState(false);
  const setHousehold = useHouseholdStore((state) => state.setHousehold);
  const setMembers = useHouseholdStore((state) => state.setMembers);

  // When component mounts or is focused, check status
  const isFocused = useIsFocused();

  const checkStatus = useCallback(async () => {
    if (isAuthLoading) return;

    // Don't reset phase if user is in email-auth or household flows
    if (phase === 'email-auth' || phase === 'household' || phase === 'permissions') return;

    if (!user) {
      setPhase('landing');
      setHasCheckedHousehold(false);
      return;
    }

    if (hasCheckedHousehold) return;

    (async () => {
      try {
        const proceedWithHousehold = async (data: any) => {
          setHasCheckedHousehold(true);
          setHousehold({
            householdId: data.household.id,
            houseName: data.household.name,
            joinCode: data.household.join_code,
          });
          const members = await householdService.getMembers(data.household.id);
          setMembers(members);

          const permissionsGranted = await hasRequiredPermissions();
          if (permissionsGranted) {
            setIsNavigating(true);
            router.replace('/(tabs)');
          } else {
            setPhase('permissions');
          }
        };
        const result = await householdService.getPrimaryHouseholdForUser(user.id);

        // If user has a household, check if they are trying to join a NEW one via deep link
        if (result) {
          const hasPending = await hasPendingJoinCode();
          if (hasPending) {
            Alert.alert(
              'Household Invite',
              'You have an invite to join another household. Do you want to leave your current one to join?',
              [
                {
                  text: 'Ignore',
                  style: 'cancel',
                  onPress: async () => {
                    await getPendingJoinCode(); // Clear it
                    proceedWithHousehold(result);
                  }
                },
                {
                  text: 'Switch Household',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await householdService.leave(result.household.id, user.id);
                      useHouseholdStore.getState().reset();
                      setHasCheckedHousehold(false);
                      setPhase('loading');
                      checkStatus();
                    } catch (e) {
                      Alert.alert('Error', 'Failed to leave household');
                      proceedWithHousehold(result);
                    }
                  }
                }
              ]
            );
            return;
          }

          proceedWithHousehold(result);
        } else {
          setHasCheckedHousehold(true);
          setPhase('household');
        }
      } catch (error) {
        console.error('Error checking household:', error);
        setHasCheckedHousehold(true);
        setPhase('household');
      }
    })();
  }, [user, isAuthLoading, hasCheckedHousehold, phase, setHousehold, setMembers, router]);

  useEffect(() => {
    if (isFocused) {
      checkStatus();
    }
  }, [checkStatus, isFocused]);

  if (phase === 'loading' || isNavigating) {
    return (
      <View className="flex-1 items-center justify-center bg-[#111]">
        <View className="h-24 w-24 items-center justify-center rounded-[28px] bg-[#0F8] shadow-[0_8px_16px_rgba(15,248,136,0.35)]">
          <Image
            source={require('@/assets/images/android-chrome-512x512.png')}
            accessibilityLabel="sidequest logo"
            className="h-16 w-16"
            resizeMode="contain"
          />
        </View>
        <Text className="mt-4 text-2xl font-bold text-white">sidequest</Text>
        <ActivityIndicator color="#0F8" size="small" style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (phase === 'landing') {
    return (
      <Landing
        onContinue={() => setPhase('household')}
        onEmailAuth={() => setPhase('email-auth')}
      />
    );
  }

  if (phase === 'email-auth') {
    return (
      <EmailAuth
        onSuccess={() => {

          setPhase('loading');
          setHasCheckedHousehold(false);
        }}
        onBack={() => setPhase('landing')}
      />
    );
  }

  if (phase === 'household') {
    return (
      <HouseholdGate
        onContinue={async (householdId, houseName, joinCode) => {
          setHousehold({
            householdId,
            houseName,
            joinCode,
          });
          const members = await householdService.getMembers(householdId);
          setMembers(members);
          setPhase('permissions');
        }}
      />
    );
  }

  if (phase === 'permissions') {
    return (
      <PermissionPrimer
        onContinue={() => {
          setIsNavigating(true);
          router.replace('/(tabs)');
        }}
      />
    );
  }

  return null;
}
