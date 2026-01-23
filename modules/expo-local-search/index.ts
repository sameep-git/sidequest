import { requireNativeModule } from 'expo-modules-core';

const ExpoLocalSearch = requireNativeModule('ExpoLocalSearch');

export type SearchResult = {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
};

export async function search(
    query: string,
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000
): Promise<SearchResult[]> {
    return await ExpoLocalSearch.search(query, latitude, longitude, radiusMeters);
}
