import { describe, expect, it } from '@jest/globals';
import {
  calculateSubscriptionCost,
  MONTHLY_FACTOR_BY_CYCLE,
  type CostedSubscription,
  type SubscriptionCostContext,
} from '@/domain/subscriptions/billing';

const context: SubscriptionCostContext = {
  baseCurrency: 'TRY',
  rates: { TRY: 1, USD: 0.03, EUR: 0.027 },
};

const expectedMonthly = {
  weekly: 5200,
  monthly: 1200,
  quarterly: 400,
  biannually: 200,
  yearly: 100,
  biennially: 50,
} as const;

const subscription = (overrides: Partial<CostedSubscription> = {}): CostedSubscription => ({
  amount: 1200,
  currency: 'TRY',
  billingCycle: 'monthly',
  ...overrides,
});

describe('calculateSubscriptionCost', () => {
  it.each(Object.entries(expectedMonthly))('normalizes %s billing to its hand-derived monthly cost', (billingCycle, monthlyGross) => {
    const result = calculateSubscriptionCost(subscription({ billingCycle: billingCycle as CostedSubscription['billingCycle'] }), context);

    expect(MONTHLY_FACTOR_BY_CYCLE[billingCycle as CostedSubscription['billingCycle']]).toBe(monthlyGross / 1200);
    expect(result).toEqual({
      billingGross: 1200,
      monthlyGross,
      monthlyRecovered: 0,
      monthlyNet: monthlyGross,
    });
  });

  it('returns zeroes for a paused subscription', () => {
    const paused = subscription({ isPaused: true });

    expect(calculateSubscriptionCost(paused, context)).toEqual({
      billingGross: 0,
      monthlyGross: 0,
      monthlyRecovered: 0,
      monthlyNet: 0,
    });
  });

  it('subtracts recovered split shares from the monthly net cost', () => {
    const splitYearly = subscription({
      billingCycle: 'yearly',
      isSplit: true,
      splitMembers: [{ id: 'member-1', name: 'Alex', phone: '905555555555', shareAmount: 300, isPaid: true }],
    });

    expect(calculateSubscriptionCost(splitYearly, context).monthlyNet).toBe(75);
  });

  it('converts the billing amount before monthly normalization', () => {
    const usdMonthly = subscription({ amount: 30, currency: 'USD' });

    expect(calculateSubscriptionCost(usdMonthly, context).monthlyGross).toBe(1000);
  });
});
