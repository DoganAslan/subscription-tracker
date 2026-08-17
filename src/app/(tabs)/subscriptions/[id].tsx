import React, { useState } from 'react';
import { triggerHaptic } from '@/utils/haptics';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SubscriptionForm } from '@/features/subscriptions/components/SubscriptionForm';
import { LifetimeCostSimulator } from '@/features/subscriptions/components/LifetimeCostSimulator';
import { PauseSubscriptionCard } from '@/features/subscriptions/components/PauseSubscriptionCard';
import { UsageTrackerCard } from '@/features/subscriptions/components/UsageTrackerCard';
import { PaymentHistoryWidget } from '@/features/subscriptions/components/PaymentHistoryWidget';
import { SplitTrackerCard } from '@/features/subscriptions/components/SplitTrackerCard';
import { DeleteConfirmationModal } from '@/features/subscriptions/components/DeleteConfirmationModal';
import { useSubscriptions, useUpdateSubscription, useDeleteSubscription, useTogglePauseSubscription } from '@/features/subscriptions/hooks/useSubscriptions';
import { AppLoader } from '@/components/common/AppLoader';
import { SubscriptionFormData } from '@/features/subscriptions/schemas/subscription.schema';
import { AiNegotiatorModal } from '@/features/ai/components/AiNegotiatorModal';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { useSavingsStore } from '@/store/useSavingsStore';
import { calculateMonthlyCosts } from '@/utils/calculations';
import { Ionicons } from '@expo/vector-icons';

export default function EditSubscriptionScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const router = useRouter();

  const { data: subscriptions, isLoading: isLoadingSubs, isFetching } = useSubscriptions();
  const { mutate: updateSubscription, isPending: isUpdating } = useUpdateSubscription();
  const { mutate: togglePauseSubscription } = useTogglePauseSubscription();
  const { mutate: deleteSubscription, isPending: isDeleting } = useDeleteSubscription();
  const addSavings = useSavingsStore(state => state.addSavings);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isNegotiatorModalVisible, setIsNegotiatorModalVisible] = useState(false);

  const { colors } = useTheme();
  const { t } = useTranslation();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  const handleGoBack = () => {
    router.replace('/(tabs)/subscriptions');
  };

  if (isLoadingSubs || (isFetching && !subscriptions)) {
    return <AppLoader />;
  }

  const subscription = subscriptions?.find(s => String(s.id) === String(id));

  if (!subscription) {
    if (isFetching || isDeleting) return <AppLoader />;
    return (
      <View style={dynamicStyles.notFoundContainer}>
        <Text style={dynamicStyles.notFoundText}>{t.global.subscriptionNotFound}</Text>
        <TouchableOpacity onPress={handleGoBack} style={dynamicStyles.goBackButton}>
          <Text style={dynamicStyles.goBackText}>{t.global.goBack}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleUpdate = (data: SubscriptionFormData) => {
    triggerHaptic('success');
    updateSubscription({ id, data });
    handleGoBack();
  };

  const handleDelete = (didSaveMoney?: boolean) => {
    triggerHaptic('error');
    setIsDeleteModalVisible(false);

    if (didSaveMoney && subscription) {
      const costs = calculateMonthlyCosts(subscription, subscription.currency);
      addSavings(costs.net, subscription.currency || 'USD');
    }

    deleteSubscription(id);
    router.replace('/(tabs)/subscriptions');
  };

  const handleTrackUsage = () => {
    triggerHaptic('success');
    updateSubscription({
      id,
      data: {
        ...subscription,
        renewalDate: subscription.renewalDate.toDate(),
        trialEndDate: subscription.trialEndDate ? subscription.trialEndDate.toDate() : undefined,
        contractEndDate: subscription.contractEndDate ? new Date(subscription.contractEndDate) : undefined,
        usageScore: (subscription.usageScore || 0) + 1,
        lastUsedDate: new Date().toISOString()
      } as any
    });
  };

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={dynamicStyles.keyboardView}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={handleGoBack} style={dynamicStyles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={dynamicStyles.backButtonText}>{t.common.cancel}</Text>
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>{(t.form as any)?.updateHeader || 'Update'}</Text>
          <View style={{ width: 70 }} />
        </View>

        <SubscriptionForm
          initialData={subscription}
          onSubmit={handleUpdate}
          isLoading={isUpdating}
          submitLabel={(t.form as any)?.updateHeader || 'Update'}
          onDelete={() => setIsDeleteModalVisible(true)}
        >
          <SplitTrackerCard subscription={subscription} />
          <PauseSubscriptionCard
            subscription={subscription}
            onUpdate={(data) => togglePauseSubscription({ id, data })}
          />
          <LifetimeCostSimulator subscription={subscription} />
          <UsageTrackerCard
            subscription={subscription}
            onTrackUsage={handleTrackUsage}
          />
          <PaymentHistoryWidget
            subId={id as string}
            subName={subscription.name}
            defaultAmount={subscription.amount}
            currency={subscription.currency}
          />
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(139, 92, 246, 0.12)',
              borderColor: 'rgba(139, 92, 246, 0.25)',
              borderWidth: 1,
              borderRadius: 16,
              paddingVertical: 14,
              marginTop: 10,
              marginBottom: 10,
              gap: 8,
            }}
            onPress={() => {
              triggerHaptic('impactLight');
              setIsNegotiatorModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={18} color="#8B5CF6" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#8B5CF6' }}>
              ✨ SubMate AI ile değerlendir
            </Text>
          </TouchableOpacity>
        </SubscriptionForm>

        <AiNegotiatorModal
          visible={isNegotiatorModalVisible}
          onClose={() => setIsNegotiatorModalVisible(false)}
          subscription={subscription}
        />

        <DeleteConfirmationModal
          visible={isDeleteModalVisible}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteModalVisible(false)}
          isLoading={isDeleting}
          subscriptionName={subscription?.name}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    marginLeft: -4,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
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
  },
});
