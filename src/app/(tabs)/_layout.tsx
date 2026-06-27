import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { triggerHaptic } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface }],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
      screenListeners={{
        tabPress: () => {
          triggerHaptic('selection');
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={size} />
          ),
        }}
      />
      
      {/* Route name must be exactly "subscriptions" to match the directory name, not subscriptions/index */}
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: t('tabs.subscriptions'),
          tabBarLabel: t('tabs.subscriptions'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "list" : "list-outline"} color={color} size={size} />
          ),
        }}
      />
      
      {/* Route name must be exactly "calendar" to match the directory name */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          tabBarLabel: t('tabs.calendar'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} color={color} size={size} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="wallet"
        options={{
          title: t('tabs.wallet'),
          tabBarLabel: t('tabs.wallet'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "wallet" : "wallet-outline"} color={color} size={size} />
          ),
        }}
      />
      
      {/* Route name must be exactly "settings" to match the directory name, not settings/index */}
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarLabel: t('tabs.settings'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={size} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="wallet/add"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="wallet/[id]"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="subscriptions/add"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="subscriptions/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    height: 60,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    paddingBottom: 8,
    paddingTop: 8,
  }
});
