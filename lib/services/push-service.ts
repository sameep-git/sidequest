import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
    to: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    sound?: 'default' | null;
    badge?: number;
    categoryId?: string;
    priority?: 'default' | 'normal' | 'high';
    sticky?: boolean;
}

class PushService {
    /**
     * Register device for push notifications and store token in Supabase
     */
    async registerForPushNotifications(userId: string): Promise<string | null> {
        if (!Device.isDevice) {
            console.log('Push notifications require a physical device');
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return null;
        }

        // Get Expo push token
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: 'd6119db4-4a90-4c47-a598-d6501405d102', // From app.config.js
        });
        const token = tokenData.data;

        // Store in Supabase
        await this.savePushToken(userId, token);

        // Configure for Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#00FF88',
            });
        }

        return token;
    }

    /**
     * Save push token to Supabase
     */
    async savePushToken(userId: string, token: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ push_token: token })
            .eq('id', userId);

        if (error) {
            console.error('Failed to save push token:', error);
        }
    }

    /**
     * Get push tokens for all household members except the sender
     */
    async getHouseholdTokens(householdId: string, excludeUserId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('household_members')
            .select('users!inner(push_token)')
            .eq('household_id', householdId)
            .neq('user_id', excludeUserId);

        if (error || !data) return [];

        return data
            .map((member: any) => member.users?.push_token)
            .filter((token: string | null): token is string => !!token);
    }

    /**
     * Get push token for a specific user
     */
    async getUserToken(userId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('users')
            .select('push_token')
            .eq('id', userId)
            .single();

        if (error || !data) return null;
        return data.push_token;
    }

    /**
     * Send push notification via Expo Push API
     */
    async sendPush(messages: PushMessage[]): Promise<void> {
        if (messages.length === 0) return;

        try {
            await fetch(EXPO_PUSH_ENDPOINT, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages),
            });
        } catch (error) {
            console.error('Failed to send push notification:', error);
        }
    }

    /**
     * Notify household when bounty item is added
     */
    async notifyBountyAdded(
        householdId: string,
        requesterUserId: string,
        requesterName: string,
        itemName: string,
        bountyAmount: number
    ): Promise<void> {
        const tokens = await this.getHouseholdTokens(householdId, requesterUserId);
        if (tokens.length === 0) return;

        const messages: PushMessage[] = tokens.map((token) => ({
            to: token,
            title: '🔥 New Bounty Added!',
            body: `${requesterName} wants ${itemName}. Earn $${bountyAmount.toFixed(2)} if you grab it!`,
            data: { type: 'bounty_added', url: '/(tabs)/shop' },
            sound: 'default',
            priority: 'high',
        }));

        await this.sendPush(messages);
    }

    /**
     * Notify requester when their bounty item is claimed
     */
    async notifyBountyClaimed(
        requesterId: string,
        claimerName: string,
        itemName: string,
        bountyAmount: number
    ): Promise<void> {
        const token = await this.getUserToken(requesterId);
        if (!token) return;

        await this.sendPush([{
            to: token,
            title: '🎉 Your Item Was Claimed!',
            body: `${claimerName} bought ${itemName}. You owe them $${bountyAmount.toFixed(2)}.`,
            data: { type: 'bounty_claimed', url: '/(tabs)/profile' },
            sound: 'default',
            priority: 'high',
        }]);
    }
}

export const pushService = new PushService();
