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
    const nativeUrl = getVenmoDeepLink({ action: 'pay', recipient, amount, note });
    const cleanRecipient = recipient.replace(/^@/, '');
    // Web fallback using account.venmo.com format
    // recipient needs to be prefixed with comma (%2C)
    const webUrl = `https://account.venmo.com/pay?audience=private&amount=${amount.toFixed(2)}&note=${encodeURIComponent(note || 'Sidequest payment')}&recipients=%2C${cleanRecipient}&txn=pay`;

    try {
        // Try opening native app directly - don't rely on canOpenURL which requires LSApplicationQueriesSchemes
        await Linking.openURL(nativeUrl);
        return true;
    } catch {
        // Native app failed, try web fallback
        try {
            await Linking.openURL(webUrl);
            return true;
        } catch (error) {
            console.error('Failed to open Venmo:', error);
            return false;
        }
    }
}

/**
 * Open Venmo to request money from a user
 */
export async function openVenmoRequest(recipient: string, amount: number, note?: string): Promise<boolean> {
    const nativeUrl = getVenmoDeepLink({ action: 'charge', recipient, amount, note });
    const cleanRecipient = recipient.replace(/^@/, '');
    // Web fallback using account.venmo.com format
    // recipient needs to be prefixed with comma (%2C)
    const webUrl = `https://account.venmo.com/pay?audience=private&amount=${amount.toFixed(2)}&note=${encodeURIComponent(note || 'Sidequest payment')}&recipients=%2C${cleanRecipient}&txn=charge`;

    try {
        // Try opening native app directly - don't rely on canOpenURL which requires LSApplicationQueriesSchemes
        await Linking.openURL(nativeUrl);
        return true;
    } catch {
        // Native app failed, try web fallback
        try {
            await Linking.openURL(webUrl);
            return true;
        } catch (error) {
            console.error('Failed to open Venmo:', error);
            return false;
        }
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
