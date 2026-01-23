import { EmailAuth } from '@/components/sidequest/onboarding/email-auth';
import { HouseholdGate } from '@/components/sidequest/onboarding/household-gate';
import { Landing } from '@/components/sidequest/onboarding/landing';
import { PermissionPrimer } from '@/components/sidequest/onboarding/permission-primer';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { useHouseholdStore } from '@/lib/household-store';
import { hasRequiredPermissions } from '@/lib/permissions';
import { householdService } from '@/lib/services';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

type AppPhase = 'loading' | 'landing' | 'email-auth' | 'household' | 'permissions' | 'main';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useSupabaseUser();
  const [phase, setPhase] = useState<AppPhase>('loading');
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasCheckedHousehold, setHasCheckedHousehold] = useState(false);
  const setHousehold = useHouseholdStore((state) => state.setHousehold);
  const setMembers = useHouseholdStore((state) => state.setMembers);

  // Check if user already has a household
  useEffect(() => {
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
        const result = await householdService.getPrimaryHouseholdForUser(user.id);
        setHasCheckedHousehold(true);
        if (result) {
          setHousehold({
            householdId: result.household.id,
            houseName: result.household.name,
            joinCode: result.household.join_code,
          });
          const members = await householdService.getMembers(result.household.id);
          setMembers(members);

          // Check if user has granted permissions
          const permissionsGranted = await hasRequiredPermissions();

          if (permissionsGranted) {
            setIsNavigating(true);
            router.replace('/(tabs)');
          } else {
            setPhase('permissions');
          }
        } else {
          setPhase('household');
        }
      } catch (error) {
        console.error('Error checking household:', error);
        setHasCheckedHousehold(true);
        setPhase('household');
      }
    })();
  }, [user, isAuthLoading, hasCheckedHousehold, phase, setHousehold, setMembers, router]);

  if (phase === 'loading' || isNavigating) {
    return (
      <View className="flex-1 items-center justify-center bg-[#111]">
        <ActivityIndicator color="#0F8" size="large" />
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
          console.log('✅ Email auth success! Resetting to check household...');
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
