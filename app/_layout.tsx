import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import '../global.css';

import { ErrorBoundary } from '@/components/sidequest/error-boundary';
import { OfflineBanner } from '@/components/sidequest/offline-banner';
import { useColorScheme } from '@/hooks/use-color-scheme';

Sentry.init({
  dsn: 'https://f12c21dc33e30baf6fc6221b080a44ed@o4510778241515520.ingest.us.sentry.io/4510778242301952',
  debug: __DEV__,
});

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Request location permissions on startup
    import('@/lib/services/location-service').then(({ locationService }) => {
      locationService.requestPermissions();
    });

    // Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (url && typeof url === 'string') {
        router.push(url as any);
      }
    });

    setIsReady(true);

    return () => subscription.remove();
  }, [router]);

  const onLayoutRootView = useCallback(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <StatusBar style="light" />
          <ErrorBoundary>
            <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <OfflineBanner />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colorScheme === 'dark' ? '#111' : '#f2f2f2' },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="onboarding"
                  options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                  }}
                />
              </Stack>
            </View>
          </ErrorBoundary>
          <Toaster />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
