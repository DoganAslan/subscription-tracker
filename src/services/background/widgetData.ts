import { calculateSubscriptionCost, MONTHLY_FACTOR_BY_CYCLE, type CostedSubscription } from '@/domain/subscriptions/billing';
import { normalizeSubscriptionState } from '@/domain/subscriptions/normalization';
import { getNextRenewal } from '@/domain/subscriptions/recurrence';
import type { BillingCycle } from '@/services/firebase/types';
import type { ExchangeRates } from '@/utils/currency';

export type WidgetSplitMember = {
  id?: string;
  name?: string;
  phone?: string;
  shareAmount?: number | string | null;
  amount?: number | string | null;
  isPaid?: boolean;
};

export type WidgetSubscription = {
  name: string;
  amount: number | string;
  currency?: string;
  billingCycle?: BillingCycle | string;
  renewalDate?: unknown;
  status?: 'active' | 'paused' | string;
  isPaused?: boolean | null;
  isTrial?: boolean | null;
  isFreeTrial?: boolean | null;
  trialEndDate?: unknown;
  isSplit?: boolean | null;
  splitMembers?: WidgetSplitMember[] | null;
};

export type WidgetData = {
  monthlyTotal: string;
  nextPaymentName: string;
  nextPaymentDate: string;
  nextPaymentMeta: string;
  activeCount: number;
  labels: {
    monthlyTotal: string;
    nextPayment: string;
    activeSubscriptions: string;
    appName: string;
  };
};

export type BuildWidgetDataOptions = {
  subscriptions: WidgetSubscription[];
  baseCurrency: string;
  currencySymbol: string;
  isTurkish: boolean;
  now?: Date;
  rates: Readonly<ExchangeRates>;
};

const toBillingCycle = (value: unknown): BillingCycle => {
  const cycle = String(value || 'monthly').toLowerCase();
  return Object.prototype.hasOwnProperty.call(MONTHLY_FACTOR_BY_CYCLE, cycle)
    ? cycle as BillingCycle
    : 'monthly';
};

const toFiniteAmount = (value: number | string | null | undefined): number => {
  const amount = Number.parseFloat(String(value));
  return Number.isFinite(amount) ? amount : 0;
};

const toCostedSubscription = (subscription: WidgetSubscription): CostedSubscription => ({
  amount: toFiniteAmount(subscription.amount),
  currency: subscription.currency || 'TRY',
  billingCycle: toBillingCycle(subscription.billingCycle),
  status: subscription.status === 'paused' ? 'paused' : 'active',
  isPaused: subscription.isPaused === true,
  isSplit: subscription.isSplit === true,
  splitMembers: (subscription.splitMembers || []).map((member, index) => ({
    id: member.id || `widget-member-${index}`,
    name: member.name || '',
    phone: member.phone || '',
    shareAmount: toFiniteAmount(member.shareAmount ?? member.amount),
    isPaid: member.isPaid === true,
  })),
});

function getRelativeDueLabel(date: Date, now: Date, isTurkish: boolean): string {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const differenceInDays = Math.round(
    (startOfDueDay.getTime() - startOfToday.getTime()) / 86_400_000,
  );

  if (differenceInDays === 0) return isTurkish ? 'Bugün' : 'Today';
  if (differenceInDays === 1) return isTurkish ? 'Yarın' : 'Tomorrow';
  return isTurkish ? `${differenceInDays} gün sonra` : `in ${differenceInDays} days`;
}

export function buildWidgetData({
  subscriptions,
  baseCurrency,
  currencySymbol,
  isTurkish,
  now = new Date(),
  rates,
}: BuildWidgetDataOptions): WidgetData {
  const activeSubscriptions = Array.isArray(subscriptions)
    ? subscriptions.filter(subscription => !normalizeSubscriptionState({
      status: subscription.status === 'paused' ? 'paused' : 'active',
      isPaused: subscription.isPaused,
      isTrial: subscription.isTrial,
      isFreeTrial: subscription.isFreeTrial,
    }).isPaused)
    : [];

  const monthlyTotal = activeSubscriptions.reduce((total, subscription) => {
    const costs = calculateSubscriptionCost(toCostedSubscription(subscription), { baseCurrency, rates });
    return total + costs.monthlyGross;
  }, 0);

  let nextPaymentName = isTurkish ? 'Yaklaşan ödeme yok' : 'No upcoming payment';
  let nextPaymentDate = '--';
  let nextPaymentMeta = isTurkish
    ? 'Yeni abonelik eklediğinde burada görünür.'
    : 'It will appear here after you add a subscription.';

  const nextPayment = activeSubscriptions
    .map(subscription => ({
      subscription,
      date: getNextRenewal({
        billingCycle: toBillingCycle(subscription.billingCycle),
        renewalDate: subscription.renewalDate,
        status: subscription.status === 'paused' ? 'paused' : 'active',
        isPaused: subscription.isPaused,
        isTrial: subscription.isTrial,
        isFreeTrial: subscription.isFreeTrial,
        trialEndDate: subscription.trialEndDate,
      }, now),
    }))
    .filter((item): item is { subscription: WidgetSubscription; date: Date } => Boolean(item.date))
    .sort((left, right) => left.date.getTime() - right.date.getTime())[0];

  if (nextPayment) {
    nextPaymentName = nextPayment.subscription.name;
    nextPaymentDate = nextPayment.date.toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
    nextPaymentMeta = getRelativeDueLabel(nextPayment.date, now, isTurkish);
  }

  return {
    monthlyTotal: `${currencySymbol}${monthlyTotal.toFixed(2)}`,
    nextPaymentName,
    nextPaymentDate,
    nextPaymentMeta,
    activeCount: activeSubscriptions.length,
    labels: {
      monthlyTotal: isTurkish ? 'AYLIK TOPLAM' : 'MONTHLY TOTAL',
      nextPayment: isTurkish ? 'SIRADAKİ ÖDEME' : 'NEXT PAYMENT',
      activeSubscriptions: isTurkish ? 'aktif abonelik' : 'active subscriptions',
      appName: 'SUBMATE',
    },
  };
}
