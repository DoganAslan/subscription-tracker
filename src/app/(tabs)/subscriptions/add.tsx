import React from 'react';
import { triggerHaptic } from '@/utils/haptics';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SubscriptionForm } from '@/features/subscriptions/components/SubscriptionForm';
import { useAddSubscription } from '@/features/subscriptions/hooks/useSubscriptions';
import { useRouter } from 'expo-router';
import { SubscriptionFormData } from '@/features/subscriptions/schemas/subscription.schema';
import { requestNotificationPermissions } from '@/services/notificationService';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/context/LanguageContext';

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const { mutate: addSubscription, isPending } = useAddSubscription();
  const { colors } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

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
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
              {t.subscriptionsPage?.addSubscription || t.subscriptionsPage?.addSub || 'Add Subscription'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
              {isTurkish ? 'Ad, kategori, tutar ve yenileme tarihi yeterli' : 'Name, category, amount and renewal date are enough'}
            </Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        <View style={{ flex: 1 }}>
          <SubscriptionForm 
            onSubmit={handleSubmit} 
            isLoading={isPending} 
            submitLabel={isTurkish ? 'Aboneliği kaydet' : 'Save subscription'} 
            hideHero={false}
          />
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

