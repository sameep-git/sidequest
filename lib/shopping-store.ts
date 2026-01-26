import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { shoppingService } from './services';
import type { ShoppingItem } from './types';

type OfflineAction = {
    id: string;
    type: 'add' | 'update' | 'delete';
    payload: any;
    timestamp: number;
};

interface ShoppingState {
    items: ShoppingItem[];
    offlineQueue: OfflineAction[];
    lastSyncedAt: number | null;
    isHydrated: boolean;

    // Actions
    setItems: (items: ShoppingItem[]) => void;
    addItem: (item: ShoppingItem) => void;
    updateItem: (id: string, updates: Partial<ShoppingItem>) => void;
    removeItem: (id: string) => void;

    // Offline queue actions
    queueAction: (action: Omit<OfflineAction, 'id' | 'timestamp'>) => void;
    clearQueue: () => void;
    syncOfflineActions: () => Promise<void>;
    setHydrated: (hydrated: boolean) => void;
}

export const useShoppingStore = create<ShoppingState>()(
    persist(
        (set, get) => ({
            items: [],
            offlineQueue: [],
            lastSyncedAt: null,
            isHydrated: false,

            setItems: (items) => set({ items, lastSyncedAt: Date.now() }),

            addItem: (item) =>
                set((state) => ({
                    items: [item, ...state.items],
                })),

            updateItem: (id, updates) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id ? { ...item, ...updates } : item
                    ),
                })),

            removeItem: (id) =>
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                })),

            queueAction: (action) =>
                set((state) => ({
                    offlineQueue: [
                        ...state.offlineQueue,
                        {
                            ...action,
                            id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
                            timestamp: Date.now(),
                        },
                    ],
                })),

            clearQueue: () => set({ offlineQueue: [] }),

            syncOfflineActions: async () => {
                const { offlineQueue, removeItem, updateItem: storeUpdateItem } = get();
                if (offlineQueue.length === 0) return;

                const failedActions: OfflineAction[] = [];

                for (const action of offlineQueue) {
                    try {
                        switch (action.type) {
                            case 'add':
                                await shoppingService.create(action.payload);
                                break;
                            case 'update':
                                await shoppingService.updateStatus(
                                    action.payload.id,
                                    action.payload.status,
                                    action.payload.purchased_by
                                );
                                break;
                            case 'delete':
                                await shoppingService.delete(action.payload.id);
                                break;
                        }
                    } catch (error) {
                        // Keep failed actions in queue for retry
                        failedActions.push(action);
                    }
                }

                set({ offlineQueue: failedActions });
            },

            setHydrated: (hydrated) => set({ isHydrated: hydrated }),
        }),
        {
            name: 'sidequest-shopping-storage',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
            partialize: (state) => ({
                items: state.items,
                offlineQueue: state.offlineQueue,
                lastSyncedAt: state.lastSyncedAt,
            }),
        }
    )
);
