import { Linking, Platform } from 'react-native';

type VenmoAction = 'pay' | 'charge';

interface VenmoDeepLinkOptions {
    action: VenmoAction;
    recipient: string; // Venmo username without @
    amount: number;
    note?: string;
}

/**
 * Generate a Venmo deep link URL for pay or request
 * @param options - The options for the deep link
 * @returns The deep link URL
 */
export function getVenmoDeepLink(options: VenmoDeepLinkOptions): string {
    const { action, recipient, amount, note } = options;

    // Clean the recipient handle (remove @ if present)
    const cleanRecipient = recipient.replace(/^@/, '');

    // Format amount to 2 decimal places
    const formattedAmount = amount.toFixed(2);

    // Encode the note for URL
    const encodedNote = encodeURIComponent(note || 'Sidequest payment');

    // Try native app first, fallback to web
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Native app deep link
        return `venmo://paycharge?txn=${action}&recipients=${cleanRecipient}&amount=${formattedAmount}&note=${encodedNote}`;
    }

    // Web fallback
    return `https://venmo.com/?txn=${action}&recipients=${cleanRecipient}&amount=${formattedAmount}&note=${encodedNote}`;
}

/**
 * Open Venmo to pay a user
 */
export async function openVenmoPay(recipient: string, amount: number, note?: string): Promise<boolean> {
    const url = getVenmoDeepLink({ action: 'pay', recipient, amount, note });

    try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
            return true;
        }

        // Fallback to web if app not installed
        const webUrl = `https://venmo.com/?txn=pay&recipients=${recipient.replace(/^@/, '')}&amount=${amount.toFixed(2)}&note=${encodeURIComponent(note || 'Sidequest payment')}`;
        await Linking.openURL(webUrl);
        return true;
    } catch (error) {
        console.error('Failed to open Venmo:', error);
        return false;
    }
}

/**
 * Open Venmo to request money from a user
 */
export async function openVenmoRequest(recipient: string, amount: number, note?: string): Promise<boolean> {
    const url = getVenmoDeepLink({ action: 'charge', recipient, amount, note });

    try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
            return true;
        }

        // Fallback to web if app not installed
        const webUrl = `https://venmo.com/?txn=charge&recipients=${recipient.replace(/^@/, '')}&amount=${amount.toFixed(2)}&note=${encodeURIComponent(note || 'Sidequest payment')}`;
        await Linking.openURL(webUrl);
        return true;
    } catch (error) {
        console.error('Failed to open Venmo:', error);
        return false;
    }
}

/**
 * Check if Venmo app is installed
 */
export async function isVenmoInstalled(): Promise<boolean> {
    try {
        return await Linking.canOpenURL('venmo://');
    } catch {
        return false;
    }
}
