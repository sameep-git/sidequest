import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { Linking } from 'react-native';

export async function checkLocationPermission(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  const foreground = await Location.getForegroundPermissionsAsync();
  const background = await Location.getBackgroundPermissionsAsync();
  return {
    foreground: foreground.status === 'granted',
    background: background.status === 'granted'
  };
}

export async function checkCameraPermission(): Promise<boolean> {
  const { status } = await Camera.getCameraPermissionsAsync();
  return status === 'granted';
}

export async function hasRequiredPermissions(): Promise<boolean> {
  const location = await checkLocationPermission();
  const cameraGranted = await checkCameraPermission();
  
  // Require foreground location and camera (background is optional)
  return location.foreground && cameraGranted;
}

export async function openAppSettings() {
  await Linking.openSettings();
}
