import { HouseholdGate } from '@/components/sidequest/onboarding/household-gate';
import { Landing } from '@/components/sidequest/onboarding/landing';
import { PermissionPrimer } from '@/components/sidequest/onboarding/permission-primer';
import { useHouseholdStore } from '@/lib/household-store';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

type AppPhase = 'landing' | 'household' | 'permissions' | 'main';

export default function IndexScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<AppPhase>('landing');
  const setHouseName = useHouseholdStore((state) => state.setHouseName);

  useEffect(() => {
    if (phase === 'main') {
      router.replace('/(tabs)');
    }
  }, [phase, router]);

  if (phase === 'landing') {
    return <Landing onContinue={() => setPhase('household')} />;
  }

  if (phase === 'household') {
    return (
      <HouseholdGate
        onContinue={(name) => {
          setHouseName(name);
          setPhase('permissions');
        }}
      />
    );
  }

  return <PermissionPrimer onContinue={() => setPhase('main')} />;
}
