import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { AiChatModal } from '@/features/ai/components/AiChatModal';
import { FinancialDecisionTools } from '@/features/analytics/components/FinancialDecisionTools';
import { useSubscriptions, useUpdateSubscription } from '@/features/subscriptions/hooks/useSubscriptions';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { getCategoryMeta } from '@/utils/categoryMeta';
import { getMarketRatesWithDynamicCache } from '@/utils/currency';
import { triggerHaptic } from '@/utils/haptics';
import { calculateFinancialAnalysis } from '@/features/analytics/utils/financialAnalytics';
import { Subscription } from '@/services/firebase/types';
import { getResponsiveGridItemWidth } from '@/utils/responsiveGrid';

type InsightItem = {
  icon: any;
  color: string;
  backgroundColor: string;
  title: string;
  description: string;
};

export default function AnalyticsScreen() {
  const [aiChatVisible, setAiChatVisible] = useState(false);
  const [ratesVersion, setRatesVersion] = useState(0);
  const [updatingUsageId, setUpdatingUsageId] = useState<string | null>(null);
  const [selectedCashFlowMonth, setSelectedCashFlowMonth] = useState<string | null>(null);
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const monthlyBudget = useBudgetStore(state => state.monthlyBudget);
  const { data: subscriptions = [], isLoading, isRefetching, refetch } = useSubscriptions();
  const { mutate: updateSubscription } = useUpdateSubscription();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isWide = width >= 900;
  const isCompact = width < 380;
  const metricCardWidths = [0, 1, 2].map(itemIndex => getResponsiveGridItemWidth({
    screenWidth: width,
    itemIndex,
    itemCount: 3,
  }));

  useEffect(() => {
    getMarketRatesWithDynamicCache('TRY')
      .then(() => setRatesVersion(version => version + 1))
      .catch(error => console.warn('[Analytics] Exchange rates could not be refreshed:', error));
  }, []);

  const analysis = useMemo(
    () => calculateFinancialAnalysis(subscriptions, baseCurrency, monthlyBudget),
    [baseCurrency, monthlyBudget, ratesVersion, subscriptions],
  );

  const moneyFormatter = useMemo(
    () => new Intl.NumberFormat(isTurkish ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: baseCurrency,
      maximumFractionDigits: 2,
    }),
    [baseCurrency, isTurkish],
  );

  const formatMoney = (value: number) => moneyFormatter.format(Number.isFinite(value) ? value : 0);
  const formatDate = (date: Date) => new Intl.DateTimeFormat(isTurkish ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(date);
  const formatMonth = (date: Date) => new Intl.DateTimeFormat(isTurkish ? 'tr-TR' : 'en-US', {
    month: 'short',
  }).format(date).replace('.', '');

  const insights = useMemo<InsightItem[]>(() => {
    const items: InsightItem[] = [];

    if (analysis.budgetUsagePercent !== null && analysis.budgetUsagePercent > 100) {
      items.push({
        icon: 'warning-outline',
        color: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        title: isTurkish ? 'Bütçe limiti aşıldı' : 'Budget limit exceeded',
        description: isTurkish
          ? `Aylık taahhüdün limitin ${formatMoney(Math.abs(analysis.budgetRemaining || 0))} üzerinde.`
          : `Your monthly commitment is ${formatMoney(Math.abs(analysis.budgetRemaining || 0))} over the limit.`,
      });
    }

    if (analysis.trialsEndingSoon > 0) {
      items.push({
        icon: 'hourglass-outline',
        color: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        title: isTurkish ? 'Deneme süresi yaklaşıyor' : 'Trial ending soon',
        description: isTurkish
          ? `${analysis.trialsEndingSoon} ücretsiz deneme önümüzdeki 14 gün içinde ücretli olabilir.`
          : `${analysis.trialsEndingSoon} free trial may become paid within the next 14 days.`,
      });
    }

    if (analysis.lowUsageCount > 0) {
      items.push({
        icon: 'eye-off-outline',
        color: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.12)',
        title: isTurkish ? 'Düşük kullanım tespit edildi' : 'Low usage detected',
        description: isTurkish
          ? `${analysis.lowUsageCount} abonelikte aylık ${formatMoney(analysis.lowUsageMonthly)} tutar yeniden değerlendirilebilir.`
          : `${formatMoney(analysis.lowUsageMonthly)} per month across ${analysis.lowUsageCount} subscriptions is worth reviewing.`,
      });
    }

    if (analysis.duplicateCategoryCount > 0) {
      items.push({
        icon: 'layers-outline',
        color: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.12)',
        title: isTurkish ? 'Kategori çakışması var' : 'Category overlap found',
        description: isTurkish
          ? `${analysis.duplicateCategoryCount} kategoride birden fazla aktif servis var; benzer hizmetleri karşılaştır.`
          : `${analysis.duplicateCategoryCount} categories contain multiple active services; compare overlapping options.`,
      });
    }

    if (analysis.contractsEndingSoon > 0) {
      items.push({
        icon: 'document-text-outline',
        color: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        title: isTurkish ? 'Taahhüt bitişi yaklaşıyor' : 'Contract ending soon',
        description: isTurkish
          ? `${analysis.contractsEndingSoon} sözleşme önümüzdeki 30 gün içinde sona eriyor.`
          : `${analysis.contractsEndingSoon} contract ends within the next 30 days.`,
      });
    }

    if (analysis.foreignCurrencyShare >= 30) {
      items.push({
        icon: 'swap-horizontal-outline',
        color: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        title: isTurkish ? 'Kur hareketlerine açıksın' : 'High currency exposure',
        description: isTurkish
          ? `Aylık yükün %${analysis.foreignCurrencyShare.toFixed(0)} kadarı yabancı para biriminde.`
          : `${analysis.foreignCurrencyShare.toFixed(0)}% of your monthly commitment is in foreign currencies.`,
      });
    }

    if (analysis.unassignedPaymentCount > 0) {
      items.push({
        icon: 'card-outline',
        color: '#06B6D4',
        backgroundColor: 'rgba(6, 182, 212, 0.12)',
        title: isTurkish ? 'Ödeme yöntemi eksik' : 'Payment method missing',
        description: isTurkish
          ? `${analysis.unassignedPaymentCount} aktif abonelik bir karta bağlı değil.`
          : `${analysis.unassignedPaymentCount} active subscriptions are not linked to a card.`,
      });
    }

    if (items.length === 0) {
      items.push({
        icon: 'checkmark-circle-outline',
        color: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        title: isTurkish ? 'Görünür bir risk yok' : 'No immediate risk found',
        description: isTurkish
          ? 'Kayıtlı aboneliklerin bütçe ve yenileme yapısı dengeli görünüyor.'
          : 'Your recorded subscriptions look balanced across budget and renewal timing.',
      });
    }

    return items.slice(0, 4);
  }, [analysis, baseCurrency, isTurkish, moneyFormatter]);

  const maxCashFlow = Math.max(...analysis.cashFlow.map(month => month.amount), 1);
  const topCategories = analysis.categories.slice(0, 5);
  const topUpcoming = analysis.upcomingPayments.slice(0, 4);
  const selectedCashFlow = analysis.cashFlow.find(month => month.key === selectedCashFlowMonth) || null;
  const screenTopSpacing = Platform.OS === 'web' ? 18 : 8;

  const handleLogUsage = (subscription: Subscription) => {
    const id = String(subscription.id || '');
    if (!id) return;

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const recentLogs = (subscription.usageLogDates || []).filter(value => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && now.getTime() - date.getTime() <= 90 * 24 * 60 * 60 * 1000;
    });
    const alreadyLoggedToday = recentLogs.some(value => value.slice(0, 10) === todayKey);

    setUpdatingUsageId(id);
    updateSubscription({
      id,
      data: {
        lastUsedDate: now.toISOString(),
        usageLogDates: alreadyLoggedToday ? recentLogs : [...recentLogs, now.toISOString()],
        usageScore: (subscription.usageScore || 0) + (alreadyLoggedToday ? 0 : 1),
      },
    }, {
      onSettled: () => setUpdatingUsageId(null),
    });
  };

  const handleSetUsageFrequency = (
    subscription: Subscription,
    frequency: NonNullable<Subscription['usageFrequency']>,
  ) => {
    const id = String(subscription.id || '');
    if (!id) return;
    setUpdatingUsageId(id);
    updateSubscription({ id, data: { usageFrequency: frequency } }, {
      onSettled: () => setUpdatingUsageId(null),
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {isTurkish ? 'Finansal veriler hazırlanıyor...' : 'Preparing your financial data...'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: screenTopSpacing }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={[styles.pageTitle, isCompact && styles.pageTitleCompact, { color: colors.text }]}>
              {isTurkish ? 'Finansal Analiz' : 'Financial Analysis'}
            </Text>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
                {isTurkish ? 'Aboneliklerin değiştikçe otomatik güncellenir' : 'Updates automatically when subscriptions change'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => {
              triggerHaptic('impactLight');
              setAiChatVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={17} color="#FFFFFF" />
            <Text style={styles.aiButtonText}>{isTurkish ? 'AI’ye sor' : 'Ask AI'}</Text>
          </TouchableOpacity>
        </View>

        {analysis.activeCount === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.emptyIcon}>
              <Ionicons name="stats-chart-outline" size={30} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {isTurkish ? 'Analiz için abonelik ekle' : 'Add a subscription to start analysis'}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              {isTurkish
                ? 'Aylık yükünü, yaklaşan ödemeleri ve tasarruf fırsatlarını burada göreceksin.'
                : 'Your monthly load, upcoming payments, and savings opportunities will appear here.'}
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/subscriptions/add')}
            >
              <Ionicons name="add" size={19} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{isTurkish ? 'Abonelik ekle' : 'Add subscription'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <LinearGradient colors={['#2563EB', '#4F46E5', '#7C3AED']} style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroLabel}>{isTurkish ? 'AYLIK NET TAAHHÜT' : 'NET MONTHLY COMMITMENT'}</Text>
                  <Text style={styles.heroValue}>{formatMoney(analysis.monthlyCommitment)}</Text>
                </View>
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyBadgeText}>{baseCurrency}</Text>
                </View>
              </View>

              {analysis.monthlyTrialCredit > 0 && (
                <Text style={styles.heroNote}>
                  {isTurkish
                    ? `Aktif denemeler nedeniyle şu an yaklaşık ${formatMoney(analysis.currentMonthlyCost)}`
                    : `Currently about ${formatMoney(analysis.currentMonthlyCost)} while trials are active`}
                </Text>
              )}

              {analysis.budgetUsagePercent !== null ? (
                <View style={styles.budgetArea}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetLabel}>{isTurkish ? 'Bütçe kullanımı' : 'Budget usage'}</Text>
                    <Text style={styles.budgetValue}>{analysis.budgetUsagePercent.toFixed(0)}%</Text>
                  </View>
                  <View style={styles.budgetTrack}>
                    <View
                      style={[
                        styles.budgetFill,
                        {
                          width: `${Math.min(100, analysis.budgetUsagePercent)}%`,
                          backgroundColor: analysis.budgetUsagePercent > 100 ? '#FCA5A5' : '#FFFFFF',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.budgetHint}>
                    {(analysis.budgetRemaining || 0) >= 0
                      ? isTurkish
                        ? `${formatMoney(analysis.budgetRemaining || 0)} kullanılabilir alan kaldı`
                        : `${formatMoney(analysis.budgetRemaining || 0)} of budget remains`
                      : isTurkish
                        ? `${formatMoney(Math.abs(analysis.budgetRemaining || 0))} limit üzerinde`
                        : `${formatMoney(Math.abs(analysis.budgetRemaining || 0))} over budget`}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.budgetPrompt} onPress={() => router.push('/(tabs)')}>
                  <Ionicons name="flag-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.budgetPromptText}>
                    {isTurkish ? 'Ana sayfadan aylık bütçe limiti belirle' : 'Set a monthly budget from Home'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              <View style={styles.heroSummaryRow}>
                <View style={styles.heroSummaryItem}>
                  <Text style={styles.heroSummaryLabel}>{isTurkish ? 'Brüt' : 'Gross'}</Text>
                  <Text style={styles.heroSummaryValue}>{formatMoney(analysis.monthlyGross)}</Text>
                </View>
                <View style={styles.heroSummaryDivider} />
                <View style={styles.heroSummaryItem}>
                  <Text style={styles.heroSummaryLabel}>{isTurkish ? 'Paylaşılan' : 'Recovered'}</Text>
                  <Text style={styles.heroSummaryValue}>{formatMoney(analysis.monthlyRecoverable)}</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.statGrid}>
              <MetricCard width={metricCardWidths[0]} icon="calendar-outline" color="#8B5CF6" label={isTurkish ? '12 AYLIK TAHMİN' : '12-MONTH FORECAST'} value={formatMoney(analysis.yearlyProjection)} detail={isTurkish ? 'Mevcut taahhütlerle' : 'At current commitments'} surface={colors.surface} border={colors.border} text={colors.text} secondary={colors.textSecondary} />
              <MetricCard width={metricCardWidths[1]} icon="repeat-outline" color="#10B981" label={isTurkish ? 'AKTİF ABONELİK' : 'ACTIVE SUBSCRIPTIONS'} value={String(analysis.activeCount)} detail={analysis.pausedCount > 0 ? isTurkish ? `${analysis.pausedCount} duraklatılmış` : `${analysis.pausedCount} paused` : isTurkish ? 'Tümü aktif' : 'All active'} surface={colors.surface} border={colors.border} text={colors.text} secondary={colors.textSecondary} />
              <MetricCard width={metricCardWidths[2]} icon="calculator-outline" color="#F59E0B" label={isTurkish ? 'ABONELİK BAŞINA' : 'PER SUBSCRIPTION'} value={formatMoney(analysis.averagePerSubscription)} detail={isTurkish ? 'Aylık ortalama' : 'Monthly average'} surface={colors.surface} border={colors.border} text={colors.text} secondary={colors.textSecondary} />
            </View>

            <SectionCard surface={colors.surface} border={colors.border}>
              <SectionHeader icon="bar-chart-outline" title={isTurkish ? 'Önümüzdeki 6 ay' : 'Next 6 months'} subtitle={isTurkish ? 'Gerçek yenileme tarihlerine göre ödeme akışı' : 'Cash flow based on actual renewal dates'} text={colors.text} secondary={colors.textSecondary} />
              <View style={styles.cashFlowChart}>
                {analysis.cashFlow.map((month, index) => {
                  const height = month.amount > 0 ? Math.max(8, (month.amount / maxCashFlow) * 118) : 4;
                  const isSelected = selectedCashFlowMonth === month.key;
                  return (
                    <TouchableOpacity
                      key={month.key}
                      style={styles.cashFlowColumn}
                      activeOpacity={0.75}
                      onPress={() => {
                        triggerHaptic('selection');
                        setSelectedCashFlowMonth(current => current === month.key ? null : month.key);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={isTurkish ? `${formatMonth(month.date)} ayı ödemelerini göster` : `Show ${formatMonth(month.date)} payments`}
                    >
                      <Text numberOfLines={1} style={[styles.cashFlowValue, { color: index === 0 || isSelected ? colors.primary : colors.textSecondary }]}>
                        {month.amount > 0 ? formatMoney(month.amount).replace(baseCurrency, '').trim() : '—'}
                      </Text>
                      <View style={[styles.cashFlowTrack, { backgroundColor: isSelected ? `${colors.primary}26` : colors.surfaceSubtle, borderColor: isSelected ? colors.primary : 'transparent' }]}>
                        <View style={[styles.cashFlowBar, { height, backgroundColor: index === 0 || isSelected ? colors.primary : '#6366F1', opacity: index === 0 || isSelected ? 1 : 0.68 }]} />
                      </View>
                      <Text style={[styles.cashFlowMonth, { color: index === 0 || isSelected ? colors.primary : colors.textSecondary }]}>{formatMonth(month.date)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedCashFlow && (
                <View style={[styles.cashFlowDetails, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                  <View style={styles.cashFlowDetailsHeader}>
                    <View style={styles.cashFlowDetailsTitleRow}>
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                      <Text style={[styles.cashFlowDetailsTitle, { color: colors.text }]}>
                        {new Intl.DateTimeFormat(isTurkish ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' }).format(selectedCashFlow.date)}
                      </Text>
                    </View>
                    <Text style={[styles.cashFlowDetailsTotal, { color: colors.primary }]}>{formatMoney(selectedCashFlow.amount)}</Text>
                  </View>
                  {selectedCashFlow.payments.length > 0 ? (
                    <View style={styles.cashFlowPaymentList}>
                      {selectedCashFlow.payments.map(payment => (
                        <View key={`${selectedCashFlow.key}-${payment.subscription.id}-${payment.date.toISOString()}`} style={[styles.cashFlowPaymentRow, { borderTopColor: colors.border }]}>
                          <View style={[styles.cashFlowPaymentIcon, { backgroundColor: `${colors.primary}1A` }]}>
                            <Ionicons name="card-outline" size={15} color={colors.primary} />
                          </View>
                          <View style={styles.cashFlowPaymentCopy}>
                            <Text numberOfLines={1} style={[styles.cashFlowPaymentName, { color: colors.text }]}>{payment.subscription.name}</Text>
                            <Text style={[styles.cashFlowPaymentDate, { color: colors.textSecondary }]}>{formatDate(payment.date)}</Text>
                          </View>
                          <Text style={[styles.cashFlowPaymentAmount, { color: colors.text }]}>{formatMoney(payment.amount)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.cashFlowEmptyText, { color: colors.textSecondary }]}>
                      {isTurkish ? 'Bu ay için kayıtlı ödeme yok.' : 'No recorded payments for this month.'}
                    </Text>
                  )}
                </View>
              )}
            </SectionCard>

            <View style={[styles.twoColumnLayout, isWide && styles.twoColumnWide]}>
              <View style={isWide ? styles.wideColumn : undefined}>
                <SectionCard surface={colors.surface} border={colors.border} style={isWide ? styles.fillCard : undefined}>
                  <SectionHeader icon="pie-chart-outline" title={isTurkish ? 'Harcama dağılımı' : 'Spending breakdown'} subtitle={isTurkish ? 'Aylık net taahhüdün kategorilere dağılımı' : 'Your net monthly commitment by category'} text={colors.text} secondary={colors.textSecondary} />
                  <View style={styles.categoryList}>
                    {topCategories.map(category => {
                      const meta = getCategoryMeta(category.category, isTurkish);
                      return (
                        <View key={category.category} style={styles.categoryItem}>
                          <View style={styles.categoryTopRow}>
                            <View style={styles.categoryIdentity}>
                              <View style={[styles.categoryIcon, { backgroundColor: meta.bg }]}>
                                <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                              </View>
                              <View>
                                <Text style={[styles.categoryName, { color: colors.text }]}>{meta.name}</Text>
                                <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>{isTurkish ? `${category.count} abonelik` : `${category.count} subscription${category.count > 1 ? 's' : ''}`}</Text>
                              </View>
                            </View>
                            <View style={styles.categoryAmountArea}>
                              <Text style={[styles.categoryAmount, { color: colors.text }]}>{formatMoney(category.amount)}</Text>
                              <Text style={[styles.categoryPercent, { color: colors.textSecondary }]}>%{category.percentage.toFixed(0)}</Text>
                            </View>
                          </View>
                          <View style={[styles.categoryTrack, { backgroundColor: colors.surfaceSubtle }]}>
                            <View style={[styles.categoryFill, { width: `${Math.max(2, category.percentage)}%`, backgroundColor: meta.color }]} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </SectionCard>
              </View>

              <View style={isWide ? styles.wideColumn : undefined}>
                <SectionCard surface={colors.surface} border={colors.border} style={isWide ? styles.fillCard : undefined}>
                  <SectionHeader icon="time-outline" title={isTurkish ? 'Yaklaşan ödemeler' : 'Upcoming payments'} subtitle={isTurkish ? `30 günde ${topUpcoming.length > 0 ? formatMoney(analysis.upcoming30DayTotal) : 'ödeme yok'}` : `${topUpcoming.length > 0 ? formatMoney(analysis.upcoming30DayTotal) : 'No payments'} in 30 days`} text={colors.text} secondary={colors.textSecondary} action={isTurkish ? 'Takvim' : 'Calendar'} onAction={() => router.push('/(tabs)/calendar')} />
                  {topUpcoming.length > 0 ? (
                    <View style={styles.paymentList}>
                      {topUpcoming.map(payment => (
                        <View key={`${payment.subscription.id}-${payment.date.toISOString()}`} style={styles.paymentRow}>
                          <View style={[styles.dateBadge, { backgroundColor: colors.surfaceSubtle }]}>
                            <Text style={[styles.dateBadgeDay, { color: colors.text }]}>{payment.date.getDate()}</Text>
                            <Text style={[styles.dateBadgeMonth, { color: colors.textSecondary }]}>{formatMonth(payment.date)}</Text>
                          </View>
                          <View style={styles.paymentCopy}>
                            <Text numberOfLines={1} style={[styles.paymentName, { color: colors.text }]}>{payment.subscription.name}</Text>
                            <Text style={[styles.paymentTiming, { color: colors.textSecondary }]}>{payment.daysLeft === 0 ? isTurkish ? 'Bugün' : 'Today' : isTurkish ? `${payment.daysLeft} gün sonra` : `In ${payment.daysLeft} days`}</Text>
                          </View>
                          <Text style={[styles.paymentAmount, { color: colors.text }]}>{formatMoney(payment.amount)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noPaymentState}>
                      <Ionicons name="checkmark-circle-outline" size={25} color="#10B981" />
                      <Text style={[styles.noPaymentText, { color: colors.textSecondary }]}>{isTurkish ? 'Önümüzdeki 30 günde ödeme görünmüyor.' : 'No payments are due in the next 30 days.'}</Text>
                    </View>
                  )}
                </SectionCard>
              </View>
            </View>

            <SectionCard surface={colors.surface} border={colors.border}>
              <SectionHeader icon="compass-outline" title={isTurkish ? 'Finansal yapı' : 'Financial structure'} subtitle={isTurkish ? 'Maliyet yoğunlaşması ve kur etkisi' : 'Cost concentration and currency exposure'} text={colors.text} secondary={colors.textSecondary} />
              <View style={styles.structureGrid}>
                <StructureItem width={metricCardWidths[0]} icon="diamond-outline" color="#8B5CF6" label={isTurkish ? 'En yüksek maliyet' : 'Largest commitment'} value={analysis.topSubscription?.subscription.name || '—'} detail={analysis.topSubscription ? `${formatMoney(analysis.topSubscription.amount)} · %${analysis.topSubscription.share.toFixed(0)}` : '—'} text={colors.text} secondary={colors.textSecondary} subtle={colors.surfaceSubtle} />
                <StructureItem width={metricCardWidths[1]} icon="globe-outline" color="#3B82F6" label={isTurkish ? 'Döviz maruziyeti' : 'Currency exposure'} value={`%${analysis.foreignCurrencyShare.toFixed(0)}`} detail={formatMoney(analysis.foreignCurrencyMonthly)} text={colors.text} secondary={colors.textSecondary} subtle={colors.surfaceSubtle} />
                <StructureItem width={metricCardWidths[2]} icon="people-outline" color="#10B981" label={isTurkish ? 'Aylık geri alınan pay' : 'Monthly shared recovery'} value={formatMoney(analysis.monthlyRecoverable)} detail={isTurkish ? 'Paylaşılan ödemeler' : 'Shared payments'} text={colors.text} secondary={colors.textSecondary} subtle={colors.surfaceSubtle} />
              </View>
            </SectionCard>

            <FinancialDecisionTools
              subscriptions={subscriptions}
              baseCurrency={baseCurrency}
              isTurkish={isTurkish}
              formatMoney={formatMoney}
              updatingId={updatingUsageId}
              onOpenSubscription={id => router.push(`/(tabs)/subscriptions/${id}`)}
              onLogUsage={handleLogUsage}
              onSetFrequency={handleSetUsageFrequency}
            />

            <SectionCard surface={colors.surface} border={colors.border}>
              <SectionHeader icon="flash-outline" title={isTurkish ? 'Öncelikli aksiyonlar' : 'Priority actions'} subtitle={isTurkish ? 'En etkili kontroller önce gösterilir' : 'Highest-impact checks appear first'} text={colors.text} secondary={colors.textSecondary} />
              <View style={styles.insightList}>
                {insights.map((insight, index) => (
                  <TouchableOpacity key={`${insight.title}-${index}`} style={[styles.insightRow, { backgroundColor: colors.surfaceSubtle }]} onPress={() => router.push('/(tabs)/subscriptions')} activeOpacity={0.75}>
                    <View style={[styles.insightIcon, { backgroundColor: insight.backgroundColor }]}><Ionicons name={insight.icon} size={20} color={insight.color} /></View>
                    <View style={styles.insightCopy}>
                      <Text style={[styles.insightTitle, { color: colors.text }]}>{insight.title}</Text>
                      <Text style={[styles.insightDescription, { color: colors.textSecondary }]}>{insight.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </SectionCard>

            <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>{isTurkish ? `Tahminler kayıtlı tutar, para birimi, paylaşım ve yenileme tarihlerine dayanır. Son kontrol: ${formatDate(new Date())}.` : `Forecasts use saved amounts, currencies, shared costs, and renewal dates. Last checked ${formatDate(new Date())}.`}</Text>
          </>
        )}
      </ScrollView>

      <AiChatModal visible={aiChatVisible} onClose={() => setAiChatVisible(false)} />
    </SafeAreaView>
  );
}

function MetricCard({ width, icon, color, label, value, detail, surface, border, text, secondary }: any) {
  return <View style={[styles.metricCard, { width, backgroundColor: surface, borderColor: border }]}><View style={[styles.metricIcon, { backgroundColor: `${color}1F` }]}><Ionicons name={icon} size={18} color={color} /></View><Text style={[styles.metricLabel, { color: secondary }]}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, { color: text }]}>{value}</Text><Text style={[styles.metricDetail, { color: secondary }]}>{detail}</Text></View>;
}

function SectionCard({ children, surface, border, style }: any) {
  return <View style={[styles.sectionCard, { backgroundColor: surface, borderColor: border }, style]}>{children}</View>;
}

function SectionHeader({ icon, title, subtitle, text, secondary, action, onAction }: any) {
  return <View style={styles.sectionHeader}><View style={styles.sectionHeaderLeft}><View style={styles.sectionTitleRow}><Ionicons name={icon} size={18} color="#6366F1" /><Text style={[styles.sectionTitle, { color: text }]}>{title}</Text></View><Text style={[styles.sectionSubtitle, { color: secondary }]}>{subtitle}</Text></View>{action && <TouchableOpacity onPress={onAction} style={styles.sectionAction}><Text style={styles.sectionActionText}>{action}</Text><Ionicons name="chevron-forward" size={15} color="#3B82F6" /></TouchableOpacity>}</View>;
}

function StructureItem({ width, icon, color, label, value, detail, text, secondary, subtle }: any) {
  return <View style={[styles.structureItem, { width, backgroundColor: subtle }]}><View style={[styles.structureIcon, { backgroundColor: `${color}1F` }]}><Ionicons name={icon} size={18} color={color} /></View><Text style={[styles.structureLabel, { color: secondary }]}>{label}</Text><Text numberOfLines={1} style={[styles.structureValue, { color: text }]}>{value}</Text><Text numberOfLines={1} style={[styles.structureDetail, { color: secondary }]}>{detail}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, centered: { alignItems: 'center', justifyContent: 'center' }, loadingText: { fontSize: 13, marginTop: 12 },
  scrollView: { flex: 1, paddingHorizontal: 16 }, scrollContent: { paddingBottom: 130, gap: 16, width: '100%', maxWidth: 1180, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 2 }, headerCopy: { flex: 1, minWidth: 0 }, pageTitle: { fontSize: 25, fontWeight: '900', letterSpacing: -0.5 }, pageTitleCompact: { fontSize: 21 }, liveRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' }, pageSubtitle: { fontSize: 12, lineHeight: 17, flexShrink: 1 },
  aiButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#7C3AED', flexShrink: 0 }, aiButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  emptyCard: { borderRadius: 24, borderWidth: 1, padding: 28, alignItems: 'center', marginTop: 20 }, emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59, 130, 246, 0.12)', marginBottom: 16 }, emptyTitle: { fontSize: 19, fontWeight: '900', textAlign: 'center' }, emptyDescription: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 420, marginTop: 8 }, primaryButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 20 }, primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  heroCard: { borderRadius: 24, padding: 20, overflow: 'hidden' }, heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, heroLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }, heroValue: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: 5 }, heroNote: { color: 'rgba(255,255,255,0.82)', fontSize: 12, lineHeight: 18, marginTop: 4 }, currencyBadge: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }, currencyBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  budgetArea: { marginTop: 20 }, budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }, budgetLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '700' }, budgetValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' }, budgetTrack: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }, budgetFill: { height: '100%', borderRadius: 4 }, budgetHint: { color: 'rgba(255,255,255,0.72)', fontSize: 10, marginTop: 7 }, budgetPrompt: { marginTop: 18, minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.14)' }, budgetPromptText: { color: '#FFFFFF', flex: 1, fontSize: 11, fontWeight: '700' },
  heroSummaryRow: { flexDirection: 'row', marginTop: 20, paddingTop: 15, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.24)' }, heroSummaryItem: { flex: 1 }, heroSummaryDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.24)', marginHorizontal: 16 }, heroSummaryLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 10, fontWeight: '700' }, heroSummaryValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 3 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, metricCard: { minHeight: 132, borderRadius: 18, borderWidth: 1, padding: 14 }, metricIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, metricLabel: { fontSize: 9, lineHeight: 13, fontWeight: '800', letterSpacing: 0.5 }, metricValue: { fontSize: 20, fontWeight: '900', marginTop: 4 }, metricDetail: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  sectionCard: { borderRadius: 22, borderWidth: 1, padding: 17 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 16 }, sectionHeaderLeft: { flex: 1 }, sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, sectionTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2 }, sectionSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 4 }, sectionAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 }, sectionActionText: { color: '#3B82F6', fontSize: 11, fontWeight: '800' },
  cashFlowChart: { height: 175, flexDirection: 'row', alignItems: 'flex-end', paddingTop: 4 }, cashFlowColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', minWidth: 0 }, cashFlowValue: { fontSize: 9, fontWeight: '800', marginBottom: 5, maxWidth: '100%' }, cashFlowTrack: { height: 122, width: '62%', maxWidth: 38, minWidth: 18, borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden', borderWidth: 1 }, cashFlowBar: { width: '100%', borderRadius: 10 }, cashFlowMonth: { fontSize: 10, fontWeight: '800', marginTop: 7, textTransform: 'capitalize' },
  cashFlowDetails: { borderRadius: 16, borderWidth: 1, padding: 12, marginTop: 12 }, cashFlowDetailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, cashFlowDetailsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }, cashFlowDetailsTitle: { fontSize: 13, fontWeight: '900', textTransform: 'capitalize' }, cashFlowDetailsTotal: { fontSize: 13, fontWeight: '900' }, cashFlowPaymentList: { marginTop: 5 }, cashFlowPaymentRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: StyleSheet.hairlineWidth }, cashFlowPaymentIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, cashFlowPaymentCopy: { flex: 1 }, cashFlowPaymentName: { fontSize: 11, fontWeight: '800' }, cashFlowPaymentDate: { fontSize: 10, marginTop: 2 }, cashFlowPaymentAmount: { fontSize: 11, fontWeight: '900' }, cashFlowEmptyText: { fontSize: 11, marginTop: 12 },
  twoColumnLayout: { gap: 16 }, twoColumnWide: { flexDirection: 'row', alignItems: 'stretch' }, wideColumn: { flex: 1, minWidth: 0 }, fillCard: { flex: 1 }, categoryList: { gap: 15 }, categoryItem: { gap: 8 }, categoryTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, categoryIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }, categoryIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, categoryName: { fontSize: 12, fontWeight: '800' }, categoryCount: { fontSize: 9, marginTop: 2 }, categoryAmountArea: { alignItems: 'flex-end', flexShrink: 0 }, categoryAmount: { fontSize: 12, fontWeight: '800' }, categoryPercent: { fontSize: 9, marginTop: 2 }, categoryTrack: { height: 5, borderRadius: 3, overflow: 'hidden' }, categoryFill: { height: '100%', borderRadius: 3 },
  paymentList: { gap: 5 }, paymentRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10 }, dateBadge: { width: 43, height: 43, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, dateBadgeDay: { fontSize: 14, fontWeight: '900', lineHeight: 16 }, dateBadgeMonth: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase' }, paymentCopy: { flex: 1 }, paymentName: { fontSize: 12, fontWeight: '800' }, paymentTiming: { fontSize: 9, marginTop: 3 }, paymentAmount: { fontSize: 12, fontWeight: '900' }, noPaymentState: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 10 }, noPaymentText: { fontSize: 11, textAlign: 'center' },
  structureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'stretch' }, structureItem: { minHeight: 118, borderRadius: 16, padding: 13 }, structureIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, structureLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 }, structureValue: { fontSize: 14, fontWeight: '900', marginTop: 4 }, structureDetail: { fontSize: 9, marginTop: 3 },
  insightList: { gap: 9 }, insightRow: { minHeight: 70, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }, insightIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, insightCopy: { flex: 1 }, insightTitle: { fontSize: 12, fontWeight: '900' }, insightDescription: { fontSize: 10, lineHeight: 15, marginTop: 3 }, disclaimer: { fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 16 },
});
