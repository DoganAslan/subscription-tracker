import React from 'react';
import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, useColorScheme } from 'react-native';
import { SubscriptionForm } from '@/features/subscriptions/components/SubscriptionForm';
import { useAddSubscription } from '@/features/subscriptions/hooks/useSubscriptions';
import { useRouter } from 'expo-router';
import { SubscriptionFormData } from '@/features/subscriptions/schemas/subscription.schema';
import { colors } from '@/theme/colors';

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const { mutateAsync: addSubscription, isPending } = useAddSubscription();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const handleSubmit = async (data: SubscriptionFormData) => {
    await addSubscription(data);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F19' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#1F2937', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>Add Subscription</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Text style={{ color: '#9CA3AF', fontWeight: '500' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
        
        <SubscriptionForm 
          onSubmit={handleSubmit} 
          isLoading={isPending} 
          submitLabel="Save Subscription" 
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
