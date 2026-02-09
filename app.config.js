export default {
  expo: {
    name: 'sidequest',
    slug: 'sidequest',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/android-chrome-512x512.png',
    scheme: 'sidequest',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.sameepshah.sidequest',
      buildNumber: '8',
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'sidequest needs your location to notify you when you\'re near stores with active bounties.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'sidequest needs your location always to send you notifications about nearby stores, even when the app is in the background.',
        NSLocationAlwaysUsageDescription: 'sidequest needs your location always to send you notifications about nearby stores, even when the app is in the background.',
        NSCameraUsageDescription: 'sidequest needs camera access to scan receipts and automatically split items.',
        UIBackgroundModes: ['location'],
        ITSAppUsesNonExemptEncryption: false,
        LSApplicationQueriesSchemes: ['venmo', 'maps', 'googlenavigation'],
      },
    },
    android: {
      package: 'com.sameepshah.sidequest',
      adaptiveIcon: {
        backgroundColor: '#111111',
        foregroundImage: './assets/images/android-chrome-512x512.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon-32x32.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'sidequest needs your location always to send you notifications about nearby stores, even when the app is in the background.',
          locationAlwaysPermission: 'sidequest needs your location always to send you notifications about nearby stores, even when the app is in the background.',
          locationWhenInUsePermission: 'sidequest needs your location to notify you when you\'re near stores with active bounties.',
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: 'sidequest needs camera access to scan receipts and automatically split items.',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/android-chrome-512x512.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#111111',
          dark: {
            backgroundColor: '#111111',
          },
        },
      ],
      [
        '@sentry/react-native/expo',
        {
          url: 'https://sentry.io/',
          project: 'react-native',
          organization: 'sidequest-cw',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: 'd6119db4-4a90-4c47-a598-d6501405d102',
      },
    },
  },
};

