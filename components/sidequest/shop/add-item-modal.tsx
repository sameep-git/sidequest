import { Button } from '@/components/ui/button';
import { X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRef, useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AddItemModalProps = {
    visible: boolean;
    onClose: () => void;
    onAdd: (name: string, category: string | null, bounty: number | null) => Promise<void>;
    isLoading?: boolean;
};

const CATEGORIES = [
    'Produce',
    'Dairy',
    'Meat',
    'Bakery',
    'Snacks',
    'Beverages',
    'Other',
];

export function AddItemModal({ visible, onClose, onAdd, isLoading }: AddItemModalProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [hasBounty, setHasBounty] = useState(false);
    const [bountyAmount, setBountyAmount] = useState('');
    const nameInputRef = useRef<TextInput>(null);

    // Bottom padding - modal overlays screen so no tab bar clearance needed
    const bottomPadding = Math.max(24, insets.bottom + 8);

    // Handle bounty toggle without dismissing keyboard
    const handleBountyToggle = (value: boolean) => {
        setHasBounty(value);
        // Keep keyboard open if it was already open
        if (Keyboard.isVisible?.() || Platform.OS === 'ios') {
            // Small delay to let the switch animation complete, then refocus
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 50);
        }
    };

    // Handle category selection without dismissing keyboard
    const handleCategorySelect = (cat: string) => {
        setCategory(cat === category ? null : cat);
        // Keep keyboard open
        if (Keyboard.isVisible?.() || Platform.OS === 'ios') {
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 50);
        }
    };

    // Validate bounty input: only allow numbers and up to 2 decimal places
    const handleBountyChange = (text: string) => {
        // Allow empty string to clear
        if (text === '') {
            setBountyAmount('');
            return;
        }

        // Regex for positive decimal with up to 2 places
        // Allows: "1", "1.", "1.2", "1.23", ".5", ".56"
        if (/^\d*\.?\d{0,2}$/.test(text)) {
            setBountyAmount(text);
        }
    };

    const handleAdd = async () => {
        if (!name.trim()) return;

        let bounty: number | null = null;
        if (hasBounty && bountyAmount) {
            const parsed = parseFloat(bountyAmount);
            if (!isNaN(parsed) && parsed > 0) {
                bounty = parsed;
            }
        }
        await onAdd(name.trim(), category, bounty);

        // Reset form
        setName('');
        setCategory(null);
        setHasBounty(false);
        setBountyAmount('');
    };

    if (!visible) return null;

    return (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, justifyContent: 'flex-end' }}
            >
                <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />

                <View
                    style={{
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        borderWidth: 1,
                        borderColor: isDark ? '#333' : '#e5e7eb',
                        backgroundColor: isDark ? '#1f1f1f' : '#fff',
                        padding: 24,
                        paddingBottom: bottomPadding,
                    }}
                >
                    <View style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 20, fontWeight: '600', color: isDark ? '#fff' : '#000' }}>Add Item</Text>
                        <Pressable onPress={onClose} style={{ marginRight: -8, padding: 8 }}>
                            <X size={24} color={isDark ? '#aaa' : '#9ca3af'} />
                        </Pressable>
                    </View>

                    <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600', color: isDark ? '#fff' : '#000' }}>Item Name</Text>
                    <TextInput
                        ref={nameInputRef}
                        style={{
                            marginBottom: 20,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: isDark ? '#333' : '#e5e7eb',
                            backgroundColor: isDark ? '#111' : '#f9fafb',
                            padding: 16,
                            fontSize: 16,
                            color: isDark ? '#fff' : '#000',
                            textAlignVertical: 'center',
                        }}
                        placeholder="e.g., Organic Milk"
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />

                    <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600', color: isDark ? '#fff' : '#000' }}>Category</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, marginBottom: 20 }}
                    >
                        {CATEGORIES.map((cat) => (
                            <Pressable
                                key={cat}
                                onPress={() => handleCategorySelect(cat)}
                                style={{
                                    borderRadius: 9999,
                                    borderWidth: 1,
                                    borderColor: category === cat
                                        ? (isDark ? '#6b7280' : '#9ca3af')
                                        : (isDark ? '#333' : '#e5e7eb'),
                                    backgroundColor: category === cat
                                        ? (isDark ? '#2a2a2a' : '#e5e7eb')
                                        : (isDark ? '#2a2a2a' : '#f9fafb'),
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        fontWeight: '500',
                                        color: category === cat
                                            ? (isDark ? '#fff' : '#000')
                                            : (isDark ? '#aaa' : '#6b7280'),
                                    }}
                                >
                                    {cat}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#fff' : '#000' }}>Add Bounty</Text>
                            <Text style={{ fontSize: 12, color: isDark ? '#888' : '#6b7280' }}>Incentivize this item</Text>
                        </View>
                        <Switch
                            value={hasBounty}
                            onValueChange={handleBountyToggle}
                            trackColor={{ false: '#e5e7eb', true: '#059669' }}
                            thumbColor="#fff"
                            ios_backgroundColor="#e5e7eb"
                        />
                    </View>

                    {hasBounty && (
                        <TextInput
                            style={{
                                marginTop: 12,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: isDark ? '#333' : '#e5e7eb',
                                backgroundColor: isDark ? '#111' : '#f9fafb',
                                padding: 16,
                                fontSize: 16,
                                color: isDark ? '#fff' : '#000',
                                textAlignVertical: 'center',
                            }}
                            placeholder="Amount (e.g. 5.00)"
                            placeholderTextColor="#999"
                            keyboardType="decimal-pad"
                            value={bountyAmount}
                            onChangeText={handleBountyChange}
                        />
                    )}

                    <Button
                        label="Add to List"
                        onPress={handleAdd}
                        disabled={!name.trim() || isLoading}
                        size="lg"
                        className="mt-6 w-full"
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
