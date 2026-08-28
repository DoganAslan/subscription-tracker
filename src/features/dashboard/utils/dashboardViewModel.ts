import { calculateSubscriptionCost } from '@/domain/subscriptions/billing';
import { normalizeSubscriptionState } from '@/domain/subscriptions/normalization';
import { getNextRenewal, parseSubscriptionDate } from '@/domain/subscriptions/recurrence';
import type { Subscription } from '@/services/firebase/types';
import type { ExchangeRates } from '@/utils/currency';
import type {
  DashboardCategoryBreakdown,
  DashboardContractAlert,
  DashboardViewModel,
} from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_ALERT_WINDOW_MS = 72 * 60 * 60 * 1000;

export type BuildDashboardViewModelInput = {
  subscriptions?: readonly Subscription[] | null;
  query: string;
  baseCurrency: string;
  rates: Readonly<ExchangeRates>;
  now: Date;
};

const normalizeSearchValue = (value: unknown): string => String(value ?? '').trim().toLocaleLowerCase();

const matchesQuery = (subscription: Subscription, query: string): boolean => [
  subscription.name,
  subscription.category,
  subscription.notes,
  subscription.amount,
  subscription.currency,
  subscription.billingCycle,
].some(value => normalizeSearchValue(value).includes(query));

const startOfLocalDay = (date: Date): Date => new Date(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
);

const getContractAlert = (
  subscription: Subscription,
  today: Date,
): DashboardContractAlert | null => {
  const contractEnd = parseSubscriptionDate(subscription.contractEndDate);
  if (!contractEnd) return null;

  const daysLeft = Math.ceil((contractEnd.getTime() - today.getTime()) / DAY_MS);
  if (daysLeft < 0 || daysLeft > 30) return null;

  return {
    subscriptionId: subscription.id ?? null,
    subscriptionName: subscription.name,
    daysLeft,
    severity: daysLeft <= 7 ? 'critical' : 'warning',
  };
};

const getTrialEndTime = (subscription: Subscription): number | null => {
  const { isPaused, isTrial } = normalizeSubscriptionState(subscription);
  if (isPaused || !isTrial) return null;

  return parseSubscriptionDate(subscription.trialEndDate)?.getTime() ?? null;
};

export function buildDashboardViewModel({
  subscriptions = [],
  query,
  baseCurrency,
  rates,
  now,
}: BuildDashboardViewModelInput): DashboardViewModel {
  const source = [...(subscriptions ?? [])];
  const normalizedQuery = normalizeSearchValue(query);
  const isSearching = normalizedQuery.length > 0;
  const filteredSubscriptions = isSearching
    ? source.filter(subscription => matchesQuery(subscription, normalizedQuery))
    : [];
  const today = startOfLocalDay(now);

  const activeSubscriptions = source
    .filter(subscription => !normalizeSubscriptionState(subscription).isPaused);
  const activeWithRenewal = activeSubscriptions
    .map(subscription => ({
      subscription,
      renewal: getNextRenewal(subscription, today),
    }))
    .filter((item): item is { subscription: Subscription; renewal: Date } => item.renewal !== null)
    .sort((left, right) => left.renewal.getTime() - right.renewal.getTime());

  const upcomingSubscriptions = activeWithRenewal
    .slice(0, 5)
    .map(item => item.subscription);

  let monthlyTotal = 0;
  const categoryTotals = new Map<string, number>();

  for (const subscription of activeSubscriptions) {
    const monthlyAmount = calculateSubscriptionCost(subscription, {
      baseCurrency,
      rates,
    }).monthlyGross;
    monthlyTotal += monthlyAmount;
    categoryTotals.set(
      subscription.category,
      (categoryTotals.get(subscription.category) ?? 0) + monthlyAmount,
    );
  }

  const categoryBreakdown: DashboardCategoryBreakdown[] = [...categoryTotals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: monthlyTotal > 0 ? amount / monthlyTotal * 100 : 0,
    }))
    .sort((left, right) => right.amount - left.amount);

  const contractAlerts = source
    .filter(subscription => !normalizeSubscriptionState(subscription).isPaused)
    .map(subscription => getContractAlert(subscription, today))
    .filter((alert): alert is DashboardContractAlert => alert !== null)
    .sort((left, right) => left.daysLeft - right.daysLeft);

  const nowTime = now.getTime();
  const trialAlerts = source
    .map(subscription => ({ subscription, trialEndTime: getTrialEndTime(subscription) }))
    .filter(item => (
      item.trialEndTime !== null
      && item.trialEndTime >= nowTime
      && item.trialEndTime - nowTime <= TRIAL_ALERT_WINDOW_MS
    ))
    .sort((left, right) => (left.trialEndTime ?? 0) - (right.trialEndTime ?? 0))
    .map(item => item.subscription);

  return {
    isSearching,
    listSubscriptions: isSearching ? filteredSubscriptions : upcomingSubscriptions,
    filteredSubscriptions,
    upcomingSubscriptions,
    monthlyTotal,
    categoryBreakdown,
    contractAlerts,
    trialAlerts,
  };
}
