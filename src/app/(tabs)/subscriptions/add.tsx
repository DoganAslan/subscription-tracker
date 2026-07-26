import React from 'react';
import { triggerHaptic } from '@/utils/haptics';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SubscriptionForm } from '@/features/subscriptions/components/SubscriptionForm';
import { useAddSubscription } from '@/features/subscriptions/hooks/useSubscriptions';
import { useRouter } from 'expo-router';
import { SubscriptionFormData } from '@/features/subscriptions/schemas/subscription.schema';
import { requestNotificationPermissions, scheduleRenewalReminder } from '@/utils/NotificationService';
import { useTheme } from '@/context/ThemeContext';
import { HeroInput } from '@/components/HeroInput';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/context/LanguageContext';

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const { mutate: addSubscription, isPending } = useAddSubscription();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const handleGoBack = () => {
    router.replace('/(tabs)/subscriptions');
  };

  React.useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const handleSubmit = (data: SubscriptionFormData) => {
    triggerHaptic('success');
    addSubscription(data);
    handleGoBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* Navigation Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleGoBack} style={{ padding: 4 }}>
             <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{t.subscriptionsPage?.addSubscription || t.subscriptionsPage?.addSub || 'Add Subscription'}</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={{ flex: 1 }}>
          <SubscriptionForm 
            onSubmit={handleSubmit} 
            isLoading={isPending} 
            submitLabel={t.global?.saveChanges || 'Save'} 
            hideHero={false}
          />
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}



