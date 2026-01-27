import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import * as Linking from 'expo-linking';
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
import { parseJoinCode, storePendingJoinCode } from '@/lib/utils/deep-link';

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
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (url && typeof url === 'string') {
        router.push(url as any);
      }
    });

    // Handle deep link URLs (for household join codes)
    const handleDeepLink = async (event: { url: string }) => {
      const joinCode = parseJoinCode(event.url);
      if (joinCode) {
        // Store the code - it will be processed after auth/onboarding
        await storePendingJoinCode(joinCode);
        // Navigate to onboarding which will handle the join
        router.replace('/onboarding' as any);
      }
    };

    // Check if app was opened with a URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for URLs while app is running
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    setIsReady(true);

    return () => {
      notificationSubscription.remove();
      linkingSubscription.remove();
    };
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
