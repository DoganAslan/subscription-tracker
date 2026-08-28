import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

import type { Subscription } from '@/services/firebase/types';
import {
  calculateFinancialAnalysis,
  type CashFlowMonth,
  type FinancialAnalysis,
} from '@/features/analytics/utils/financialAnalytics';
import {
  CURRENCY_RATES,
  getMarketRatesWithDynamicCache,
  type ExchangeRates,
} from '@/utils/currency';

type IconName = ComponentProps<typeof Ionicons>['name'];
export type AnalysisLanguage = 'tr' | 'en';
export type InsightKind = 'budget' | 'trial' | 'usage' | 'overlap' | 'contract' | 'currency' | 'card' | 'healthy';

export type FinancialInsight = {
  kind: InsightKind;
  icon: IconName;
  color: string;
  backgroundColor: string;
  title: string;
  description: string;
};

export type FinancialAnalysisViewModel = {
  analysis: FinancialAnalysis;
  insights: FinancialInsight[];
  maxCashFlow: number;
  topCategories: FinancialAnalysis['categories'];
  topUpcoming: FinancialAnalysis['upcomingPayments'];
  formatMoney: (value: number) => string;
  formatDate: (date: Date) => string;
  formatMonth: (date: Date) => string;
  formatMonthYear: (date: Date) => string;
  getCashFlowMonth: (key: string | null) => CashFlowMonth | null;
};

type BuildFinancialAnalysisViewModelInput = {
  subscriptions: readonly Subscription[];
  baseCurrency: string;
  monthlyBudget: number | null;
  language: AnalysisLanguage;
  rates?: Readonly<ExchangeRates>;
  now?: Date;
};

export function buildFinancialAnalysisViewModel({
  subscriptions,
  baseCurrency,
  monthlyBudget,
  language,
  rates = CURRENCY_RATES as ExchangeRates,
  now = new Date(),
}: BuildFinancialAnalysisViewModelInput): FinancialAnalysisViewModel {
  const isTurkish = language === 'tr';
  const locale = isTurkish ? 'tr-TR' : 'en-US';
  const analysis = calculateFinancialAnalysis([...subscriptions], baseCurrency, monthlyBudget, now, rates);
  const moneyFormatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: baseCurrency,
    maximumFractionDigits: 2,
  });
  const formatMoney = (value: number): string => moneyFormatter.format(Number.isFinite(value) ? value : 0);
  const formatDate = (date: Date): string => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
  const formatMonth = (date: Date): string => new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).replace('.', '');
  const formatMonthYear = (date: Date): string => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
  const insights: FinancialInsight[] = [];

  if (analysis.budgetUsagePercent !== null && analysis.budgetUsagePercent > 100) {
    insights.push({
      kind: 'budget', icon: 'warning-outline', color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.12)',
      title: isTurkish ? 'Bütçe limiti aşıldı' : 'Budget limit exceeded',
      description: isTurkish
        ? `Aylık taahhüdün limitin ${formatMoney(Math.abs(analysis.budgetRemaining || 0))} üzerinde.`
        : `Your monthly commitment is ${formatMoney(Math.abs(analysis.budgetRemaining || 0))} over the limit.`,
    });
  }
  if (analysis.trialsEndingSoon > 0) {
    insights.push({
      kind: 'trial', icon: 'hourglass-outline', color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.12)',
      title: isTurkish ? 'Deneme süresi yaklaşıyor' : 'Trial ending soon',
      description: isTurkish
        ? `${analysis.trialsEndingSoon} ücretsiz deneme önümüzdeki 14 gün içinde ücretli olabilir.`
        : `${analysis.trialsEndingSoon} free trial may become paid within the next 14 days.`,
    });
  }
  if (analysis.lowUsageCount > 0) {
    insights.push({
      kind: 'usage', icon: 'eye-off-outline', color: '#F97316', backgroundColor: 'rgba(249, 115, 22, 0.12)',
      title: isTurkish ? 'Düşük kullanım tespit edildi' : 'Low usage detected',
      description: isTurkish
        ? `${analysis.lowUsageCount} abonelikte aylık ${formatMoney(analysis.lowUsageMonthly)} tutar yeniden değerlendirilebilir.`
        : `${formatMoney(analysis.lowUsageMonthly)} per month across ${analysis.lowUsageCount} subscriptions is worth reviewing.`,
    });
  }
  if (analysis.duplicateCategoryCount > 0) {
    insights.push({
      kind: 'overlap', icon: 'layers-outline', color: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.12)',
      title: isTurkish ? 'Kategori çakışması var' : 'Category overlap found',
      description: isTurkish
        ? `${analysis.duplicateCategoryCount} kategoride birden fazla aktif servis var; benzer hizmetleri karşılaştır.`
        : `${analysis.duplicateCategoryCount} categories contain multiple active services; compare overlapping options.`,
    });
  }
  if (analysis.contractsEndingSoon > 0) {
    insights.push({
      kind: 'contract', icon: 'document-text-outline', color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.12)',
      title: isTurkish ? 'Taahhüt bitişi yaklaşıyor' : 'Contract ending soon',
      description: isTurkish
        ? `${analysis.contractsEndingSoon} sözleşme önümüzdeki 30 gün içinde sona eriyor.`
        : `${analysis.contractsEndingSoon} contract ends within the next 30 days.`,
    });
  }
  if (analysis.foreignCurrencyShare >= 30) {
    insights.push({
      kind: 'currency', icon: 'swap-horizontal-outline', color: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.12)',
      title: isTurkish ? 'Kur hareketlerine açıksın' : 'High currency exposure',
      description: isTurkish
        ? `Aylık yükün %${analysis.foreignCurrencyShare.toFixed(0)} kadarı yabancı para biriminde.`
        : `${analysis.foreignCurrencyShare.toFixed(0)}% of your monthly commitment is in foreign currencies.`,
    });
  }
  if (analysis.unassignedPaymentCount > 0) {
    insights.push({
      kind: 'card', icon: 'card-outline', color: '#06B6D4', backgroundColor: 'rgba(6, 182, 212, 0.12)',
      title: isTurkish ? 'Ödeme yöntemi eksik' : 'Payment method missing',
      description: isTurkish
        ? `${analysis.unassignedPaymentCount} aktif abonelik bir karta bağlı değil.`
        : `${analysis.unassignedPaymentCount} active subscriptions are not linked to a card.`,
    });
  }
  if (insights.length === 0) {
    insights.push({
      kind: 'healthy', icon: 'checkmark-circle-outline', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.12)',
      title: isTurkish ? 'Görünür bir risk yok' : 'No immediate risk found',
      description: isTurkish
        ? 'Kayıtlı aboneliklerin bütçe ve yenileme yapısı dengeli görünüyor.'
        : 'Your recorded subscriptions look balanced across budget and renewal timing.',
    });
  }

  return {
    analysis,
    insights: insights.slice(0, 4),
    maxCashFlow: Math.max(...analysis.cashFlow.map(month => month.amount), 1),
    topCategories: analysis.categories.slice(0, 5),
    topUpcoming: analysis.upcomingPayments.slice(0, 4),
    formatMoney,
    formatDate,
    formatMonth,
    formatMonthYear,
    getCashFlowMonth: key => analysis.cashFlow.find(month => month.key === key) ?? null,
  };
}

export function useFinancialAnalysisViewModel(input: Omit<BuildFinancialAnalysisViewModelInput, 'rates'>): FinancialAnalysisViewModel {
  const [rates, setRates] = useState<Readonly<ExchangeRates>>(CURRENCY_RATES as ExchangeRates);

  useEffect(() => {
    let isMounted = true;
    getMarketRatesWithDynamicCache(input.baseCurrency)
      .then(nextRates => {
        if (isMounted) setRates(nextRates);
      })
      .catch(error => console.warn('[Analytics] Exchange rates could not be refreshed:', error));
    return () => { isMounted = false; };
  }, [input.baseCurrency]);

  return useMemo(
    () => buildFinancialAnalysisViewModel({ ...input, rates }),
    [input.baseCurrency, input.language, input.monthlyBudget, input.now, input.subscriptions, rates],
  );
}
