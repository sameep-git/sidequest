import { HomeTab } from '@/components/sidequest/tabs/home-tab';
import { useHouseholdStore } from '@/lib/household-store';
import { householdService } from '@/lib/services';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function HomeScreen() {
  const houseName = useHouseholdStore((state) => state.houseName);
  const setHousehold = useHouseholdStore((state) => state.setHousehold);
  const setMembers = useHouseholdStore((state) => state.setMembers);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHousehold = async () => {
      try {
        setError(null);
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        if (!userId) {
          setError('You need to sign in again.');
          return;
        }

        const result = await householdService.getPrimaryHouseholdForUser(userId);
        if (!result) {
          setError('No household found. Finish onboarding to continue.');
          return;
        }

        if (!isMounted) return;
        setHousehold({ 
          householdId: result.household.id, 
          houseName: result.household.name,
          joinCode: result.household.join_code
        });
        const memberProfiles = await householdService.getMembers(result.household.id);
        if (!isMounted) return;
        setMembers(memberProfiles);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load household');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadHousehold();
    return () => {
      isMounted = false;
    };
  }, [setHousehold, setMembers]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#111]">
        <ActivityIndicator color="#0F8" />
        <Text className="mt-3 text-sm text-white/70">Loading your household...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-[#111] px-6">
        <Text className="text-center text-base text-white">{error}</Text>
      </View>
    );
  }

  return <HomeTab houseName={houseName} />;
}
