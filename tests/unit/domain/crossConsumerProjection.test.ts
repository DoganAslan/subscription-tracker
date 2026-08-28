import { describe, expect, it, jest } from '@jest/globals';
import { calculateFinancialAnalysis } from '@/features/analytics/utils/financialAnalytics';
import { calculateMetrics, getNextRenewalDate } from '@/features/dashboard/utils/calculations';
import { buildWidgetData } from '@/services/background/widgetData';
import { calculateMonthlyCosts } from '@/utils/calculations';
import type { Subscription } from '@/services/firebase/types';

const mockRates = { TRY: 1, USD: 0.03, EUR: 0.027 };

jest.mock('@/utils/currency', () => ({
  CURRENCY_RATES: { TRY: 1, USD: 0.03, EUR: 0.027 },
  convertCurrency: (amount: number, from: string, to: string) => {
    const rates: Record<string, number> = { TRY: 1, USD: 0.03, EUR: 0.027 };
    if (from === to) return amount;
    return (amount / (rates[from] || 1)) * (rates[to] || 1);
  },
}));

const subscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'projection-subscription',
  name: 'Projection service',
  category: 'Entertainment',
  amount: 1200,
  currency: 'TRY',
  billingCycle: 'yearly',
  renewalDate: { toDate: () => new Date('2026-10-15T12:00:00.000Z') } as Subscription['renewalDate'],
  notes: null,
  createdAt: {} as Subscription['createdAt'],
  updatedAt: {} as Subscription['updatedAt'],
  ...overrides,
});

const localDate = (year: number, month: number, day: number): Date => new Date(year, month - 1, day, 12);

const renewalDate = (date: Date): Subscription['renewalDate'] => ({
  toDate: () => new Date(date),
  toMillis: () => date.getTime(),
}) as Subscription['renewalDate'];

describe('cross-consumer subscription projections', () => {
  it.each<[billingCycle: 'biannually' | 'biennially', expectedGross: number]>([
    ['biannually', 200],
    ['biennially', 50],
  ])('uses the canonical %s factor through the compatibility helper', (billingCycle, expectedGross) => {
    expect(calculateMonthlyCosts({ amount: 1200, currency: 'TRY', billingCycle }, 'TRY').gross).toBe(expectedGross);
  });

  it('uses legacy price when compatibility input has no amount', () => {
    expect(calculateMonthlyCosts({ price: 1200, currency: 'TRY', billingCycle: 'yearly' }, 'TRY')).toEqual({
      gross: 100,
      net: 100,
    });
  });

  it('does not count a legacy-paused subscription as dashboard-active', () => {
    const legacyPaused = subscription({ isPaused: true });

    expect(calculateMetrics([legacyPaused], 'TRY').activeCount).toBe(0);
  });

  it('credits a trial ending today consistently with inclusive recurrence semantics', () => {
    jest.useFakeTimers().setSystemTime(localDate(2026, 8, 27));
    const endingToday = subscription({
      amount: 120,
      billingCycle: 'monthly',
      isTrial: true,
      trialEndDate: renewalDate(localDate(2026, 8, 27)),
      renewalDate: renewalDate(localDate(2026, 10, 15)),
    });

    try {
      const dashboard = calculateMetrics([endingToday], 'TRY');
      const analytics = calculateFinancialAnalysis([endingToday], 'TRY', null, localDate(2026, 8, 27));

      expect(dashboard.monthlyNetTotal).toBe(0);
      expect(analytics.currentMonthlyCost).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('characterizes legacy pause, free-trial, and assigned-card normalization in analytics', () => {
    const legacyPaused = subscription({ isPaused: true });
    const legacyFreeTrial = subscription({
      id: 'legacy-free-trial',
      isFreeTrial: true,
      trialEndDate: renewalDate(localDate(2026, 9, 15)),
      cardId: null,
      assignedCardId: 'legacy-card',
    });
    const result = calculateFinancialAnalysis(
      [legacyPaused, legacyFreeTrial],
      'TRY',
      null,
      localDate(2026, 8, 27),
    );

    expect(result.activeCount).toBe(1);
    expect(result.monthlyTrialCredit).toBe(100);
    expect(result.unassignedPaymentCount).toBe(0);
  });

  it('characterizes split recovery in billing and monthly units', () => {
    const splitYearly = subscription({
      amount: 1200,
      billingCycle: 'yearly',
      renewalDate: renewalDate(localDate(2026, 8, 28)),
      isSplit: true,
      splitMembers: [{ id: 'friend', name: 'Friend', phone: '905555555555', shareAmount: 300, isPaid: false }],
    });
    const result = calculateFinancialAnalysis([splitYearly], 'TRY', null, localDate(2026, 8, 27));

    expect(result.monthlyGross).toBe(100);
    expect(result.monthlyRecoverable).toBe(25);
    expect(result.monthlyCommitment).toBe(75);
    expect(result.upcomingPayments[0]?.amount).toBe(900);
  });

  it('characterizes deterministic dashboard recurrence through the domain adapter', () => {
    const next = getNextRenewalDate(
      localDate(2026, 1, 31),
      'monthly',
      localDate(2026, 2, 1),
    );

    expect(next).toEqual(new Date(2026, 1, 28));
  });

  it('characterizes six-month cash flow occurrence boundaries', () => {
    const monthly = subscription({
      amount: 120,
      billingCycle: 'monthly',
      renewalDate: renewalDate(localDate(2026, 8, 31)),
    });
    const result = calculateFinancialAnalysis([monthly], 'TRY', null, localDate(2026, 8, 23));

    expect(result.cashFlow.map(month => month.amount)).toEqual([120, 120, 120, 120, 120, 120]);
  });

  it('keeps analytics and widget monthly totals aligned for a yearly subscription', () => {
    const sharedSubscription = subscription();
    const analytics = calculateFinancialAnalysis([sharedSubscription], 'TRY', null, new Date('2026-08-23T12:00:00.000Z'));
    const widget = buildWidgetData({
      subscriptions: [sharedSubscription],
      baseCurrency: 'TRY',
      currencySymbol: '₺',
      isTurkish: true,
      now: new Date('2026-08-23T12:00:00.000Z'),
      rates: mockRates,
    });

    expect(analytics.monthlyGross).toBe(100);
    expect(widget.monthlyTotal).toBe('₺100.00');
  });

  it('uses canonical legacy price-only billing for monthly, upcoming, and cash-flow projections', () => {
    const legacyPriceOnly = {
      ...subscription({
        billingCycle: 'yearly',
        renewalDate: renewalDate(localDate(2026, 8, 28)),
      }),
      amount: undefined,
      price: 1200,
    } as unknown as Subscription;
    const result = calculateFinancialAnalysis([legacyPriceOnly], 'TRY', null, localDate(2026, 8, 27));

    expect(result.monthlyCommitment).toBe(100);
    expect(result.upcomingPayments.map(payment => payment.amount)).toEqual([1200]);
    expect(result.cashFlow.map(month => month.amount)).toEqual([1200, 0, 0, 0, 0, 0]);
  });

  it('uses canonical missing-target-rate fallback for monthly, upcoming, and cash-flow projections', () => {
    const missingRate = subscription({
      amount: 30,
      currency: 'USD',
      billingCycle: 'monthly',
      renewalDate: renewalDate(localDate(2026, 8, 28)),
    });
    const result = calculateFinancialAnalysis([missingRate], 'XYZ', null, localDate(2026, 8, 27));

    expect(result.monthlyCommitment).toBe(30);
    expect(result.upcomingPayments[0]?.amount).toBe(30);
    expect(result.cashFlow.map(month => month.amount)).toEqual([30, 30, 30, 30, 30, 30]);
  });
});
