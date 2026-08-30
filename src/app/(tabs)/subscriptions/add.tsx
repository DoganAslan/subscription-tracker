import React from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getKeyboardLayout } from '@/components/layout/keyboardLayout';
import { SubscriptionForm } from '@/features/subscriptions/components/SubscriptionForm';
import { useAddSubscription } from '@/features/subscriptions/hooks/useSubscriptions';
import { useRouter } from 'expo-router';
import { SubscriptionFormData } from '@/features/subscriptions/schemas/subscription.schema';
import { requestNotificationPermissions } from '@/services/notificationService';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/context/LanguageContext';

const DEFAULT_HEADER_HEIGHT = 52;

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const { mutateAsync: addSubscription, isPending } = useAddSubscription();
  const { colors } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const { top, bottom } = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = React.useState(DEFAULT_HEADER_HEIGHT);
  const isTurkish = currentLanguage === 'tr';
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'web' ? 'web' : 'android';
  const keyboardLayout = getKeyboardLayout(platform, top, headerHeight);

  const handleGoBack = () => {
    router.replace('/(tabs)/subscriptions');
  };

  React.useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const handleSubmit = async (data: SubscriptionFormData) => {
    try {
      await addSubscription(data);
      handleGoBack();
    } catch {
      // Mutation feedback is owned by useAddSubscription; keep the form open for retry.
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView {...keyboardLayout} style={{ flex: 1 }}>
        
        {/* Navigation Header */}
        <View
          testID="subscription-route-header"
          onLayout={({ nativeEvent }) => setHeaderHeight(nativeEvent.layout.height)}
          style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
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

        <View testID="subscription-form-safe-content" style={{ flex: 1, paddingBottom: bottom }}>
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

