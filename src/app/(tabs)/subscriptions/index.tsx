import React from 'react';
import { View, SafeAreaView, TouchableOpacity, Text, useColorScheme } from 'react-native';
import { SubscriptionList } from '@/features/subscriptions/components/SubscriptionList';
import { Header } from '@/components/common/Header';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function SubscriptionListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
        <Header title={t('subs.subscriptions')} />
      </View>

      <SubscriptionList />
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        onPress={() => router.push('/(tabs)/subscriptions/add')}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: 100,
          right: 24,
          width: 64,
          height: 64,
          backgroundColor: colors.primary,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
          zIndex: 50
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: 36, fontWeight: '300', marginBottom: 4 }}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
