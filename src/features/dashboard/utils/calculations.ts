import {
  calculateSubscriptionCost,
  MONTHLY_FACTOR_BY_CYCLE,
} from '@/domain/subscriptions/billing';
import { normalizeSubscriptionState } from '@/domain/subscriptions/normalization';
import { getNextRenewal, parseSubscriptionDate } from '@/domain/subscriptions/recurrence';
import { BillingCycle, Subscription } from '@/services/firebase/types';
import { CURRENCY_RATES, type ExchangeRates } from '@/utils/currency';
import { getMidnight, parseSafeDate } from '@/utils/dateHelpers';

export const getMonthlyCost = (amount: number, cycle: BillingCycle): number => amount * MONTHLY_FACTOR_BY_CYCLE[cycle];

export const getYearlyCost = (amount: number, cycle: BillingCycle): number => getMonthlyCost(amount, cycle) * 12;

export interface DashboardMetrics {
  monthlyTotal: number;
  yearlyTotal: number;
  monthlyRecoverable: number;
  monthlyNetTotal: number;
  activeCount: number;
  mostExpensive: Subscription | null;
  upcomingRenewals: Subscription[];
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
}

export const getNextRenewalDate = (
  currentRenewal: unknown,
  cycle: BillingCycle,
  from = new Date(),
): Date => getNextRenewal({ billingCycle: cycle, renewalDate: currentRenewal, status: 'active' }, from)
  ?? parseSafeDate(currentRenewal);

export const calculateMetrics = (subscriptions: Subscription[], baseCurrency: string = 'TRY'): DashboardMetrics => {
  if (!subscriptions || subscriptions.length === 0) {
    return {
      monthlyTotal: 0,
      yearlyTotal: 0,
      monthlyRecoverable: 0,
      monthlyNetTotal: 0,
      activeCount: 0,
      mostExpensive: null,
      upcomingRenewals: [],
      categoryBreakdown: [],
    };
  }

  let monthlyTotal = 0;
  let yearlyTotal = 0;
  let monthlyRecoverable = 0;
  let monthlyTrialSavings = 0;
  let mostExpensive: Subscription | null = null;
  let maxMonthlyCost = -1;
  const categoryMap: Record<string, number> = {};
  const today = getMidnight(new Date());
  const next30Days = new Date(today);
  next30Days.setDate(today.getDate() + 30);
  const upcomingRenewals: Subscription[] = [];

  subscriptions.forEach(sub => {
    const state = normalizeSubscriptionState(sub);
    if (state.isPaused) return;

    const costs = calculateSubscriptionCost(sub, {
      baseCurrency,
      rates: CURRENCY_RATES as Readonly<ExchangeRates>,
    });
    const monthlyCost = costs.monthlyGross;
    const yearlyCost = getYearlyCost(costs.billingGross, sub.billingCycle);
    monthlyTotal += monthlyCost;
    yearlyTotal += yearlyCost;
    monthlyRecoverable += costs.monthlyRecovered;

    const trialEnd = parseSubscriptionDate(sub.trialEndDate);
    if (state.isTrial && trialEnd && trialEnd.getTime() > today.getTime()) {
      monthlyTrialSavings += costs.monthlyNet;
    }

    if (monthlyCost > maxMonthlyCost) {
      maxMonthlyCost = monthlyCost;
      mostExpensive = sub;
    }

    categoryMap[sub.category] = (categoryMap[sub.category] || 0) + monthlyCost;

    const nextRenewal = getNextRenewal(sub, today);
    if (nextRenewal && nextRenewal <= next30Days) {
      upcomingRenewals.push({
        ...sub,
        renewalDate: { toDate: () => nextRenewal, toMillis: () => nextRenewal.getTime() } as Subscription['renewalDate'],
      });
    }
  });

  upcomingRenewals.sort((a, b) => a.renewalDate.toMillis() - b.renewalDate.toMillis());
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: monthlyTotal > 0 ? (amount / monthlyTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    monthlyTotal,
    yearlyTotal,
    monthlyRecoverable,
    monthlyNetTotal: Math.max(0, monthlyTotal - monthlyRecoverable - monthlyTrialSavings),
    activeCount: subscriptions.length,
    mostExpensive,
    upcomingRenewals,
    categoryBreakdown,
  };
};

export const getContractDoomStatus = (contractEndDate?: Date | string | null): { isDoomed: boolean; daysLeft: number | null } => {
  if (!contractEndDate) return { isDoomed: false, daysLeft: null };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(contractEndDate);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { isDoomed: diffDays >= 0 && diffDays <= 30, daysLeft: diffDays };
};

export interface FinancialHealthResult {
  score: number;
  statusKey: string;
  adviceKeys: string[];
}

export const calculateVampireScore = (subscriptions: any[], totalMonthlyCostTL: number): FinancialHealthResult => {
  if (!subscriptions || subscriptions.length === 0) {
    return { score: 100, statusKey: 'health.statusExcellent', adviceKeys: [] };
  }

  let currentScore = 100;
  const triggeredAdvice: string[] = [];
  const doomedCount = subscriptions.filter(s => s.status !== 'paused' && getContractDoomStatus(s.contractEndDate).isDoomed).length;
  if (doomedCount > 0) {
    currentScore -= doomedCount * 15;
    triggeredAdvice.push('health.adviceDoom');
  }

  const dayCounts: { [key: number]: number } = {};
  subscriptions.filter(s => s.status !== 'paused').forEach(s => {
    const day = new Date(s.startDate).getDate();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  if (Object.values(dayCounts).some(c => c >= 3)) {
    currentScore -= 10;
    triggeredAdvice.push('health.adviceDateClash');
  }

  if (subscriptions[0]?.category) {
    const categoryCounts: { [key: string]: number } = {};
    subscriptions.filter(s => s.status !== 'paused').forEach(s => {
      categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
    });
    if (Object.values(categoryCounts).some(c => c > 1)) {
      currentScore -= 25;
      triggeredAdvice.push('health.adviceDuplicate');
    }
  }

  if (totalMonthlyCostTL > 1500) currentScore -= 10;

  const finalScore = Math.max(0, Math.min(100, Math.round(currentScore)));
  let status = 'health.statusExcellent';
  if (finalScore < 50) status = 'health.statusCritical';
  else if (finalScore < 80) status = 'health.statusGood';
  return { score: finalScore, statusKey: status, adviceKeys: triggeredAdvice };
};
