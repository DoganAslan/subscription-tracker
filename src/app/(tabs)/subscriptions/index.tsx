import React from 'react';
import { View, SafeAreaView, TouchableOpacity, Text, useColorScheme } from 'react-native';
import { SubscriptionList } from '@/features/subscriptions/components/SubscriptionList';
import { Header } from '@/components/common/Header';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';

export default function SubscriptionListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F19' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
        <Header title="Subscriptions" />
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
          backgroundColor: theme.primary,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: theme.primary,
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
