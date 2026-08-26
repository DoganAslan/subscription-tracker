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

const invalidRateCases: Array<[string, SubscriptionCostContext['rates'], string, string]> = [
  ['a missing source rate', { TRY: 1, USD: 0.03, EUR: 0.027 }, 'GBP', 'TRY'],
  ['a zero source rate', { TRY: 1, USD: 0, EUR: 0.027 }, 'USD', 'TRY'],
  ['a NaN source rate', { TRY: 1, USD: Number.NaN, EUR: 0.027 }, 'USD', 'TRY'],
  ['an infinite source rate', { TRY: 1, USD: Number.POSITIVE_INFINITY, EUR: 0.027 }, 'USD', 'TRY'],
  ['a missing target rate', { TRY: 1, USD: 0.03, EUR: 0.027 }, 'TRY', 'GBP'],
  ['a zero target rate', { TRY: 1, USD: 0.03, EUR: 0 }, 'TRY', 'EUR'],
  ['a NaN target rate', { TRY: 1, USD: 0.03, EUR: Number.NaN }, 'TRY', 'EUR'],
  ['an infinite target rate', { TRY: 1, USD: 0.03, EUR: Number.POSITIVE_INFINITY }, 'TRY', 'EUR'],
];

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

  it('defers fractional currency-conversion rounding until weekly monthly normalization', () => {
    const fractionalWeekly = subscription({ amount: 0.03015, currency: 'USD', billingCycle: 'weekly' });

    expect(calculateSubscriptionCost(fractionalWeekly, context)).toEqual({
      billingGross: 1.01,
      monthlyGross: 4.36,
      monthlyRecovered: 0,
      monthlyNet: 4.36,
    });
  });

  it('defers fractional split-recovery rounding until public fields are returned', () => {
    const fractionalSplitWeekly = subscription({
      amount: 0.0603,
      currency: 'USD',
      billingCycle: 'weekly',
      isSplit: true,
      splitMembers: [{ id: 'member-1', name: 'Alex', phone: '905555555555', shareAmount: 0.03015, isPaid: true }],
    });

    expect(calculateSubscriptionCost(fractionalSplitWeekly, context)).toEqual({
      billingGross: 2.01,
      monthlyGross: 8.71,
      monthlyRecovered: 4.36,
      monthlyNet: 4.36,
    });
  });

  it.each(invalidRateCases)('uses the original finite amount with %s', (_description, rates, currency, baseCurrency) => {
    const fallbackContext: SubscriptionCostContext = { baseCurrency, rates };

    expect(calculateSubscriptionCost(subscription({ amount: 12.5, currency }), fallbackContext)).toEqual({
      billingGross: 12.5,
      monthlyGross: 12.5,
      monthlyRecovered: 0,
      monthlyNet: 12.5,
    });
  });
});
