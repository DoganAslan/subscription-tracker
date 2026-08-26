import type { BillingCycle, Subscription } from '@/services/firebase/types';
import type { ExchangeRates } from '@/utils/currency';

export const MONTHLY_FACTOR_BY_CYCLE: Readonly<Record<BillingCycle, number>> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  biannually: 1 / 6,
  yearly: 1 / 12,
  biennially: 1 / 24,
};

export interface SubscriptionCostContext {
  baseCurrency: string;
  rates: Readonly<ExchangeRates>;
}

export interface SubscriptionCostBreakdown {
  billingGross: number;
  monthlyGross: number;
  monthlyRecovered: number;
  monthlyNet: number;
}

export type CostedSubscription = Pick<
  Subscription,
  'amount' | 'currency' | 'billingCycle' | 'status' | 'isPaused' | 'isSplit' | 'splitMembers'
> & { price?: number | string | null };

const roundMoney = (amount: number): number => {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

const getFiniteAmount = (amount: number | string | null | undefined): number | null => {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) ? numericAmount : null;
};

const getSubscriptionAmount = (subscription: CostedSubscription): number => {
  return getFiniteAmount(subscription.amount) ?? getFiniteAmount(subscription.price) ?? 0;
};

const convertAmount = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Readonly<ExchangeRates>,
): number => {
  const from = fromCurrency.toUpperCase().trim();
  const to = toCurrency.toUpperCase().trim();
  if (from === to) return amount;

  const fromRate = rates[from];
  const toRate = rates[to];
  if (
    !Number.isFinite(fromRate)
    || !Number.isFinite(toRate)
    || fromRate <= 0
    || toRate <= 0
  ) {
    return amount;
  }

  return (amount / fromRate) * toRate;
};

const getRecoveredBillingAmount = (subscription: CostedSubscription): number => {
  if (!subscription.isSplit || !Array.isArray(subscription.splitMembers)) return 0;

  return subscription.splitMembers.reduce((total, member) => {
    const shareAmount = getFiniteAmount(member.shareAmount) ?? 0;
    return total + shareAmount;
  }, 0);
};

export function calculateSubscriptionCost(
  subscription: CostedSubscription,
  context: SubscriptionCostContext,
): SubscriptionCostBreakdown {
  if (subscription.status === 'paused' || subscription.isPaused === true) {
    return {
      billingGross: 0,
      monthlyGross: 0,
      monthlyRecovered: 0,
      monthlyNet: 0,
    };
  }

  const billingGross = convertAmount(
    getSubscriptionAmount(subscription),
    subscription.currency,
    context.baseCurrency,
    context.rates,
  );
  const factor = MONTHLY_FACTOR_BY_CYCLE[subscription.billingCycle];
  const monthlyGross = billingGross * factor;
  const recoveredBillingAmount = Math.min(
    billingGross,
    convertAmount(
      getRecoveredBillingAmount(subscription),
      subscription.currency,
      context.baseCurrency,
      context.rates,
    ),
  );
  const monthlyRecovered = Math.min(monthlyGross, recoveredBillingAmount * factor);
  const monthlyNet = Math.max(0, monthlyGross - monthlyRecovered);

  return {
    billingGross: roundMoney(billingGross),
    monthlyGross: roundMoney(monthlyGross),
    monthlyRecovered: roundMoney(monthlyRecovered),
    monthlyNet: roundMoney(monthlyNet),
  };
}
