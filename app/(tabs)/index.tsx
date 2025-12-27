import { HomeTab } from '@/components/sidequest/tabs/home-tab';
import { useHouseholdStore } from '@/lib/household-store';

export default function HomeScreen() {
  const houseName = useHouseholdStore((state) => state.houseName);
  return <HomeTab houseName={houseName} />;
}
