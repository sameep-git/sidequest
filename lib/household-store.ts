import { create } from 'zustand';
import type { HouseholdMemberProfile } from './services';

interface HouseholdState {
  householdId: string | null;
  houseName: string;
  joinCode: string | null;
  members: HouseholdMemberProfile[];
  setHousehold: (payload: { householdId: string; houseName: string; joinCode?: string | null }) => void;
  setHouseName: (name: string) => void;
  setMembers: (members: HouseholdMemberProfile[]) => void;
  reset: () => void;
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  householdId: null,
  houseName: '',
  joinCode: null,
  members: [],
  setHousehold: ({ householdId, houseName, joinCode }) => 
    set({ householdId, houseName, joinCode: joinCode ?? null }),
  setHouseName: (name: string) => set({ houseName: name }),
  setMembers: (members) => set({ members }),
  reset: () => set({ householdId: null, houseName: '', joinCode: null, members: [] }),
}));

export const getHouseName = () => useHouseholdStore.getState().houseName;
