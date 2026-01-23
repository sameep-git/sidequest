import { Button } from '@/components/ui/button';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { useHouseholdStore } from '@/lib/household-store';
import { shoppingService } from '@/lib/services';
import type { ShoppingItem } from '@/lib/types';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, Trash2, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export function ShopTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const iosMajorVersion = Platform.OS === 'ios' ? Number.parseInt(String(Platform.Version), 10) : null;
  const tabBarClearance = Platform.OS !== 'ios' || (iosMajorVersion != null && iosMajorVersion >= 26) ? 88 : 0;

  const householdId = useHouseholdStore((state) => state.householdId);
  const { user } = useSupabaseUser();

  const [items, setItems] = useState<ShoppingItem[]>([]);
  // shoppingMode state removed
  const [showAddModal, setShowAddModal] = useState(false);
  const [primaryCtaHeight, setPrimaryCtaHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemBounty, setNewItemBounty] = useState('');

  const remainingItems = useMemo(
    () => items.filter((item) => item.status !== 'purchased'),
    [items]
  );

  const fetchItems = useCallback(async () => {
    if (!householdId) return;
    setIsLoading(true);
    try {
      const data = await shoppingService.list(householdId);
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useFocusEffect(
    useCallback(() => {
      if (!householdId) return;
      fetchItems();
    }, [fetchItems, householdId])
  );

  const handleToggleComplete = async (item: ShoppingItem) => {
    try {
      const nextStatus = item.status === 'pending' ? 'purchased' : 'pending';
      const updated = await shoppingService.updateStatus(item.id, nextStatus, user?.id ?? null);
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? updated : entry)));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await shoppingService.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const handleAddItem = async () => {
    if (!householdId || !newItemName.trim()) return;

    try {
      const bounty = Number(newItemBounty);
      const created = await shoppingService.create({
        household_id: householdId,
        name: newItemName.trim(),
        category: null,
        requested_by: user?.id ?? null,
        bounty_amount: Number.isFinite(bounty) && bounty > 0 ? bounty : null,
        status: 'pending',
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setItems((prev) => [created, ...prev]);
      setNewItemName('');
      setNewItemBounty('');
      setShowAddModal(false);
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add item');
    }
  };

  if (!householdId) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-[#222] px-6">
        <Text className="text-center text-white">Join or create a household to view the shopping list.</Text>
      </SafeAreaView>
    );
  }



  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: '#222' }}>
      <View className="px-6 pb-4 pt-5" style={{ borderBottomColor: '#333', borderBottomWidth: 1 }}>
        <Text className="text-3xl font-semibold text-white">Shopping List</Text>
        <Text className="mt-1 text-sm" style={{ color: '#888' }}>
          {remainingItems.length} items to buy
        </Text>
        <Button
          onPress={() => setShowAddModal(true)}
          size="sm"
          className="mt-4"
        >
          <Plus size={18} color="#000" />
          <Text className="ml-2 font-semibold text-black">Add</Text>
        </Button>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0F8" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-4"
          contentContainerStyle={{
            paddingBottom: primaryCtaHeight + insets.bottom + tabBarClearance + 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-3">
            {items
              .sort((a, b) => {
                if (a.status === b.status) return 0;
                return a.status === 'pending' ? -1 : 1;
              })
              .map((item) => (
                <View
                  key={item.id}
                  className="rounded-2xl border px-4 py-4"
                  style={{ backgroundColor: '#2a2a2a', borderColor: '#333' }}
                >
                  <View className="flex-row items-center">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={item.status === 'pending' ? 'Mark complete' : 'Mark pending'}
                      onPress={() => handleToggleComplete(item)}
                      className="mr-3 h-6 w-6 items-center justify-center rounded-full border-2"
                      style={{ borderColor: '#333' }}
                    >
                      {item.status === 'purchased' && (
                        <View className="h-3 w-3 rounded-full" style={{ backgroundColor: '#0F8' }} />
                      )}
                    </Pressable>

                    <View className="flex-1">
                      <Text className={item.status === 'purchased' ? 'text-white/50 line-through' : 'text-white'}>
                        {item.name}
                      </Text>
                      <Text className="mt-1 text-xs" style={{ color: '#888' }}>
                        {item.bounty_amount ? `Bounty +$${item.bounty_amount.toFixed(2)}` : 'No bounty'}
                      </Text>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleDelete(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={18} color="#ff7f7f" />
                    </Pressable>
                  </View>
                </View>
              ))}
          </View>

          {!items.length && (
            <View className="items-center py-12">
              <Text className="text-5xl">🎉</Text>
              <Text className="mt-3 text-xl font-semibold text-white">Nothing to buy</Text>
              <Text className="mt-1 text-sm" style={{ color: '#888' }}>
                Add items to get started
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <View
        className="absolute left-0 right-0 px-6"
        style={{ bottom: insets.bottom + tabBarClearance }}
        onLayout={(event) => setPrimaryCtaHeight(event.nativeEvent.layout.height)}
      >
        <Button
          size="lg"
          onPress={() => router.push('/scan')}
          label="I'm Shopping Now"
          className="w-full"
        />
      </View>

      {showAddModal && (
        <View className="absolute inset-0 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <View
              className="rounded-t-3xl border px-6 pb-8 pt-6"
              style={{
                backgroundColor: '#1f1f1f',
                borderColor: '#333',
                paddingBottom: Math.max(24, insets.bottom + 8),
              }}
            >
              <Text className="text-xl font-semibold text-white">Add Item</Text>

              <TextInput
                className="mt-4 rounded-2xl border px-4 py-4 text-white"
                style={{ backgroundColor: '#111', borderColor: '#333' }}
                placeholder="Item name"
                value={newItemName}
                onChangeText={setNewItemName}
                placeholderTextColor="#666"
                autoFocus
              />

              <TextInput
                className="mt-4 rounded-2xl border px-4 py-4 text-white"
                style={{ backgroundColor: '#111', borderColor: '#333' }}
                placeholder="Bounty (optional)"
                keyboardType="decimal-pad"
                value={newItemBounty}
                onChangeText={setNewItemBounty}
                placeholderTextColor="#666"
              />

              <Button
                disabled={!newItemName.trim()}
                onPress={handleAddItem}
                label="Add to List"
                size="lg"
                className="mt-5 w-full"
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setShowAddModal(false)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                className="absolute right-4 top-4 h-10 w-10 items-center justify-center"
              >
                <X size={20} color="#aaa" />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}
