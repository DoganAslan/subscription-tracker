import { calculateSubscriptionCost } from '@/domain/subscriptions/billing';
import { getAssignedCardId } from '@/domain/subscriptions/cardAssignment';
import { normalizeSubscriptionState } from '@/domain/subscriptions/normalization';
import { getNextRenewal, getRenewalsInRange, parseSubscriptionDate } from '@/domain/subscriptions/recurrence';
import { Subscription } from '@/services/firebase/types';
import { CURRENCY_RATES, type ExchangeRates } from '@/utils/currency';
import { getMidnight } from '@/utils/dateHelpers';

export interface CategoryAnalysis {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface UpcomingPaymentAnalysis {
  subscription: Subscription;
  date: Date;
  amount: number;
  daysLeft: number;
}

export interface CashFlowMonth {
  key: string;
  date: Date;
  amount: number;
  payments: UpcomingPaymentAnalysis[];
}

export interface FinancialAnalysis {
  activeCount: number;
  pausedCount: number;
  monthlyGross: number;
  monthlyRecoverable: number;
  monthlyTrialCredit: number;
  monthlyCommitment: number;
  currentMonthlyCost: number;
  yearlyProjection: number;
  averagePerSubscription: number;
  budgetUsagePercent: number | null;
  budgetRemaining: number | null;
  categories: CategoryAnalysis[];
  topSubscription: { subscription: Subscription; amount: number; share: number } | null;
  foreignCurrencyMonthly: number;
  foreignCurrencyShare: number;
  upcoming30DayTotal: number;
  upcomingPayments: UpcomingPaymentAnalysis[];
  cashFlow: CashFlowMonth[];
  duplicateCategoryCount: number;
  lowUsageCount: number;
  lowUsageMonthly: number;
  trialsEndingSoon: number;
  contractsEndingSoon: number;
  unassignedPaymentCount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function getSubscriptionMonthlyNetCost(
  subscription: Subscription,
  baseCurrency: string,
  rates: Readonly<ExchangeRates> = CURRENCY_RATES as ExchangeRates,
): number {
  return calculateSubscriptionCost(subscription, {
    baseCurrency,
    rates,
  }).monthlyNet;
}

function needsUsageReview(subscription: Subscription, now: Date): boolean {
  if (subscription.usageFrequency === 'low' || subscription.usageFrequency === 'none') return true;
  if (!subscription.lastUsedDate) return false;
  const lastUsed = new Date(subscription.lastUsedDate);
  if (Number.isNaN(lastUsed.getTime())) return false;
  return now.getTime() - lastUsed.getTime() > 30 * DAY_MS;
}

function isFutureDate(value: unknown, now: Date): boolean {
  const date = parseSubscriptionDate(value);
  return Boolean(date && date.getTime() >= getMidnight(now).getTime());
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function createCashFlowMonths(now: Date): CashFlowMonth[] {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index, 1);
    return { key: getMonthKey(date), date, amount: 0, payments: [] };
  });
}

export function calculateFinancialAnalysis(
  subscriptions: Subscription[] = [],
  baseCurrency = 'TRY',
  monthlyBudget: number | null = null,
  now = new Date(),
  rates: Readonly<ExchangeRates> = CURRENCY_RATES as ExchangeRates,
): FinancialAnalysis {
  const active = subscriptions.filter(subscription => !normalizeSubscriptionState(subscription).isPaused);
  const pausedCount = subscriptions.length - active.length;
  const today = getMidnight(now);
  const in30Days = new Date(today.getTime() + 30 * DAY_MS);
  const in14Days = new Date(today.getTime() + 14 * DAY_MS);
  const cashFlow = createCashFlowMonths(today);
  const cashFlowEnd = new Date(today.getFullYear(), today.getMonth() + 6, 1);

  let monthlyGross = 0;
  let monthlyRecoverable = 0;
  let monthlyTrialCredit = 0;
  let foreignCurrencyMonthly = 0;
  let lowUsageMonthly = 0;
  let trialsEndingSoon = 0;
  let contractsEndingSoon = 0;
  let unassignedPaymentCount = 0;

  const categoryMap = new Map<string, { amount: number; count: number }>();
  const upcomingPayments: UpcomingPaymentAnalysis[] = [];
  const monthlyBySubscription: { subscription: Subscription; amount: number }[] = [];

  active.forEach(subscription => {
    const costs = calculateSubscriptionCost(subscription, {
      baseCurrency,
      rates,
    });
    const monthlyAmount = costs.monthlyGross;
    const monthlyRecovered = costs.monthlyRecovered;
    const monthlyNet = costs.monthlyNet;
    const state = normalizeSubscriptionState(subscription);
    const trialIsActive = state.isTrial && isFutureDate(subscription.trialEndDate, now);

    monthlyGross += monthlyAmount;
    monthlyRecoverable += monthlyRecovered;
    if (trialIsActive) monthlyTrialCredit += monthlyNet;
    if ((subscription.currency || baseCurrency).toUpperCase() !== baseCurrency.toUpperCase()) {
      foreignCurrencyMonthly += monthlyNet;
    }

    if (needsUsageReview(subscription, now)) {
      lowUsageMonthly += monthlyNet;
    }
    if (!getAssignedCardId(subscription)) unassignedPaymentCount += 1;

    const category = subscription.category || 'Other';
    const categoryValue = categoryMap.get(category) || { amount: 0, count: 0 };
    categoryMap.set(category, {
      amount: categoryValue.amount + monthlyNet,
      count: categoryValue.count + 1,
    });
    monthlyBySubscription.push({ subscription, amount: monthlyNet });

    if (state.isTrial && subscription.trialEndDate) {
      const trialEnd = parseSubscriptionDate(subscription.trialEndDate);
      if (trialEnd && trialEnd >= today && trialEnd <= in14Days) trialsEndingSoon += 1;
    }
    if (subscription.hasContract && subscription.contractEndDate) {
      const contractEnd = parseSubscriptionDate(subscription.contractEndDate);
      if (contractEnd && contractEnd >= today && contractEnd <= in30Days) contractsEndingSoon += 1;
    }

    const firstPaymentDate = getNextRenewal(subscription, today);
    if (!firstPaymentDate) return;
    const paymentAmount = costs.billingNet;
    getRenewalsInRange(subscription, { start: today, end: in30Days }).forEach(upcomingDate => {
      upcomingPayments.push({
        subscription,
        date: upcomingDate,
        amount: paymentAmount,
        daysLeft: Math.max(0, Math.round((upcomingDate.getTime() - today.getTime()) / DAY_MS)),
      });
    });

    getRenewalsInRange(subscription, { start: today, end: cashFlowEnd }).forEach(projectedDate => {
      const month = cashFlow.find(item => item.key === getMonthKey(projectedDate));
      if (!month) return;
      month.amount += paymentAmount;
      month.payments.push({
        subscription,
        date: new Date(projectedDate),
        amount: paymentAmount,
        daysLeft: Math.max(0, Math.round((projectedDate.getTime() - today.getTime()) / DAY_MS)),
      });
    });
  });

  cashFlow.forEach(month => {
    month.payments.sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  const monthlyCommitment = Math.max(0, monthlyGross - monthlyRecoverable);
  const currentMonthlyCost = Math.max(0, monthlyCommitment - monthlyTrialCredit);
  const categories = Array.from(categoryMap.entries())
    .map(([category, value]) => ({
      category,
      amount: value.amount,
      count: value.count,
      percentage: monthlyCommitment > 0 ? (value.amount / monthlyCommitment) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  monthlyBySubscription.sort((a, b) => b.amount - a.amount);
  const topEntry = monthlyBySubscription[0];
  const topSubscription = topEntry
    ? {
        ...topEntry,
        share: monthlyCommitment > 0 ? (topEntry.amount / monthlyCommitment) * 100 : 0,
      }
    : null;

  upcomingPayments.sort((a, b) => a.date.getTime() - b.date.getTime());
  const upcoming30DayTotal = upcomingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const duplicateCategoryCount = categories.filter(category => category.count > 1).length;
  const lowUsageCount = active.filter(subscription => needsUsageReview(subscription, now)).length;

  return {
    activeCount: active.length,
    pausedCount,
    monthlyGross,
    monthlyRecoverable,
    monthlyTrialCredit,
    monthlyCommitment,
    currentMonthlyCost,
    yearlyProjection: monthlyCommitment * 12,
    averagePerSubscription: active.length > 0 ? monthlyCommitment / active.length : 0,
    budgetUsagePercent: monthlyBudget && monthlyBudget > 0
      ? (monthlyCommitment / monthlyBudget) * 100
      : null,
    budgetRemaining: monthlyBudget && monthlyBudget > 0
      ? monthlyBudget - monthlyCommitment
      : null,
    categories,
    topSubscription,
    foreignCurrencyMonthly,
    foreignCurrencyShare: monthlyCommitment > 0
      ? (foreignCurrencyMonthly / monthlyCommitment) * 100
      : 0,
    upcoming30DayTotal,
    upcomingPayments,
    cashFlow,
    duplicateCategoryCount,
    lowUsageCount,
    lowUsageMonthly,
    trialsEndingSoon,
    contractsEndingSoon,
    unassignedPaymentCount,
  };
}
