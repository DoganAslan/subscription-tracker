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

interface Props {
  subscription: Subscription;
  compact?: boolean;
}

const getCategoryMeta = (cat: string) => {
  const c = String(cat || '').toLowerCase();
  if (c.includes('music') || c.includes('müzik') || c.includes('audio') || c.includes('spotify')) {
    return { icon: 'musical-notes-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
  }
  if (c.includes('entertain') || c.includes('eğlence') || c.includes('tv') || c.includes('video') || c.includes('stream') || c.includes('netflix')) {
    return { icon: 'film-outline', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
  }
  if (c.includes('product') || c.includes('üretken') || c.includes('work') || c.includes('cloud') || c.includes('software') || c.includes('tool')) {
    return { icon: 'briefcase-outline', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
  }
  if (c.includes('health') || c.includes('fit') || c.includes('spor') || c.includes('sağlık') || c.includes('gym')) {
    return { icon: 'fitness-outline', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
  }
  if (c.includes('game') || c.includes('oyun')) {
    return { icon: 'game-controller-outline', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' };
  }
  if (c.includes('finan') || c.includes('sigorta') || c.includes('bank')) {
    return { icon: 'wallet-outline', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
  }
  return { icon: 'sparkles-outline', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)' };
};

export const SubscriptionCard = React.memo(function SubscriptionCard({ subscription, compact = false }: Props) {
  const router = useRouter();
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
  const catMeta = getCategoryMeta(subscription.category || subscription.name);

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
    <Swipeable renderRightActions={renderRightActions} containerStyle={{ marginBottom: compact ? 8 : 14 }}>
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.75}
        style={compact ? {
          backgroundColor: colors.surface,
          padding: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        } : {
          backgroundColor: colors.surface,
          padding: 18,
          borderRadius: 20,
          flexDirection: 'column',
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 3,
          opacity: subscription.status === 'paused' ? 0.6 : 1
        }}
      >
        {compact ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: catMeta.bg, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={catMeta.icon as any} size={22} color={catMeta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 }} numberOfLines={1}>
                  {subscription.name}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textTransform: 'capitalize' }} numberOfLines={1}>
                  {(t.categories as any)?.[subscription.category] || subscription.category} • {subscription.billingCycle}
                </Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                {subscription.amount.toFixed(2)} {subscription.currency}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '500' }}>
                Renews {renewalDay}th
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ width: '100%' }}>
            {/* Header Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 16, marginRight: 12, backgroundColor: catMeta.bg, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name={catMeta.icon as any} size={24} color={catMeta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 3 }} numberOfLines={1}>
                    {subscription.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, textTransform: 'capitalize', fontWeight: '600' }} numberOfLines={1}>
                    {(t.categories as any)?.[subscription.category] || subscription.category} • {subscription.billingCycle}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                {showConversion ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                      {convertedAmount.toFixed(2)} <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>{baseCurrency}</Text>
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }}>
                      ({subscription.amount.toFixed(0)} {subscription.currency})
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                    {subscription.amount.toFixed(2)} <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>{subscription.currency}</Text>
                  </Text>
                )}
              </View>
            </View>

            {/* Badges & Linked Card Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1, alignItems: 'center' }}>
                {subscription.status === 'paused' && (
                  <View style={{ backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' }}>{t.common.paused}</Text>
                  </View>
                )}
                {subscription.isFreeTrial && (
                  <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#60A5FA' }}>{t.common.trial}</Text>
                  </View>
                )}
                {subscription.isSplit && subscription.splitMembers && subscription.splitMembers.length > 0 && (
                  <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>👥 {subscription.splitMembers.length} {t.form.partner}</Text>
                  </View>
                )}
                {isPriceHiked && (
                  <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>📈 +{priceHikePercentage}%</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
                <Ionicons name="card-outline" size={14} color={colors.textSecondary} style={{ marginRight: 5 }} />
                {linkedCard ? (
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '700' }}>
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

