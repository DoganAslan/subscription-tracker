import { useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AiChatModal } from '@/features/ai/components/AiChatModal';
import { FinancialDecisionTools } from '@/features/analytics/components/FinancialDecisionTools';
import { AnalysisHeader } from '@/features/analytics/components/AnalysisHeader';
import { AnalysisHero } from '@/features/analytics/components/AnalysisHero';
import { MetricGrid } from '@/features/analytics/components/MetricGrid';
import { CashFlowSection } from '@/features/analytics/components/CashFlowSection';
import { SpendingBreakdownSection } from '@/features/analytics/components/SpendingBreakdownSection';
import { UpcomingPaymentsSection } from '@/features/analytics/components/UpcomingPaymentsSection';
import { FinancialStructureSection } from '@/features/analytics/components/FinancialStructureSection';
import { PriorityActionsSection } from '@/features/analytics/components/PriorityActionsSection';
import { useFinancialAnalysisViewModel } from '@/features/analytics/hooks/useFinancialAnalysisViewModel';
import { useUsageActions } from '@/features/analytics/hooks/useUsageActions';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { triggerHaptic } from '@/utils/haptics';
import { getResponsiveGridItemWidth } from '@/utils/responsiveGrid';

type AnalyticsScreenProps = { initialDate?: Date };

export default function AnalyticsScreen({ initialDate }: AnalyticsScreenProps = {}) {
  const [aiChatVisible, setAiChatVisible] = useState(false);
  const [selectedCashFlowMonth, setSelectedCashFlowMonth] = useState<string | null>(null);
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const monthlyBudget = useBudgetStore(state => state.monthlyBudget);
  const { data: subscriptions = [], isLoading, isRefetching, refetch } = useSubscriptions();
  const { updatingUsageId, logUsage, setUsageFrequency } = useUsageActions();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const viewModel = useFinancialAnalysisViewModel({ subscriptions, baseCurrency, monthlyBudget, language: isTurkish ? 'tr' : 'en', now: initialDate });
  const { analysis, insights, maxCashFlow, topCategories, topUpcoming, formatMoney, formatDate, formatMonth, formatMonthYear, getCashFlowMonth } = viewModel;
  const isWide = width >= 900;
  const isCompact = width < 380;
  const metricCardWidths = [0, 1, 2].map(itemIndex => getResponsiveGridItemWidth({ screenWidth: width, itemIndex, itemCount: 3 }));
  const selectedCashFlow = getCashFlowMonth(selectedCashFlowMonth);
  const screenTopSpacing = Platform.OS === 'web' ? 18 : 8;

  if (isLoading) {
    return <SafeAreaView style={[styles.safeArea, styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.loadingText, { color: colors.textSecondary }]}>{isTurkish ? 'Finansal veriler hazırlanıyor...' : 'Preparing your financial data...'}</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: screenTopSpacing }]} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}>
        <AnalysisHeader colors={colors} isTurkish={isTurkish} isCompact={isCompact} onAskAi={() => { triggerHaptic('impactLight'); setAiChatVisible(true); }} />
        {analysis.activeCount === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.emptyIcon}><Ionicons name="stats-chart-outline" size={30} color={colors.primary} /></View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{isTurkish ? 'Analiz için abonelik ekle' : 'Add a subscription to start analysis'}</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>{isTurkish ? 'Aylık yükünü, yaklaşan ödemeleri ve tasarruf fırsatlarını burada göreceksin.' : 'Your monthly load, upcoming payments, and savings opportunities will appear here.'}</Text>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)/subscriptions/add')}><Ionicons name="add" size={19} color="#FFFFFF" /><Text style={styles.primaryButtonText}>{isTurkish ? 'Abonelik ekle' : 'Add subscription'}</Text></TouchableOpacity>
          </View>
        ) : <>
          <AnalysisHero analysis={analysis} baseCurrency={baseCurrency} isTurkish={isTurkish} formatMoney={formatMoney} onSetBudget={() => router.push('/(tabs)')} />
          <MetricGrid analysis={analysis} widths={metricCardWidths} colors={colors} isTurkish={isTurkish} formatMoney={formatMoney} />
          <CashFlowSection colors={colors} isTurkish={isTurkish} cashFlow={analysis.cashFlow} maxCashFlow={maxCashFlow} selectedKey={selectedCashFlowMonth} selectedMonth={selectedCashFlow} formatMoney={formatMoney} formatDate={formatDate} formatMonth={formatMonth} formatMonthYear={formatMonthYear} onSelect={key => { triggerHaptic('selection'); setSelectedCashFlowMonth(current => current === key ? null : key); }} />
          <View style={[styles.twoColumn, isWide && styles.twoColumnWide]}>
            <View style={isWide ? styles.wideColumn : undefined}><SpendingBreakdownSection colors={colors} isTurkish={isTurkish} categories={topCategories} formatMoney={formatMoney} style={isWide ? styles.fillCard : undefined} /></View>
            <View style={isWide ? styles.wideColumn : undefined}><UpcomingPaymentsSection colors={colors} isTurkish={isTurkish} payments={topUpcoming} upcomingTotal={analysis.upcoming30DayTotal} formatMoney={formatMoney} formatMonth={formatMonth} onOpenCalendar={() => router.push('/(tabs)/calendar')} style={isWide ? styles.fillCard : undefined} /></View>
          </View>
          <FinancialStructureSection analysis={analysis} widths={metricCardWidths} colors={colors} isTurkish={isTurkish} formatMoney={formatMoney} />
          <FinancialDecisionTools subscriptions={subscriptions} baseCurrency={baseCurrency} isTurkish={isTurkish} formatMoney={formatMoney} updatingId={updatingUsageId} onOpenSubscription={id => router.push(`/(tabs)/subscriptions/${id}`)} onLogUsage={logUsage} onSetFrequency={setUsageFrequency} />
          <PriorityActionsSection colors={colors} isTurkish={isTurkish} insights={insights} onOpenSubscriptions={() => router.push('/(tabs)/subscriptions')} />
          <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>{isTurkish ? `Tahminler kayıtlı tutar, para birimi, paylaşım ve yenileme tarihlerine dayanır. Son kontrol: ${formatDate(new Date())}.` : `Forecasts use saved amounts, currencies, shared costs, and renewal dates. Last checked ${formatDate(new Date())}.`}</Text>
        </>}
      </ScrollView>
      <AiChatModal visible={aiChatVisible} onClose={() => setAiChatVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, centered: { alignItems: 'center', justifyContent: 'center' }, loadingText: { fontSize: 13, marginTop: 12 },
  scrollView: { flex: 1, paddingHorizontal: 16 }, scrollContent: { paddingBottom: 130, gap: 16, width: '100%', maxWidth: 1180, alignSelf: 'center' },
  emptyCard: { borderRadius: 24, borderWidth: 1, padding: 28, alignItems: 'center', marginTop: 20 }, emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59, 130, 246, 0.12)', marginBottom: 16 }, emptyTitle: { fontSize: 19, fontWeight: '900', textAlign: 'center' }, emptyDescription: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 420, marginTop: 8 }, primaryButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 20 }, primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  twoColumn: { gap: 16 }, twoColumnWide: { flexDirection: 'row', alignItems: 'stretch' }, wideColumn: { flex: 1, minWidth: 0 }, fillCard: { flex: 1 }, disclaimer: { fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 16 },
});
