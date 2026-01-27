import { useThemeStore } from '@/lib/theme-store';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useEffect } from 'react';

export function useColorScheme() {
    const { themeMode } = useThemeStore();
    const { colorScheme, setColorScheme } = useNativeWindColorScheme();

    useEffect(() => {
        // Sync store preference to NativeWind
        setColorScheme(themeMode);
    }, [themeMode, setColorScheme]);

    // Return the resolved colorScheme immediately based on themeMode
    // When themeMode is 'system', use the NativeWind colorScheme
    // Otherwise use the explicit themeMode
    if (themeMode === 'system') {
        return colorScheme ?? 'light';
    }
    return themeMode;
}
