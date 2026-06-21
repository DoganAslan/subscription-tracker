import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, Animated, Alert } from 'react-native';
import { triggerHaptic } from '@/utils/haptics';
import { Subscription } from '@/services/firebase/types';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { useDeleteSubscription } from '@/features/subscriptions/hooks/useSubscriptions';
import { useTheme } from '@/context/ThemeContext';
import { getMonthlyCost } from '@/features/dashboard/utils/calculations';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { currencyService } from '@/services/currencyService';
import { useTranslation } from 'react-i18next';
import { useCards } from '@/features/cards/hooks/useCards';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  subscription: Subscription;
}


export const SubscriptionCard = React.memo(function SubscriptionCard({ subscription }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const { mutate: deleteSubscription } = useDeleteSubscription();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { data: cards } = useCards();

  const linkedCard = cards?.find(c => c.id === subscription.cardId);

  const handlePress = () => {
    router.push(`/(tabs)/subscriptions/${subscription.id}`);
  };

  const nextBilling = subscription.renewalDate.toDate().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const renewalDay = subscription.renewalDate.toDate().getDate();

  const getActiveMonths = (createdAt: any) => {
    if (!createdAt) return 0;
    const start = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return Math.max(0, months);
  };

  const activeMonths = getActiveMonths(subscription.createdAt);
  const monthlyCost = getMonthlyCost(subscription.amount, subscription.billingCycle);
  const totalSpend = monthlyCost * (activeMonths === 0 ? 1 : activeMonths);
  
  const convertedAmount = currencyService.convert(subscription.amount, subscription.currency || 'USD', baseCurrency);
  const showConversion = (subscription.currency || 'USD') !== baseCurrency;

  const handleDelete = () => {
    triggerHaptic('error');
    Alert.alert(
      t('common.delete'),
      `Are you sure you want to delete ${subscription.name}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: () => {
            if (subscription.id) deleteSubscription(subscription.id);
          }
        }
      ]
    );
  };

  const renderRightActions = (progress: any, dragX: any) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity 
        onPress={handleDelete}
        style={{ 
          backgroundColor: '#EF4444', 
          justifyContent: 'center', 
          alignItems: 'flex-end', 
          paddingRight: 24,
          borderRadius: 20, 
          marginBottom: 16,
          flex: 1,
        }}
      >
        <Animated.Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, transform: [{ scale }] }}>
          {t('common.delete')}
        </Animated.Text>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} containerStyle={{ marginBottom: 16 }}>
      <TouchableOpacity 
        onPress={handlePress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Subscription: ${subscription.name}, ${subscription.amount} ${subscription.currency} per ${subscription.billingCycle}`}
      style={{
        backgroundColor: colors.surface,
        padding: 20,
        borderRadius: 20,
        flexDirection: 'column',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        opacity: subscription.status === 'paused' ? 0.6 : 1
      }}
    >
      {/* Top Row: Main Info */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, marginRight: 16, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>
              {renewalDay}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginRight: 8, letterSpacing: 0.3 }} numberOfLines={1}>
                {subscription.name}
              </Text>
              {subscription.status === 'paused' && (
                <View style={{ backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('subs.paused')}</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textTransform: 'capitalize', fontWeight: '500' }} numberOfLines={1}>
              {subscription.category} • {subscription.billingCycle}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            {subscription.isFreeTrial && (
              <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, marginRight: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#60A5FA', letterSpacing: 0.5 }}>{t('subs.trial')}</Text>
              </View>
            )}
            {showConversion ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: 0.5 }}>
                  {convertedAmount.toFixed(2)} <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>{baseCurrency}</Text>
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }}>
                  (~{subscription.amount.toFixed(2)} {subscription.currency})
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: 0.5 }}>
                {subscription.amount.toFixed(2)} <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>{subscription.currency}</Text>
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '500' }}>
            {t('subs.renews', { date: nextBilling })}
          </Text>
        </View>
      </View>

      {/* Bottom Row: Metrics */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20 }}>
        <View style={{ flex: 1, marginRight: 10, backgroundColor: colors.background, padding: 14, borderRadius: 14 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', marginBottom: 6, letterSpacing: 0.5 }}>{t('subs.activeFor')}</Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>{activeMonths} <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: '600' }}>{t('subs.months')}</Text></Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10, backgroundColor: colors.background, padding: 14, borderRadius: 14 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', marginBottom: 6, letterSpacing: 0.5 }}>{t('subs.totalSpend')}</Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>{totalSpend.toFixed(0)} <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: '600' }}>{subscription.currency}</Text></Text>
        </View>
      </View>

      {/* Payment Method Footer */}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="card-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
        {linkedCard ? (
          <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>
            <Text style={{ textTransform: 'capitalize' }}>{linkedCard.type}</Text> • {linkedCard.name} •••• {linkedCard.lastFourDigits || '****'}
          </Text>
        ) : (
          <Text style={{ fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' }}>
            {t('subs.noPaymentMethod', 'No payment method linked')}
          </Text>
        )}
      </View>

    </TouchableOpacity>
    </Swipeable>
  );
});
