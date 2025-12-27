import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { Camera, Home, ShoppingCart, User } from 'lucide-react-native';
import React from 'react';
import { DynamicColorIOS, Platform } from 'react-native';

export default function TabLayout() {
  const iosMajorVersion = Platform.OS === 'ios' ? Number.parseInt(String(Platform.Version), 10) : null;
  const useNativeTabs = Platform.OS !== 'ios' || (iosMajorVersion != null && iosMajorVersion >= 26);

  if (!useNativeTabs) {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#0F8',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: {
            backgroundColor: '#111',
            borderTopColor: '#333',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: 'Shop',
            tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan',
            tabBarIcon: ({ color, size }) => <Camera color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size ?? 24} />,
          }}
        />
      </Tabs>
    );
  }

  return (
    <NativeTabs
      labelStyle={{
        color: DynamicColorIOS({
          dark: 'white',
          light: 'black',
        }),
      }}
      tintColor={
        DynamicColorIOS({
          dark: '#0F8',
          light: 'black',
        })
      }
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'house', selected: 'house.fill' }} />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="home" />} />,
        })}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="shop">
        <Label>Shop</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'cart', selected: 'cart.fill' }} />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="shopping-cart" />} />,
        })}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="scan">
        <Label>Scan</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'camera', selected: 'camera.fill' }} />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="document-scanner" />} />,
        })}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'person', selected: 'person.fill' }} />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="person" />} />,
        })}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
