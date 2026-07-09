import React, { useState } from 'react';
import { triggerHaptic } from '@/utils/haptics';
import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SubscriptionForm } from '@/features/subscriptions/components/SubscriptionForm';
import { LifetimeCostSimulator } from '@/features/subscriptions/components/LifetimeCostSimulator';
import { PauseSubscriptionCard } from '@/features/subscriptions/components/PauseSubscriptionCard';
import { DeleteConfirmationModal } from '@/features/subscriptions/components/DeleteConfirmationModal';
import { useSubscriptions, useUpdateSubscription, useDeleteSubscription, useTogglePauseSubscription } from '@/features/subscriptions/hooks/useSubscriptions';
import { AppLoader } from '@/components/common/AppLoader';
import { SubscriptionFormData } from '@/features/subscriptions/schemas/subscription.schema';
import { scheduleRenewalReminder, cancelSubscriptionNotifications } from '@/utils/NotificationService';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { useSavingsStore } from '@/store/useSavingsStore';
import { calculateMonthlyCosts } from '@/utils/calculations';

// Removed DESIGN_TOKENS

export default function EditSubscriptionScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const router = useRouter();
  
  const { data: subscriptions, isLoading: isLoadingSubs, isFetching } = useSubscriptions();
  const { mutate: updateSubscription, isPending: isUpdating } = useUpdateSubscription();
  const { mutate: togglePauseSubscription } = useTogglePauseSubscription();
  const { mutate: deleteSubscription, isPending: isDeleting } = useDeleteSubscription();
  
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  
  const { colors } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isEnglish = currentLanguage === 'en';
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/subscriptions');
    }
  };

  const handleRemindParticipant = async (participantName: string, amount: number, currency: string, subscriptionName: string) => {
    triggerHaptic('selection');
    const baseMsg = t.features?.whatsappReminderMsg || `Selam {{name}}! 👋 Bu ayki "{{subName}}" ortaklığımız için {{amount}} {{currency}} ödeme payın bulunuyor. Müsait olduğunda gönderebilirsen süper olur, teşekkürler! 🚀`;
    const message = baseMsg
      .replace('{{name}}', participantName)
      .replace('{{subName}}', subscriptionName)
      .replace('{{amount}}', amount.toString())
      .replace('{{currency}}', currency);

    try {
      const result = await Share.share({
        message: message,
        title: `${subscriptionName} Ödeme Hatırlatması`, 
      });

      if (result?.action === Share.sharedAction) {
        console.log('Reminder shared successfully');
      } else if (result?.action === Share.dismissedAction) {
        console.log('Share sheet dismissed');
      }
    } catch (error: any) {
      console.log("Web platform share fallback triggered.");
      if (Platform.OS === 'web') {
        window.alert("Kopyalanacak Mesaj:\n\n" + message);
      } else {
        Alert.alert(t.global.paylamHatas, t.global.mesajOluturulurkenBi);
      }
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

  const addSavings = useSavingsStore(state => state.addSavings);

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
        contractEndDate: subscription.contractEndDate ? subscription.contractEndDate.toDate() : undefined,
        usageScore: (subscription.usageScore || 0) + 1,
        lastUsedDate: new Date().toISOString()
      } as any 
    });
  };

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={dynamicStyles.keyboardView}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={handleGoBack} style={dynamicStyles.backButton}>
             <Text style={dynamicStyles.backButtonText}>{t.form.cancel}</Text>
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>{t.form.updateHeader}</Text>
          <View style={{ width: 60 }} />{/* Spacer */}
        </View>
        
        
        {subscription.isSplit && subscription.splitParticipants && subscription.splitParticipants.length > 0 && (
          <View style={dynamicStyles.splitOverviewCard}>
            <Text style={dynamicStyles.splitOverviewTitle}>{t.features?.sharedPaymentOverview || (isEnglish ? '💰 Shared Payment Overview' : '💰 Ortak Ödeme Özeti')}</Text>
            {subscription.splitParticipants.map((p, index) => (
              <View key={p.id || `participant-${index}`} style={dynamicStyles.splitParticipantRow}>
                <View>
                  <Text style={dynamicStyles.splitParticipantName}>{p.name || t.features?.unnamed || (isEnglish ? 'Unnamed' : 'İsimsiz')}</Text>
                  <Text style={dynamicStyles.splitParticipantAmount}>
                    {parseFloat(String(p.amount)).toFixed(0)} {subscription.currency || 'TRY'} (%{subscription.amount > 0 ? Math.round((parseFloat(String(p.amount)) / subscription.amount) * 100) : 0})
                  </Text>
                </View>
                <TouchableOpacity 
                  style={{ backgroundColor: '#1E3A8A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
                  onPress={() => handleRemindParticipant(
                    p.name || t.features?.unnamed || (isEnglish ? 'Unnamed' : 'İsimsiz'), 
                    p.amount, 
                    subscription.currency || 'TRY', 
                    subscription.name
                  )}
                >
                  <Text style={{ color: '#60A5FA', fontSize: 13, fontWeight: '600' }}>{t.features?.remind || (isEnglish ? 'Remind' : 'Hatırlat')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        
        <SubscriptionForm 
          initialData={subscription}
          onSubmit={handleUpdate} 
          isLoading={isUpdating} 
          submitLabel={t.form.updateHeader}
          onDelete={() => setIsDeleteModalVisible(true)}
        >
          <PauseSubscriptionCard 
            subscription={subscription} 
            onUpdate={(data) => togglePauseSubscription({ id, data })} 
          />
          <LifetimeCostSimulator subscription={subscription} />
        </SubscriptionForm>

        <View style={dynamicStyles.usageCard}>
          <View>
            <Text style={dynamicStyles.usageTitle}>{(t.features as any)?.trackUsage || 'Track Usage'}</Text>
            <Text style={dynamicStyles.usageSubtitle}>
              {((t.features as any)?.usedXTimes || 'Used {{count}} times.').replace('{{count}}', (subscription.usageScore || 0).toString())}
              {subscription.lastUsedDate ? ` ${((t.features as any)?.lastUsed || 'Last: {{date}}').replace('{{date}}', new Date(subscription.lastUsedDate).toLocaleDateString())}` : ''}
            </Text>
          </View>
          <TouchableOpacity 
            style={dynamicStyles.usageButton}
            onPress={handleTrackUsage}
          >
            <Text style={dynamicStyles.usageButtonText}>{(t.features as any)?.iUsedThisToday || 'I used this today'}</Text>
          </TouchableOpacity>
        </View>
        
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
,
  splitOverviewCard: {
    backgroundColor: colors.surfaceHover,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  splitOverviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  splitParticipantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  splitParticipantName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  splitParticipantAmount: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  usageCard: {
    backgroundColor: colors.surfaceHover,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 40,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  usageSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  usageButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  usageButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  }
});
