import { Plus, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type ShopItem = {
  id: number;
  name: string;
  category: string;
  bountyAmount?: number;
  hasBounty: boolean;
  claimedBy?: string;
  completed: boolean;
};

const initialItems: ShopItem[] = [
  { id: 1, name: 'Milk', category: 'Dairy', hasBounty: true, bountyAmount: 2.0, completed: false },
  { id: 2, name: 'Eggs', category: 'Dairy', hasBounty: false, completed: false },
  { id: 3, name: 'Bread', category: 'Bakery', hasBounty: true, bountyAmount: 1.5, claimedBy: 'Sameep', completed: false },
  { id: 4, name: 'Chicken Breast', category: 'Meat', hasBounty: true, bountyAmount: 3.0, completed: false },
  { id: 5, name: 'Bananas', category: 'Produce', hasBounty: false, completed: false },
];

const categories = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Snacks', 'Beverages', 'Other'];

export function ShopTab() {
  const insets = useSafeAreaInsets();
  const iosMajorVersion = Platform.OS === 'ios' ? Number.parseInt(String(Platform.Version), 10) : null;
  const tabBarClearance = Platform.OS !== 'ios' || (iosMajorVersion != null && iosMajorVersion >= 26) ? 88 : 0;
  const [items, setItems] = useState<ShopItem[]>(initialItems);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [primaryCtaHeight, setPrimaryCtaHeight] = useState(0);
  const [newItem, setNewItem] = useState({ name: '', category: 'Other', hasBounty: false, bountyAmount: 0 });

  const remainingItems = items.filter((item) => !item.completed);

  const handleToggleComplete = (id: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)));
  };

  const handleDelete = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClaim = (id: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, claimedBy: 'You' } : item)));
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newItem.name,
        category: newItem.category,
        hasBounty: newItem.hasBounty,
        bountyAmount: newItem.hasBounty ? newItem.bountyAmount : undefined,
        completed: false,
      },
    ]);

    setNewItem({ name: '', category: 'Other', hasBounty: false, bountyAmount: 0 });
    setShowAddModal(false);
  };

  if (shoppingMode) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: '#0F8' }}>
        <View className="px-6 py-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="h-8 w-8 items-center justify-center rounded-full bg-white"
            onPress={() => setShoppingMode(false)}
          >
            <X size={20} color="#000" />
          </Pressable>

          <View className="mt-4 items-center">
            <Text className="text-2xl font-semibold text-black">You are at Kroger</Text>
            <Text className="mt-1 text-sm text-black/80">Here's what you need</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-3">
            {remainingItems.map((item) => (
              <View key={item.id} className="flex-row items-center rounded-2xl bg-[#1b1b1b] px-4 py-4">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.completed ? 'Mark incomplete' : 'Mark complete'}
                  onPress={() => handleToggleComplete(item.id)}
                  className="mr-3 h-6 w-6 items-center justify-center rounded-full border-2"
                  style={{ borderColor: '#333' }}
                >
                  {item.completed && <View className="h-3 w-3 rounded-full" style={{ backgroundColor: '#0F8' }} />}
                </Pressable>
                <View className="flex-1">
                  <Text className="font-semibold text-white">{item.name}</Text>
                  <Text className="mt-1 text-xs text-white/70">{item.category}</Text>
                </View>
                {item.hasBounty && (
                  <Text className="font-semibold" style={{ color: '#f6b044' }}>
                    +${item.bountyAmount?.toFixed(2)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        <View className="px-6" style={{ paddingBottom: insets.bottom + tabBarClearance }}>
          <Pressable
            accessibilityRole="button"
            className="items-center justify-center rounded-2xl px-4 py-4"
            style={{ backgroundColor: '#0F8' }}
          >
            <Text className="font-semibold text-black">Scan Receipt</Text>
          </Pressable>
        </View>
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
        <Pressable
          accessibilityRole="button"
          className="mt-4 flex-row items-center justify-center rounded-2xl px-5 py-3"
          style={{ backgroundColor: '#0F8' }}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={18} color="#000" />
          <Text className="ml-2 font-semibold text-black">Add</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4"
        contentContainerStyle={{
          paddingBottom: primaryCtaHeight + insets.bottom + tabBarClearance + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          {items.map((item) => (
            <View
              key={item.id}
              className="rounded-2xl border px-4 py-4"
              style={{ backgroundColor: '#2a2a2a', borderColor: '#333' }}
            >
              <View className="flex-row items-center">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.completed ? 'Mark incomplete' : 'Mark complete'}
                  onPress={() => handleToggleComplete(item.id)}
                  className="mr-3 h-6 w-6 items-center justify-center rounded-full border-2"
                  style={{ borderColor: '#333' }}
                >
                  {item.completed && <View className="h-3 w-3 rounded-full" style={{ backgroundColor: '#0F8' }} />}
                </Pressable>

                <View className="flex-1">
                  <Text className={item.completed ? 'text-white/50 line-through' : 'text-white'}>
                    {item.name}
                  </Text>
                  <Text className="mt-1 text-xs" style={{ color: '#888' }}>
                    {item.category}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  {!item.claimedBy && !item.completed && (
                    <Pressable accessibilityRole="button" className="mr-3" onPress={() => handleClaim(item.id)}>
                      <Text className="font-semibold" style={{ color: '#0F8' }}>
                        Claim
                      </Text>
                    </Pressable>
                  )}
                  <Pressable accessibilityRole="button" onPress={() => handleDelete(item.id)}>
                    <Trash2 size={18} color="#ff7f7f" />
                  </Pressable>
                </View>
              </View>

              <View className="mt-3 flex-row items-center">
                {item.hasBounty && !item.completed && (
                  <Text className="mr-3 font-semibold" style={{ color: '#f6b044' }}>
                    +${item.bountyAmount?.toFixed(2)}
                  </Text>
                )}
                {item.claimedBy && !item.completed && (
                  <Text className="text-xs" style={{ color: '#0F8' }}>
                    Claimed by {item.claimedBy}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {remainingItems.length === 0 && (
          <View className="items-center py-12">
            <Text className="text-5xl">🎉</Text>
            <Text className="mt-3 text-xl font-semibold text-white">All Done!</Text>
            <Text className="mt-1 text-sm" style={{ color: '#888' }}>
              Add items to get started
            </Text>
          </View>
        )}
      </ScrollView>

      <View
        className="absolute left-0 right-0 px-6"
        style={{ bottom: insets.bottom + tabBarClearance }}
        onLayout={(event) => setPrimaryCtaHeight(event.nativeEvent.layout.height)}
      >
        <Pressable
          accessibilityRole="button"
          className="items-center justify-center rounded-2xl px-4 py-4"
          style={{ backgroundColor: '#0F8' }}
          onPress={() => setShoppingMode(true)}
        >
          <Text className="font-semibold text-black">I'm Shopping Now</Text>
        </Pressable>
      </View>

      {showAddModal && (
        <View className="absolute inset-0 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <View
            className="rounded-t-3xl border px-6 pb-8 pt-6"
            style={{
              backgroundColor: '#1f1f1f',
              borderColor: '#333',
              paddingBottom: 32 + insets.bottom + tabBarClearance,
            }}
          >
            <Text className="text-xl font-semibold text-white">Add Item</Text>

            <TextInput
              className="mt-4 rounded-2xl border px-4 py-4 text-white"
              style={{ backgroundColor: '#111', borderColor: '#333' }}
              placeholder="Item name"
              value={newItem.name}
              onChangeText={(value) => setNewItem((prev) => ({ ...prev, name: value }))}
              placeholderTextColor="#666"
            />

            <View className="mt-4 flex-row flex-wrap">
              {categories.map((category) => {
                const isActive = newItem.category === category;
                return (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    onPress={() => setNewItem((prev) => ({ ...prev, category }))}
                    className="mb-2 mr-2 rounded-2xl border px-3 py-2"
                    style={{
                      borderColor: isActive ? '#0F8' : '#444',
                      backgroundColor: isActive ? '#0F8' : 'transparent',
                    }}
                  >
                    <Text className={isActive ? 'text-xs font-semibold text-black' : 'text-xs text-white/70'}>
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-sm text-white">Add bounty</Text>
              <Switch
                value={newItem.hasBounty}
                onValueChange={(value) => setNewItem((prev) => ({ ...prev, hasBounty: value }))}
                thumbColor={newItem.hasBounty ? '#0F8' : '#888'}
                trackColor={{ false: '#444', true: '#0F8AA' }}
              />
            </View>

            {newItem.hasBounty && (
              <TextInput
                className="mt-4 rounded-2xl border px-4 py-4 text-white"
                style={{ backgroundColor: '#111', borderColor: '#333' }}
                placeholder="$0.00"
                keyboardType="numeric"
                value={newItem.bountyAmount ? newItem.bountyAmount.toString() : ''}
                onChangeText={(value) =>
                  setNewItem((prev) => ({
                    ...prev,
                    bountyAmount: parseFloat(value) || 0,
                  }))
                }
                placeholderTextColor="#666"
              />
            )}

            <Pressable
              accessibilityRole="button"
              className="mt-5 items-center justify-center rounded-2xl px-4 py-4"
              style={{ backgroundColor: '#0F8' }}
              onPress={handleAddItem}
            >
              <Text className="font-semibold text-black">Add to List</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={() => setShowAddModal(false)}
              className="absolute right-4 top-4 h-10 w-10 items-center justify-center"
            >
              <X size={20} color="#aaa" />
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
