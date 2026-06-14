import React, { useState } from 'react';
import { triggerHaptic } from '@/utils/haptics';
import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SubscriptionForm } from '@/features/subscriptions/components/SubscriptionForm';
import { DeleteConfirmationModal } from '@/features/subscriptions/components/DeleteConfirmationModal';
import { useSubscriptions, useUpdateSubscription, useDeleteSubscription } from '@/features/subscriptions/hooks/useSubscriptions';
import { AppLoader } from '@/components/common/AppLoader';
import { SubscriptionFormData } from '@/features/subscriptions/schemas/subscription.schema';
import { scheduleRenewalReminder, cancelSubscriptionNotifications } from '@/utils/NotificationService';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

// Removed DESIGN_TOKENS

export default function EditSubscriptionScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const router = useRouter();
  
  const { data: subscriptions, isLoading: isLoadingSubs, isFetching } = useSubscriptions();
  const { mutate: updateSubscription, isPending: isUpdating } = useUpdateSubscription();
  const { mutate: deleteSubscription, isPending: isDeleting } = useDeleteSubscription();
  
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/subscriptions');
    }
  };

  if (isLoadingSubs || (isFetching && !subscriptions)) {
    return <AppLoader />;
  }

  const subscription = subscriptions?.find(s => String(s.id) === String(id));

  if (!subscription) {
    if (isFetching || isDeleting) return <AppLoader />;
    return (
      <View style={dynamicStyles.notFoundContainer}>
        <Text style={dynamicStyles.notFoundText}>Subscription not found</Text>
        <TouchableOpacity onPress={handleGoBack} style={dynamicStyles.goBackButton}>
          <Text style={dynamicStyles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleUpdate = (data: SubscriptionFormData) => {
    triggerHaptic('success');
    updateSubscription({ id, data });
    handleGoBack();
  };

  const handleDelete = () => {
    triggerHaptic('error');
    setIsDeleteModalVisible(false);
    deleteSubscription(id);
    router.replace('/(tabs)/subscriptions');
  };

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={dynamicStyles.keyboardView}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={handleGoBack} style={dynamicStyles.backButton}>
             <Text style={dynamicStyles.backButtonText}>← {t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>{t('subs.update')}</Text>
          <View style={{ width: 60 }} />{/* Spacer */}
        </View>
        
        <SubscriptionForm 
          initialData={subscription}
          onSubmit={handleUpdate} 
          isLoading={isUpdating} 
          submitLabel={t('common.save')}
          onDelete={() => setIsDeleteModalVisible(true)}
        />
        
        <DeleteConfirmationModal
          visible={isDeleteModalVisible}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteModalVisible(false)}
          isLoading={isDeleting}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'Hanken Grotesk',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  notFoundText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  goBackButton: {
    marginTop: 16,
  },
  goBackText: {
    color: colors.primary,
    fontWeight: '600',
  }
});
