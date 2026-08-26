import { BillingCycle, Subscription } from '@/services/firebase/types';
import { getMonthlyCost } from '@/features/dashboard/utils/calculations';
import { convertCurrency } from '@/utils/currency';
import { addMonthsClamped, getMidnight, parseSafeDate } from '@/utils/dateHelpers';

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

function getConvertedAmount(subscription: Subscription, baseCurrency: string): number {
  const rawAmount = Number(subscription.amount) || 0;
  return convertCurrency(rawAmount, subscription.currency || baseCurrency, baseCurrency);
}

function getRecoverableAmount(subscription: Subscription, baseCurrency: string): number {
  if (!subscription.isSplit || !Array.isArray(subscription.splitMembers)) return 0;
  const rawRecoverable = subscription.splitMembers.reduce(
    (total, member) => total + (Number(member.shareAmount) || 0),
    0,
  );
  return convertCurrency(rawRecoverable, subscription.currency || baseCurrency, baseCurrency);
}

function getNetPaymentAmount(subscription: Subscription, baseCurrency: string): number {
  return Math.max(
    0,
    getConvertedAmount(subscription, baseCurrency) - getRecoverableAmount(subscription, baseCurrency),
  );
}

export function getSubscriptionMonthlyNetCost(
  subscription: Subscription,
  baseCurrency: string,
): number {
  const convertedAmount = getConvertedAmount(subscription, baseCurrency);
  const convertedRecoverable = Math.min(
    convertedAmount,
    getRecoverableAmount(subscription, baseCurrency),
  );
  return Math.max(
    0,
    getMonthlyCost(
      convertedAmount - convertedRecoverable,
      subscription.billingCycle || 'monthly',
    ),
  );
}

function needsUsageReview(subscription: Subscription, now: Date): boolean {
  if (subscription.usageFrequency === 'low' || subscription.usageFrequency === 'none') return true;
  if (!subscription.lastUsedDate) return false;
  const lastUsed = new Date(subscription.lastUsedDate);
  if (Number.isNaN(lastUsed.getTime())) return false;
  return now.getTime() - lastUsed.getTime() > 30 * DAY_MS;
}

function isFutureDate(value: unknown, now: Date): boolean {
  if (!value) return false;
  return parseSafeDate(value).getTime() >= getMidnight(now).getTime();
}

function addBillingCycle(date: Date, cycle: BillingCycle, originalDay: number): Date {
  const next = new Date(date);
  if (cycle === 'weekly') {
    next.setDate(next.getDate() + 7);
    return next;
  }

  const monthsByCycle: Record<Exclude<BillingCycle, 'weekly'>, number> = {
    monthly: 1,
    quarterly: 3,
    biannually: 6,
    yearly: 12,
    biennially: 24,
  };
  return addMonthsClamped(next, monthsByCycle[cycle] || 1, originalDay);
}

function getFirstFuturePaymentDate(subscription: Subscription, now: Date): Date {
  if (subscription.isTrial && isFutureDate(subscription.trialEndDate, now)) {
    return getMidnight(parseSafeDate(subscription.trialEndDate));
  }

  let paymentDate = getMidnight(parseSafeDate(subscription.renewalDate));
  const today = getMidnight(now);
  const originalDay = paymentDate.getDate();
  let guard = 0;

  while (paymentDate.getTime() < today.getTime() && guard < 240) {
    paymentDate = addBillingCycle(paymentDate, subscription.billingCycle || 'monthly', originalDay);
    guard += 1;
  }

  return paymentDate;
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
): FinancialAnalysis {
  const active = subscriptions.filter(subscription => subscription.status !== 'paused');
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
    const convertedAmount = getConvertedAmount(subscription, baseCurrency);
    const convertedRecoverable = Math.min(
      convertedAmount,
      getRecoverableAmount(subscription, baseCurrency),
    );
    const monthlyAmount = getMonthlyCost(convertedAmount, subscription.billingCycle || 'monthly');
    const monthlyRecovered = getMonthlyCost(convertedRecoverable, subscription.billingCycle || 'monthly');
    const monthlyNet = Math.max(0, monthlyAmount - monthlyRecovered);
    const trialIsActive = subscription.isTrial && isFutureDate(subscription.trialEndDate, now);

    monthlyGross += monthlyAmount;
    monthlyRecoverable += monthlyRecovered;
    if (trialIsActive) monthlyTrialCredit += monthlyNet;
    if ((subscription.currency || baseCurrency).toUpperCase() !== baseCurrency.toUpperCase()) {
      foreignCurrencyMonthly += monthlyNet;
    }

    if (needsUsageReview(subscription, now)) {
      lowUsageMonthly += monthlyNet;
    }
    if (!subscription.cardId && !subscription.assignedCardId) unassignedPaymentCount += 1;

    const category = subscription.category || 'Other';
    const categoryValue = categoryMap.get(category) || { amount: 0, count: 0 };
    categoryMap.set(category, {
      amount: categoryValue.amount + monthlyNet,
      count: categoryValue.count + 1,
    });
    monthlyBySubscription.push({ subscription, amount: monthlyNet });

    if (subscription.isTrial && subscription.trialEndDate) {
      const trialEnd = getMidnight(parseSafeDate(subscription.trialEndDate));
      if (trialEnd >= today && trialEnd <= in14Days) trialsEndingSoon += 1;
    }
    if (subscription.hasContract && subscription.contractEndDate) {
      const contractEnd = getMidnight(parseSafeDate(subscription.contractEndDate));
      if (contractEnd >= today && contractEnd <= in30Days) contractsEndingSoon += 1;
    }

    const firstPaymentDate = getFirstFuturePaymentDate(subscription, now);
    const paymentAmount = getNetPaymentAmount(subscription, baseCurrency);
    let upcomingDate = firstPaymentDate;
    const upcomingOriginalDay = upcomingDate.getDate();
    let upcomingGuard = 0;
    while (upcomingDate <= in30Days && upcomingGuard < 12) {
      if (upcomingDate >= today) {
        upcomingPayments.push({
          subscription,
          date: upcomingDate,
          amount: paymentAmount,
          daysLeft: Math.max(0, Math.round((upcomingDate.getTime() - today.getTime()) / DAY_MS)),
        });
      }
      upcomingDate = addBillingCycle(
        upcomingDate,
        subscription.billingCycle || 'monthly',
        upcomingOriginalDay,
      );
      upcomingGuard += 1;
    }

    let projectedDate = firstPaymentDate;
    const originalDay = projectedDate.getDate();
    let guard = 0;
    while (projectedDate < cashFlowEnd && guard < 240) {
      if (projectedDate >= today) {
        const month = cashFlow.find(item => item.key === getMonthKey(projectedDate));
        if (month) {
          month.amount += paymentAmount;
          month.payments.push({
            subscription,
            date: new Date(projectedDate),
            amount: paymentAmount,
            daysLeft: Math.max(0, Math.round((projectedDate.getTime() - today.getTime()) / DAY_MS)),
          });
        }
      }
      projectedDate = addBillingCycle(
        projectedDate,
        subscription.billingCycle || 'monthly',
        originalDay,
      );
      guard += 1;
    }
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
