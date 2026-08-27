import { describe, expect, it, jest } from '@jest/globals';
import { calculateFinancialAnalysis } from '@/features/analytics/utils/financialAnalytics';
import { buildWidgetData } from '@/services/background/widgetData';
import { calculateMonthlyCosts } from '@/utils/calculations';
import type { Subscription } from '@/services/firebase/types';

const mockRates = { TRY: 1, USD: 0.03, EUR: 0.027 };

jest.mock('@/utils/currency', () => ({
  CURRENCY_RATES: mockRates,
  convertCurrency: (amount: number) => amount,
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

describe('cross-consumer subscription projections', () => {
  it('uses canonical biannual and biennial factors through the compatibility helper', () => {
    expect(calculateMonthlyCosts({ amount: 1200, currency: 'TRY', billingCycle: 'biannually' }, 'TRY').gross).toBe(200);
    expect(calculateMonthlyCosts({ amount: 1200, currency: 'TRY', billingCycle: 'biennially' }, 'TRY').gross).toBe(50);
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
});
