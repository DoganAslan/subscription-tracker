import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, Animated, Alert, useWindowDimensions, StyleSheet } from 'react-native';
import { triggerHaptic } from '@/utils/haptics';
import { Subscription } from '@/services/firebase/types';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { useDeleteSubscription } from '@/features/subscriptions/hooks/useSubscriptions';
import { useTheme } from '@/context/ThemeContext';
import { getMonthlyCost } from '@/features/dashboard/utils/calculations';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { convertCurrency } from '@/utils/currency';
import { useTranslation } from '@/context/LanguageContext';
import { useCards } from '@/features/cards/hooks/useCards';
import { Ionicons } from '@expo/vector-icons';
import { TrialCountdownWidget } from './TrialCountdownWidget';


interface Props {
  subscription: Subscription;
  compact?: boolean;
}


export const SubscriptionCard = React.memo(function SubscriptionCard({ subscription, compact = false }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const { mutate: deleteSubscription } = useDeleteSubscription();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { data: cards } = useCards();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

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
  
  const convertedAmount = convertCurrency(subscription.amount, subscription.currency || 'USD', baseCurrency);
  const showConversion = (subscription.currency || 'USD') !== baseCurrency;

  const priceHistory = subscription.priceHistory || [];
  const latestOldPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].amount : null;
  const isPriceHiked = latestOldPrice && subscription.amount > latestOldPrice;
  const priceHikePercentage = latestOldPrice ? ((subscription.amount - latestOldPrice) / latestOldPrice * 100).toFixed(0) : null;

  const handleDelete = () => {
    triggerHaptic('error');
    Alert.alert(
      t.common.delete,
      `Are you sure you want to delete ${subscription.name}?`,
      [
        { text: t.common.cancel, style: 'cancel' },
        { 
          text: t.common.delete, 
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
          {t.common.delete}
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
      style={compact ? { marginBottom: 12 } : {
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
      {compact ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{renewalDay}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>{subscription.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary, textTransform: 'capitalize' }}>{(t.categories as any)?.[subscription.category] || subscription.category} • {subscription.billingCycle}</Text>
                {subscription.isSplit && subscription.splitMembers && subscription.splitMembers.length > 0 && (
                  <View style={{ backgroundColor: '#10B98120', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#10B981' }}>👥 {subscription.splitMembers.length} {t.form.partner}</Text>
                  </View>
                )}
                {isPriceHiked && (
                  <View style={{ backgroundColor: '#EF444420', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#EF4444' }}>📈 +{priceHikePercentage}%</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>{subscription.amount.toFixed(2)} {subscription.currency}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, fontWeight: '500' }}>Renews {nextBilling}</Text>
          </View>
        </View>
      ) : (
        <View style={{ width: '100%' }}>
          {/* Header Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, marginRight: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>
                  {renewalDay}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 }} numberOfLines={1}>
                  {subscription.name}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, textTransform: 'capitalize', fontWeight: '500' }} numberOfLines={1}>
                  {(t.categories as any)?.[subscription.category] || subscription.category} • {subscription.billingCycle}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {showConversion ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
                      {convertedAmount.toFixed(2)} <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>{baseCurrency}</Text>
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }}>
                      (~{subscription.amount.toFixed(0)} {subscription.currency})
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
                    {subscription.amount.toFixed(2)} <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>{subscription.currency}</Text>
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginTop: 6 }}>
                {t.card.renews} {nextBilling}
              </Text>
            </View>
          </View>

          {/* Badges & Footer Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1, alignItems: 'center' }}>
              {subscription.status === 'paused' && (
                <View style={{ backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.common.paused}</Text>
                </View>
              )}
              {subscription.isFreeTrial && (
                <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#60A5FA', letterSpacing: 0.5 }}>{t.common.trial}</Text>
                </View>
              )}
              {subscription.isSplit && subscription.splitMembers && subscription.splitMembers.length > 0 && (
                <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#10B981', letterSpacing: 0.5 }}>👥 {subscription.splitMembers.length} {t.form.partner}</Text>
                </View>
              )}
              {isPriceHiked && (
                <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#EF4444', letterSpacing: 0.5 }}>📈 +{priceHikePercentage}%</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
              <Ionicons name="card-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
              {linkedCard ? (
                <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>
                  ••• {linkedCard.lastFourDigits || '****'}
                </Text>
              ) : (
                <Text style={{ fontSize: 11, color: colors.textSecondary, fontStyle: 'italic', fontWeight: '500' }}>
                  {t.card.noPaymentMethod}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

    </TouchableOpacity>
    </Swipeable>
  );
});


