import React, { useMemo, useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { useCards } from '@/features/cards/hooks/useCards';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { useCurrencyStore } from '@/store/useCurrencyStore';

import { CategoryBreakdownCard } from '@/features/dashboard/components/CategoryBreakdownCard';
import { CardBreakdownCard } from '@/features/dashboard/components/CardBreakdownCard';
import { SpendingInsightsCard } from '@/features/dashboard/components/SpendingInsightsCard';
import { CostPerUseCard } from '@/features/dashboard/components/CostPerUseCard';
import { SmartAlternativesCard } from '@/features/dashboard/components/SmartAlternativesCard';
import { BundleAlertCard } from '@/features/dashboard/components/BundleAlertCard';
import { CurrencyRiskCard } from '@/features/dashboard/components/CurrencyRiskCard';
import { AiRecommendationsCard } from '@/features/dashboard/components/AiRecommendationsCard';

import { convertCurrency, getMarketRatesWithDynamicCache, ExchangeRates, SUPPORTED_CURRENCIES } from '@/utils/currency';
import { generate6MonthProjection } from '@/utils/projection';
import { analyzeFinancialHealth } from '@/utils/healthScore';
import { triggerHaptic } from '@/utils/haptics';

export default function AnalyticsScreen() {
  const [liveRates, setLiveRates] = useState<ExchangeRates | null>(null);

  const { t } = useTranslation();
  const { data: subscriptions, isLoading, isError, refetch, isRefetching } = useSubscriptions();
  const { data: cards = [] } = useCards();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const router = useRouter();
  const { colors } = useTheme();

  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, Platform.OS === 'web' ? 16 : 12);
  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency)?.symbol || baseCurrency;

  useEffect(() => {
    getMarketRatesWithDynamicCache().then(setLiveRates).catch(console.error);
  }, []);

  const metrics = useAnalytics(subscriptions);

  const chartData = useMemo(() => {
    return generate6MonthProjection(subscriptions, liveRates, baseCurrency);
  }, [subscriptions, liveRates, baseCurrency]);

  const maxAmount = useMemo(() => {
    const rawMax = Math.max(...chartData.map(d => d.totalAmount), 0);
    return rawMax > 0 ? rawMax : 1;
  }, [chartData]);

  const healthData = useMemo(() => {
    return analyzeFinancialHealth(subscriptions || []);
  }, [subscriptions]);

  const yearlyProjection = useMemo(() => {
    return metrics.monthlyTotal * 12;
  }, [metrics.monthlyTotal]);

  const avgCostPerSub = useMemo(() => {
    const count = subscriptions?.filter(s => s.status !== 'paused').length || 0;
    return count > 0 ? metrics.monthlyTotal / count : 0;
  }, [subscriptions, metrics.monthlyTotal]);

  const getScoreStatusText = () => {
    if (healthData.score >= 80) return t.healthScore?.excellent || 'Excellent Budget Health';
    if (healthData.score >= 50) return t.healthScore?.good || 'Moderate Spending';
    return t.healthScore?.warning || 'Budget Risk Warning';
  };

  const getVampirAlertMessage = () => {
    if (healthData.vampireStats) {
      if (typeof t.healthScore?.vampirWarning === 'function') {
        return t.healthScore.vampirWarning(healthData.vampireStats.category, healthData.vampireStats.count);
      }
      return `Vampire Alert: Multiple entries found in "${healthData.vampireStats.category}".`;
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, paddingTop }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Analytics & AI Insights</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>Detailed breakdown & smart budget optimization</Text>
          </View>

          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/subscriptions');
            }}
          >
            <Ionicons name="options-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 1. TOP STATS OVERVIEW CARDS */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statHeader}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Monthly Spend</Text>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Ionicons name="wallet-outline" size={16} color="#3B82F6" />
              </View>
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {currencySymbol}{metrics.monthlyTotal.toFixed(2)}
            </Text>
            <Text style={[styles.statSub, { color: '#10B981' }]}>Active Commitment</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statHeader}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Yearly Outlook</Text>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                <Ionicons name="trending-up-outline" size={16} color="#8B5CF6" />
              </View>
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {currencySymbol}{yearlyProjection.toFixed(0)}
            </Text>
            <Text style={[styles.statSub, { color: colors.textSecondary }]}>12 Months Total</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statHeader}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg / Subscription</Text>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="calculator-outline" size={16} color="#10B981" />
              </View>
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {currencySymbol}{avgCostPerSub.toFixed(2)}
            </Text>
            <Text style={[styles.statSub, { color: colors.textSecondary }]}>Per active service</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statHeader}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Services</Text>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Ionicons name="cube-outline" size={16} color="#F59E0B" />
              </View>
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {subscriptions?.length || 0}
            </Text>
            <Text style={[styles.statSub, { color: colors.textSecondary }]}>Tracked items</Text>
          </View>
        </View>

        {/* 2. FINANCIAL HEALTH SCORE */}
        <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles" size={16} color="#8B5CF6" />
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {t.health?.meterTitle || 'AI FINANCIAL HEALTH SCORE'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ color: healthData.colorTheme, fontSize: 26, fontWeight: '800' }}>
                {healthData.score}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginLeft: 2 }}>
                / 100
              </Text>
            </View>
          </View>

          <Text style={[styles.scoreStatusTitle, { color: colors.text }]}>
            {getScoreStatusText()}
          </Text>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${healthData.score}%`, backgroundColor: healthData.colorTheme },
              ]}
            />
          </View>

          {/* AI Insights Bullets */}
          {getVampirAlertMessage() && (
            <View style={styles.insightBullet}>
              <Text style={{ color: healthData.colorTheme, fontSize: 14, marginRight: 6 }}>•</Text>
              <Text style={[styles.insightText, { color: colors.text }]}>{getVampirAlertMessage()}</Text>
            </View>
          )}
          {healthData.insights.filter(adv => !adv.startsWith('Vampir Uyarısı')).map((adv, idx) => (
            <View key={idx} style={styles.insightBullet}>
              <Text style={{ color: healthData.colorTheme, fontSize: 14, marginRight: 6 }}>•</Text>
              <Text style={[styles.insightText, { color: colors.text }]}>{adv}</Text>
            </View>
          ))}
        </View>

        {/* 3. AI SMART RECOMMENDATIONS CARD */}
        <AiRecommendationsCard subscriptions={subscriptions || []} />

        {/* 4. REDESIGNED 6-MONTH PROJECTION SPENDING CHART */}
        <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
              6-Month Spending Outlook
            </Text>
            <View style={styles.currencyPill}>
              <Text style={styles.currencyPillText}>{baseCurrency}</Text>
            </View>
          </View>

          {/* Grid lines background */}
          <View style={styles.chartContainer}>
            <View style={styles.chartArea}>
              {chartData.map((item, index) => {
                const barHeightPercent = maxAmount > 0 ? (Number(item.totalAmount || 0) / maxAmount) * 100 : 0;
                const safeHeight = isNaN(barHeightPercent) ? 6 : Math.max(barHeightPercent, 6);
                const isCurrentMonth = index === 0;

                return (
                  <View key={index} style={styles.chartCol}>
                    <Text style={[styles.barValueText, { color: isCurrentMonth ? '#3B82F6' : colors.textSecondary }]}>
                      {isNaN(item.totalAmount) ? '0' : `${Math.round(item.totalAmount)}`}
                    </Text>

                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${safeHeight}%`,
                            backgroundColor: isCurrentMonth ? '#3B82F6' : '#6366F1',
                            opacity: isCurrentMonth ? 1 : 0.45 + (index * 0.08),
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={[
                        styles.barMonthLabel,
                        { color: isCurrentMonth ? '#3B82F6' : colors.textSecondary, fontWeight: isCurrentMonth ? '800' : '600' },
                      ]}
                    >
                      {item.monthName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* 5. CATEGORY BREAKDOWN DONUT & PERCENTAGES */}
        <CategoryBreakdownCard breakdown={metrics.categoryBreakdown} monthlyTotal={metrics.monthlyTotal} subscriptions={subscriptions || []} />

        {/* 6. CARD SPENDING BREAKDOWN */}
        <CardBreakdownCard cards={cards} subscriptions={subscriptions || []} />

        {/* 7. SMART ALTERNATIVES, BUNDLES & CURRENCY RISKS */}
        <SmartAlternativesCard subscriptions={subscriptions || []} />
        <BundleAlertCard subscriptions={subscriptions || []} />
        <CurrencyRiskCard subscriptions={subscriptions || []} baseCurrency={baseCurrency} liveRates={liveRates} />

        {/* 8. SPENDING INSIGHTS & COST PER USE */}
        <SpendingInsightsCard mostExpensive={metrics.mostExpensive} />
        <CostPerUseCard />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 140,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardContainer: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreStatusTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  insightBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  insightText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  currencyPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  currencyPillText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '800',
  },
  chartContainer: {
    paddingTop: 8,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 16,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  barValueText: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },
  barTrack: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  barFill: {
    width: 24,
    borderRadius: 12,
    minHeight: 6,
  },
  barMonthLabel: {
    fontSize: 11,
    marginTop: 8,
  },
});

