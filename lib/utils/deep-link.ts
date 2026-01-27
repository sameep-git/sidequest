import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

const PENDING_JOIN_CODE_KEY = '@sidequest/pending_join_code';

/**
 * Parse a deep link URL to extract the join code
 * Supports: sidequest://join/123456
 */
export function parseJoinCode(url: string): string | null {
    try {
        const parsed = Linking.parse(url);

        // Handle sidequest://join/123456
        if (parsed.path?.startsWith('join/')) {
            const code = parsed.path.replace('join/', '');
            // Validate it's a 6-digit code
            if (/^\d{6}$/.test(code)) {
                return code;
            }
        }

        // Handle sidequest://join?code=123456
        if (parsed.path === 'join' && parsed.queryParams?.code) {
            const code = String(parsed.queryParams.code);
            if (/^\d{6}$/.test(code)) {
                return code;
            }
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Generate a deep link URL for joining a household
 */
export function getJoinDeepLink(code: string): string {
    return `sidequest://join/${code}`;
}

/**
 * Store a pending join code for later use (after auth)
 */
export async function storePendingJoinCode(code: string): Promise<void> {
    await AsyncStorage.setItem(PENDING_JOIN_CODE_KEY, code);
}

/**
 * Retrieve and clear stored pending join code
 */
export async function getPendingJoinCode(): Promise<string | null> {
    const code = await AsyncStorage.getItem(PENDING_JOIN_CODE_KEY);
    if (code) {
        await AsyncStorage.removeItem(PENDING_JOIN_CODE_KEY);
    }
    return code;
}

/**
 * Check if there's a pending join code without clearing it
 */
export async function hasPendingJoinCode(): Promise<boolean> {
    const code = await AsyncStorage.getItem(PENDING_JOIN_CODE_KEY);
    return code !== null;
}
