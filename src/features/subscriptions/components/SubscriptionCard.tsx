import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Subscription } from '@/services/firebase/types';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';

interface Props {
  subscription: Subscription;
}

export function SubscriptionCard({ subscription }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handlePress = () => {
    router.push(`/(tabs)/subscriptions/${subscription.id}`);
  };

  const nextBilling = subscription.renewalDate.toDate().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Subscription: ${subscription.name}, ${subscription.amount} ${subscription.currency} per ${subscription.billingCycle}`}
      style={{
        backgroundColor: '#1F2937',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#374151',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        opacity: subscription.status === 'paused' ? 0.5 : 1
      }}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#F9FAFB', marginRight: 8 }}>
            {subscription.name}
          </Text>
          {subscription.status === 'paused' && (
            <View style={{ backgroundColor: '#374151', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#D1D5DB', textTransform: 'uppercase', letterSpacing: 0.5 }}>Paused</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 14, color: '#D1D5DB', textTransform: 'capitalize', fontWeight: '500' }}>
          {subscription.category} • {subscription.billingCycle}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          {subscription.isFreeTrial && (
            <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#3B82F6' }}>TRIAL</Text>
            </View>
          )}
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#F9FAFB' }}>
            {subscription.currency} {subscription.amount.toFixed(2)}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
          Renews {nextBilling}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
