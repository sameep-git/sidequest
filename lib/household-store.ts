import { create } from 'zustand';

interface HouseholdState {
  houseName: string;
  setHouseName: (name: string) => void;
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  houseName: 'The Trap House',
  setHouseName: (name: string) => set({ houseName: name }),
}));

export const getHouseName = () => useHouseholdStore.getState().houseName;
