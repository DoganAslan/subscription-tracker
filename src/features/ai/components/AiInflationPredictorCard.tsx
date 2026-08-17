import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { analyzePriceSurgeRisk, InflationPredictorSummary } from '@/services/ai/aiInflationPredictor';
import { triggerHaptic } from '@/utils/haptics';
import { useRouter } from 'expo-router';

interface Props {
  subscriptions: Subscription[];
  baseCurrency: string;
}

export function AiInflationPredictorCard({ subscriptions, baseCurrency }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const router = useRouter();

  const summary: InflationPredictorSummary = React.useMemo(() => {
    return analyzePriceSurgeRisk(subscriptions, baseCurrency);
  }, [subscriptions, baseCurrency]);

  if (summary.affectedSubsCount === 0) {
    return null;
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Ionicons name="trending-up-outline" size={20} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isTurkish ? '⚡ YZ Enflasyon & Zam Erken Uyarı Motoru' : '⚡ AI Price Surge Predictor'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isTurkish
                ? `Tahmini aylık +${summary.totalMonthlyExtraRisk} ${baseCurrency} kur/enflasyon riski`
                : `Est. monthly +${summary.totalMonthlyExtraRisk} ${baseCurrency} price surge risk`}
            </Text>
          </View>
        </View>
      </View>

      {/* Lock In Savings Banner */}
      <View style={[styles.savingsBanner, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
        <Ionicons name="lock-closed" size={18} color="#10B981" />
        <Text style={[styles.savingsBannerText, { color: colors.text }]}>
          {isTurkish
            ? `Yıllık planlara geçerek ~${summary.totalAnnualLockInSavings} ${baseCurrency} tasarruf edebilirsiniz.`
            : `Lock in annual plans to save ~${summary.totalAnnualLockInSavings} ${baseCurrency}.`}
        </Text>
      </View>

      {/* Risk Items */}
      <View style={{ gap: 8, marginTop: 8 }}>
        {summary.items.map((item) => (
          <TouchableOpacity
            key={item.subscriptionId}
            style={[styles.itemRow, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              triggerHaptic('impactLight');
              router.push(`/(tabs)/subscriptions/${item.subscriptionId}`);
            }}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1, flexShrink: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={[styles.subName, { color: colors.text, flexShrink: 1 }]} numberOfLines={1}>{item.subscriptionName}</Text>
                <View style={styles.surgeBadge}>
                  <Text style={styles.surgeBadgeText}>+{item.projectedIncreasePercentage}%</Text>
                </View>
              </View>

              <Text style={[styles.recText, { color: colors.textSecondary }]}>
                {item.recommendation}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
              <Text style={[styles.currentPrice, { color: colors.textSecondary }]}>
                {item.currentAmount} {item.currency}
              </Text>
              <Text style={styles.projectedPrice}>
                ➔ {item.projectedAmount} {item.currency}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  savingsBannerText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  subName: {
    fontSize: 13,
    fontWeight: '800',
  },
  surgeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  surgeBadgeText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  recText: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  currentPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  projectedPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
    marginTop: 2,
  },
});
