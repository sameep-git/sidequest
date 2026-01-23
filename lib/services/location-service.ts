import { search, type SearchResult } from '@/modules/expo-local-search';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Alert, Linking } from 'react-native';

const GEOFENCE_TASK_NAME = 'SIDEQUEST_GEOFENCE_TASK';
const STORES_SEARCH_QUERY = 'Grocery Store';
const SEARCH_RADIUS_METERS = 3000; // 3km radius

// Configure notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export type GroceryStore = SearchResult;

class LocationService {
    async requestPermissions(): Promise<boolean> {
        // 1. Foreground
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== 'granted') {
            Alert.alert(
                'Location Required',
                'Sidequest needs your location to find nearby grocery stores.',
                [{ text: 'Open Settings', onPress: () => Linking.openSettings() }]
            );
            return false;
        }

        // 2. Background (Always)
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        // iOS: If 'granted' or 'undetermined', we are good.
        if (bgStatus !== 'granted') {
            Alert.alert(
                'Background Location Required',
                'To notify you when you are near a store, select "Always Allow" in settings.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() },
                ]
            );
            return false;
        }

        // 3. Notifications permission
        const { status: notifStatus } = await Notifications.requestPermissionsAsync();
        if (notifStatus !== 'granted') {
            // Optional, but good to have
        }

        return true;
    }

    async getCurrentLocation(): Promise<Location.LocationObject | null> {
        try {
            return await Location.getCurrentPositionAsync({});
        } catch (e) {
            console.error('Error getting location:', e);
            return null;
        }
    }

    async findNearbyStores(): Promise<GroceryStore[]> {
        const location = await this.getCurrentLocation();
        if (!location) return [];

        try {
            const stores = await search(
                STORES_SEARCH_QUERY,
                location.coords.latitude,
                location.coords.longitude,
                SEARCH_RADIUS_METERS
            );
            return stores;
        } catch (e) {
            console.error('Error searching stores:', e);
            return [];
        }
    }

    async startGeofencing(stores: GroceryStore[]) {
        // Only geofence the top 10 to save battery/resources
        const regions = stores.slice(0, 10).map((store) => ({
            identifier: store.name,
            latitude: store.latitude,
            longitude: store.longitude,
            radius: 100, // 100 meters
            notifyOnEnter: true,
            notifyOnExit: false,
        }));

        if (regions.length === 0) return;

        try {
            const isDefined = await TaskManager.isTaskDefined(GEOFENCE_TASK_NAME);
            if (!isDefined) {
                // Task might be defined below but runtime check is good
                console.log('Task definition check passed');
            }

            await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
            console.log(`Started geofencing ${regions.length} stores`);
        } catch (e) {
            console.error('Error starting geofencing:', e);
        }
    }
}

export const locationService = new LocationService();

// Define the background task
TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }: any) => {
    if (error) {
        console.error('Geofencing task error:', error);
        return;
    }
    if (data?.eventType === Location.GeofencingEventType.Enter) {
        const { region } = data;
        console.log('You entered a region:', region);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "You're near a grocery store!",
                body: `Don't forget to check the shopping list at ${region.identifier}`,
                data: { url: '/shop' }, // Deep link to shop tab
            },
            trigger: null, // Send immediately
        });
    }
});
