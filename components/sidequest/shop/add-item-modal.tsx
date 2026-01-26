import { Button } from '@/components/ui/button';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
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
    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [hasBounty, setHasBounty] = useState(false);
    const [bountyAmount, setBountyAmount] = useState('');

    const handleAdd = async () => {
        if (!name.trim()) return;

        const bounty = hasBounty && bountyAmount ? parseFloat(bountyAmount) : null;
        await onAdd(name.trim(), category, bounty);

        // Reset form
        setName('');
        setCategory(null);
        setHasBounty(false);
        setBountyAmount('');
    };

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, justifyContent: 'flex-end' }}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <View style={[styles.modalContent, { paddingBottom: Math.max(24, insets.bottom + 8) }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Item</Text>
                        <Pressable onPress={onClose} className="p-2 -mr-2">
                            <X size={24} color="#aaa" />
                        </Pressable>
                    </View>

                    <Text style={styles.label}>Item Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Organic Milk"
                        placeholderTextColor="#666"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />

                    <Text style={styles.label}>Category</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryContainer}
                    >
                        {CATEGORIES.map((cat) => (
                            <Pressable
                                key={cat}
                                onPress={() => setCategory(cat === category ? null : cat)}
                                style={[
                                    styles.categoryChip,
                                    category === cat && styles.categoryChipSelected
                                ]}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    category === cat && styles.categoryTextSelected
                                ]}>
                                    {cat}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    <View style={styles.switchRow}>
                        <View>
                            <Text style={styles.label}>Add Bounty</Text>
                            <Text style={styles.subLabel}>Incentivize this item</Text>
                        </View>
                        <Switch
                            value={hasBounty}
                            onValueChange={setHasBounty}
                            trackColor={{ false: '#333', true: '#0F8' }}
                            thumbColor="#fff"
                        />
                    </View>

                    {hasBounty && (
                        <TextInput
                            style={[styles.input, { marginTop: 12 }]}
                            placeholder="Amount (e.g. 5.00)"
                            placeholderTextColor="#666"
                            keyboardType="decimal-pad"
                            value={bountyAmount}
                            onChangeText={setBountyAmount}
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

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#1f1f1f',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderColor: '#333',
        borderWidth: 1,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
        marginBottom: 8,
    },
    subLabel: {
        fontSize: 13,
        color: '#888',
    },
    input: {
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 16,
        padding: 16,
        color: 'white',
        fontSize: 16,
        marginBottom: 20,
    },
    categoryContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#2a2a2a',
        borderWidth: 1,
        borderColor: '#333',
    },
    categoryChipSelected: {
        backgroundColor: '#2a2a2a',
        borderColor: '#888',
    },
    categoryText: {
        color: '#aaa',
        fontWeight: '500',
    },
    categoryTextSelected: {
        color: 'white',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
});
