import {
  calculateSubscriptionCost,
  MONTHLY_FACTOR_BY_CYCLE,
  type CostedSubscription,
} from '@/domain/subscriptions/billing';
import type { BillingCycle } from '@/services/firebase/types';
import { CURRENCY_RATES, type ExchangeRates } from './currency';

type CompatibilitySplitMember = {
  shareAmount?: number | string | null;
  amount?: number | string | null;
};

type CompatibilitySubscription = {
  amount?: number | string | null;
  price?: number | string | null;
  currency?: string | null;
  billingCycle?: string | null;
  cycle?: string | null;
  period?: string | null;
  status?: 'active' | 'paused' | string | null;
  isPaused?: boolean | null;
  isSplit?: boolean | null;
  splitMembers?: CompatibilitySplitMember[] | null;
  splitParticipants?: CompatibilitySplitMember[] | null;
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

const toSplitAmount = (value: number | string | null | undefined): number => {
  const amount = Number.parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

const toCostedSubscription = (subscription: CompatibilitySubscription): CostedSubscription => {
  const members = Array.isArray(subscription.splitMembers) && subscription.splitMembers.length > 0
    ? subscription.splitMembers
    : Array.isArray(subscription.splitParticipants) ? subscription.splitParticipants : [];

  return {
    amount: toFiniteAmount(subscription.amount),
    price: subscription.price,
    currency: subscription.currency || 'USD',
    billingCycle: toBillingCycle(subscription.billingCycle || subscription.cycle || subscription.period),
    status: subscription.status === 'paused' ? 'paused' : 'active',
    isPaused: subscription.isPaused === true,
    isSplit: subscription.isSplit === true,
    splitMembers: members.map((member, index) => ({
      id: `compatibility-member-${index}`,
      name: '',
      phone: '',
      shareAmount: toSplitAmount(member.shareAmount ?? member.amount),
      isPaid: false,
    })),
  };
};

export const calculateMonthlyCosts = (
  subscription: CompatibilitySubscription,
  activeCurrency: string,
): { gross: number; net: number } => {
  const costs = calculateSubscriptionCost(toCostedSubscription(subscription), {
    baseCurrency: activeCurrency,
    rates: CURRENCY_RATES as Readonly<ExchangeRates>,
  });

  return { gross: costs.monthlyGross, net: costs.monthlyNet };
};
