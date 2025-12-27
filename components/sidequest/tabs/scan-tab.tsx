import { Camera, Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type ReceiptItem = {
  id: number;
  name: string;
  price: number;
  assignedTo?: string;
  splitType?: 'individual' | 'split';
};

const mockRoommates = [
  { id: 1, name: 'Sameep', initial: 'S', color: '#0F8' },
  { id: 2, name: 'Alex', initial: 'A', color: '#8b5cf6' },
  { id: 3, name: 'Jordan', initial: 'J', color: '#3b82f6' },
];

const initialReceiptItems: ReceiptItem[] = [
  { id: 1, name: 'Milk - Whole Gallon', price: 4.5 },
  { id: 2, name: 'Eggs - 12ct', price: 3.2 },
  { id: 3, name: 'Bread - Wheat Loaf', price: 2.8 },
  { id: 4, name: 'Chicken Breast - 2lb', price: 12.4 },
  { id: 5, name: 'Bananas - Organic', price: 3.6 },
  { id: 6, name: 'Orange Juice - 64oz', price: 5.3 },
  { id: 7, name: 'Cereal - Cheerios', price: 4.8 },
  { id: 8, name: 'Butter - Salted', price: 3.9 },
];

type ScanState = 'idle' | 'scanning' | 'processing' | 'itemizing' | 'summary';

export function ScanTab() {
  const insets = useSafeAreaInsets();
  const iosMajorVersion = Platform.OS === 'ios' ? Number.parseInt(String(Platform.Version), 10) : null;
  const tabBarClearance = Platform.OS !== 'ios' || (iosMajorVersion != null && iosMajorVersion >= 26) ? 88 : 0;
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>(initialReceiptItems);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const totalAmount = receiptItems.reduce((sum, item) => sum + item.price, 0);
  const assignedAmount = receiptItems
    .filter((item) => item.assignedTo)
    .reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current = [];
    };
  }, []);

  const startAnimation = () => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];
    setScanState('scanning');
    const processingTimeout = setTimeout(() => setScanState('processing'), 1200);
    const itemizingTimeout = setTimeout(() => setScanState('itemizing'), 3200);
    timeoutsRef.current.push(processingTimeout, itemizingTimeout);
  };

  const handleAssignToRoommate = (roommateName: string) => {
    if (selectedItem === null) {
      return;
    }
    setReceiptItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem
          ? { ...item, assignedTo: roommateName, splitType: 'individual' }
          : item
      )
    );
    setSelectedItem(null);
  };

  const handleSplit = () => {
    if (selectedItem === null) {
      return;
    }
    setReceiptItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem ? { ...item, assignedTo: 'Split', splitType: 'split' } : item
      )
    );
    setSelectedItem(null);
  };

  const handlePostToHouse = () => {
    setScanState('summary');
  };

  if (scanState === 'idle' || scanState === 'scanning') {
    return (
      <SafeAreaView
        edges={['top']}
        className="flex-1 bg-black items-center justify-center px-6"
        style={{ paddingBottom: insets.bottom + tabBarClearance }}
      >
        <View className="flex-1 w-full items-center justify-center">
          <View
            className="relative h-[260px] w-[220px] rounded-3xl border-4"
            style={{ borderColor: 'rgba(15, 248, 136, 0.5)' }}
          >
            <View
              className="absolute"
              style={{
                top: -4,
                left: -4,
                width: 28,
                height: 28,
                borderLeftWidth: 4,
                borderTopWidth: 4,
                borderColor: '#0F8',
                borderTopLeftRadius: 12,
              }}
            />
            <View
              className="absolute"
              style={{
                top: -4,
                right: -4,
                width: 28,
                height: 28,
                borderRightWidth: 4,
                borderTopWidth: 4,
                borderColor: '#0F8',
                borderTopRightRadius: 12,
              }}
            />
            <View
              className="absolute"
              style={{
                bottom: -4,
                left: -4,
                width: 28,
                height: 28,
                borderLeftWidth: 4,
                borderBottomWidth: 4,
                borderColor: '#0F8',
                borderBottomLeftRadius: 12,
              }}
            />
            <View
              className="absolute"
              style={{
                bottom: -4,
                right: -4,
                width: 28,
                height: 28,
                borderRightWidth: 4,
                borderBottomWidth: 4,
                borderColor: '#0F8',
                borderBottomRightRadius: 12,
              }}
            />
          </View>
        </View>

        <Text className="mb-6 text-lg text-white">Align receipt edges</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Capture" className="mb-2" onPress={startAnimation}>
          <View
            className="h-20 w-20 items-center justify-center rounded-full border-4"
            style={{ backgroundColor: '#0F8', borderColor: 'rgba(15, 248, 136, 0.3)' }}
          >
            <Camera size={28} color="#000" />
          </View>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (scanState === 'processing') {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center" style={{ backgroundColor: '#222' }}>
        <View className="items-center">
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 24,
              borderWidth: 4,
              borderColor: '#333',
              borderTopColor: '#0F8',
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
              marginBottom: 20,
            }}
          />
          <Text className="text-xl font-semibold text-white">Analyzing Receipt</Text>
          <Text className="mt-1 text-sm text-white/70">Detecting items and prices...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (scanState === 'summary') {
    const youOwe = assignedAmount - totalAmount;
    const youAreOwed = totalAmount - assignedAmount;

    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: '#222' }}>
        <View className="items-center pb-6" style={{ backgroundColor: '#0F8', paddingTop: 40 }}>
          <View className="h-18 w-18 items-center justify-center rounded-full bg-black">
            <Check size={28} color="#000" />
          </View>
          <Text className="mt-3 text-2xl font-semibold text-black">Receipt Posted!</Text>
          <Text className="mt-1 text-sm text-black/80">Your roommates have been notified</Text>
        </View>

        <ScrollView contentContainerClassName="px-6 py-6 pb-0" showsVerticalScrollIndicator={false}>
          <View className="rounded-3xl border p-4" style={{ backgroundColor: '#2a2a2a', borderColor: '#333' }}>
            <Text className="mb-3 font-semibold text-white">Summary</Text>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-white/70">You paid:</Text>
              <Text className="font-semibold text-white">${totalAmount.toFixed(2)}</Text>
            </View>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-white/70">Your share:</Text>
              <Text className="font-semibold text-white">${(totalAmount / 3).toFixed(2)}</Text>
            </View>
            <View className="my-2 h-px" style={{ backgroundColor: '#333' }} />
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-white">You are owed:</Text>
              <Text className="font-semibold" style={{ color: '#0F8' }}>
                ${youAreOwed.toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="mt-4 rounded-3xl border p-4" style={{ backgroundColor: '#2a2a2a', borderColor: '#0F8' }}>
            <Text className="mb-3 font-semibold text-white">Breakdown by Roommate</Text>
            <View className="gap-3">
              {mockRoommates.map((roommate) => {
                const roommateItems = receiptItems.filter(
                  (item) => item.assignedTo === roommate.name || item.splitType === 'split'
                );
                const roommateTotal = roommateItems.reduce((sum, item) => {
                  if (item.splitType === 'split') {
                    return sum + item.price / 3;
                  }
                  return sum + item.price;
                }, 0);

                return (
                  <View key={roommate.id} className="flex-row items-center justify-between">
                    <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: '#1a1a1a' }}>
                      <Text className="text-base font-semibold text-white">{roommate.initial}</Text>
                    </View>
                    <Text className="ml-3 flex-1 text-[15px] font-semibold text-white">{roommate.name}</Text>
                    <Text className="font-semibold text-white/70">${roommateTotal.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View className="h-6" />
        </ScrollView>

        <View className="px-6" style={{ paddingBottom: insets.bottom + tabBarClearance }}>
          <Pressable
            accessibilityRole="button"
            className="items-center justify-center rounded-2xl py-4"
            style={{ backgroundColor: '#0F8' }}
            onPress={() => setScanState('idle')}
          >
            <Text className="font-semibold text-black">Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: '#222' }}>
      <View className="px-6 pb-3" style={{ paddingTop: 32, borderBottomWidth: 1, borderBottomColor: '#333' }}>
        <Text className="text-3xl font-semibold text-white">Assign Items</Text>
        <Text className="mt-1 text-sm text-white/60">Total: ${totalAmount.toFixed(2)}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 pb-2" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          {receiptItems.map((item) => {
            const isSelected = selectedItem === item.id;
            const isAssigned = Boolean(item.assignedTo);
            const isSplit = item.splitType === 'split';

            let borderColor = '#333';
            let backgroundColor = '#2a2a2a';
            if (isSelected) {
              borderColor = '#0F8';
              backgroundColor = 'rgba(15, 248, 136, 0.15)';
            } else if (isAssigned) {
              if (isSplit) {
                borderColor = '#8b5cf6';
                backgroundColor = 'rgba(139, 92, 246, 0.08)';
              } else {
                borderColor = '#0F8';
                backgroundColor = 'rgba(15, 248, 136, 0.08)';
              }
            }

            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => setSelectedItem(item.id)}
                className="rounded-2xl border-2 px-4 py-4"
                style={{ borderColor, backgroundColor }}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 pr-3 font-semibold text-white">{item.name}</Text>
                  <Text className="font-semibold text-white">${item.price.toFixed(2)}</Text>
                </View>
                {item.assignedTo && (
                  <Text className="mt-2 text-sm font-semibold" style={{ color: '#0F8' }}>
                    {item.assignedTo}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {selectedItem !== null && (
        <View className="px-6 py-4" style={{ borderTopWidth: 1, borderTopColor: '#333' }}>
          <Text className="mb-3 text-sm text-white/70">Assign to...</Text>
          <View className="flex-row items-start">
            {mockRoommates.map((roommate) => (
              <Pressable
                key={roommate.id}
                accessibilityRole="button"
                className="mr-4 items-center"
                onPress={() => handleAssignToRoommate(roommate.name)}
              >
                <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
                  <Text className="text-base font-semibold" style={{ color: roommate.color }}>
                    {roommate.initial}
                  </Text>
                </View>
                <Text className="mt-1 text-xs text-white">{roommate.name}</Text>
              </Pressable>
            ))}

            <Pressable accessibilityRole="button" className="mr-4 items-center" onPress={handleSplit}>
              <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: '#8b5cf6' }}>
                <Text className="text-xs font-semibold text-white">All</Text>
              </View>
              <Text className="mt-1 text-xs text-white">Split</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View className="px-6" style={{ paddingBottom: insets.bottom + tabBarClearance }}>
        <Pressable
          accessibilityRole="button"
          className="items-center justify-center rounded-2xl py-4"
          style={{ backgroundColor: '#0F8', opacity: receiptItems.some((item) => !item.assignedTo) ? 0.4 : 1 }}
          onPress={handlePostToHouse}
          disabled={receiptItems.some((item) => !item.assignedTo)}
        >
          <Text className="font-semibold text-black">Post to House</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderWrapper: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: 220,
    height: 260,
    borderWidth: 4,
    borderColor: 'rgba(15, 248, 136, 0.5)',
    borderRadius: 24,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 28,
    height: 28,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: '#0F8',
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: '#0F8',
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 28,
    height: 28,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#0F8',
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#0F8',
    borderBottomRightRadius: 12,
  },
  alignText: {
    color: '#fff',
    marginBottom: 24,
    fontSize: 18,
  },
  captureButton: {
    marginBottom: 32,
  },
  captureInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0F8',
    borderWidth: 4,
    borderColor: 'rgba(15, 248, 136, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingContainer: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingBox: {
    alignItems: 'center',
  },
  processingSpinner: {
    width: 120,
    height: 120,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#333',
    borderTopColor: '#0F8',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    marginBottom: 20,
  },
  processingTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  processingSubtitle: {
    color: '#aaa',
  },
  summaryContainer: {
    flex: 1,
    backgroundColor: '#222',
  },
  summaryHeader: {
    backgroundColor: '#0F8',
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  summarySubtitle: {
    color: '#111',
  },
  summaryBody: {
    padding: 24,
    paddingBottom: 0,
  },
  summaryCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginBottom: 16,
  },
  summaryCardTitle: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#aaa',
  },
  summaryTitleText: {
    color: '#fff',
    fontWeight: '700',
  },
  summaryValue: {
    color: '#fff',
    fontWeight: '600',
  },
  summaryValueAccent: {
    color: '#0F8',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  summaryTextName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  summaryValueSecondary: {
    color: '#aaa',
    fontWeight: '600',
  },
  assignContainer: {
    flex: 1,
    backgroundColor: '#222',
    paddingTop: 32,
  },
  assignHeader: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  assignTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  assignSubtitle: {
    color: '#888',
  },
  assignList: {
    padding: 24,
    paddingBottom: 6,
  },
  assignItem: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#2a2a2a',
    padding: 16,
    marginBottom: 12,
  },
  assignItemActive: {
    borderColor: '#0F8',
    backgroundColor: 'rgba(15, 248, 136, 0.15)',
  },
  assignItemAssigned: {
    borderColor: '#0F8',
    backgroundColor: 'rgba(15, 248, 136, 0.08)',
  },
  assignItemSplit: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  assignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assignName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  assignPrice: {
    color: '#fff',
    fontWeight: '700',
  },
  assignedLabel: {
    marginTop: 6,
    color: '#0F8',
    fontWeight: '600',
  },
  assignmentBar: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  assignmentHint: {
    color: '#aaa',
    marginBottom: 8,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roommateButton: {
    alignItems: 'center',
    marginRight: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  roommateNameSmall: {
    color: '#fff',
    marginTop: 4,
    fontSize: 12,
  },
  splitIcon: {
    backgroundColor: '#8b5cf6',
  },
  splitText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: '#0F8',
    borderRadius: 18,
    margin: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionText: {
    color: '#000',
    fontWeight: '700',
  },
});
