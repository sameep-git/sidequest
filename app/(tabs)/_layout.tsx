import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { Home, List, Store, Wallet } from 'lucide-react-native';
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
            title: 'List',
            tabBarIcon: ({ color, size }) => <List color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Store',
            tabBarIcon: ({ color, size }) => <Store color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Balances',
            tabBarIcon: ({ color, size }) => <Wallet color={color} size={size ?? 24} />,
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
        <Label>List</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'list.bullet', selected: 'list.bullet' }} />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="list" />} />,
        })}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="scan">
        <Label>Store</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'storefront', selected: 'storefront.fill' }} />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="store" />} />,
        })}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Balances</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'wallet.pass', selected: 'wallet.pass.fill' }} />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="account-balance-wallet" />} />,
        })}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
