import { buildFinancialAnalysisViewModel } from '@/features/analytics/hooks/useFinancialAnalysisViewModel';
import type { Subscription } from '@/services/firebase/types';

const localDate = (year: number, month: number, day: number, hour = 12): Date => new Date(year, month - 1, day, hour);
const timestamp = (date: Date): Subscription['renewalDate'] => ({
  toDate: () => new Date(date),
  toMillis: () => date.getTime(),
}) as Subscription['renewalDate'];

const subscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'subscription',
  name: 'Streaming Service',
  category: 'Entertainment',
  amount: 120,
  currency: 'TRY',
  billingCycle: 'monthly',
  renewalDate: timestamp(localDate(2026, 9, 10)),
  notes: null,
  createdAt: timestamp(localDate(2026, 1, 1)),
  updatedAt: timestamp(localDate(2026, 1, 1)),
  ...overrides,
});

const now = localDate(2026, 8, 29);
const rates = { TRY: 1, USD: 0.03, EUR: 0.027 };

describe('buildFinancialAnalysisViewModel', () => {
  it('uses injected exchange rates and updates when the subscription input changes', () => {
    const first = buildFinancialAnalysisViewModel({
      subscriptions: [subscription({ amount: 12, currency: 'USD' })],
      baseCurrency: 'TRY',
      monthlyBudget: null,
      language: 'tr',
      rates,
      now,
    });
    const updated = buildFinancialAnalysisViewModel({
      subscriptions: [subscription({ amount: 18, currency: 'USD' }), subscription({ id: 'second' })],
      baseCurrency: 'TRY',
      monthlyBudget: null,
      language: 'tr',
      rates,
      now,
    });

    expect(first.analysis.monthlyCommitment).toBe(400);
    expect(updated.analysis.monthlyCommitment).toBe(720);
    expect(updated.analysis.activeCount).toBe(2);
  });

  it('provides Turkish and English formatter/content parity from the same analysis', () => {
    const input = {
      subscriptions: [subscription()],
      baseCurrency: 'TRY',
      monthlyBudget: 500,
      rates,
      now,
    } as const;
    const turkish = buildFinancialAnalysisViewModel({ ...input, language: 'tr' });
    const english = buildFinancialAnalysisViewModel({ ...input, language: 'en' });

    expect(turkish.analysis).toEqual(english.analysis);
    expect(turkish.formatMoney(1234.5)).not.toBe(english.formatMoney(1234.5));
    expect(turkish.insights.map(item => item.title)).not.toEqual(english.insights.map(item => item.title));
  });

  it('orders high-impact insights first and limits the visible list', () => {
    const result = buildFinancialAnalysisViewModel({
      subscriptions: [
        subscription({
          id: 'trial',
          amount: 700,
          isTrial: true,
          trialEndDate: timestamp(localDate(2026, 9, 2)),
          usageFrequency: 'low',
        }),
        subscription({ id: 'duplicate', amount: 600, usageFrequency: 'none' }),
        subscription({ id: 'foreign', amount: 20, currency: 'USD', category: 'Software' }),
      ],
      baseCurrency: 'TRY',
      monthlyBudget: 500,
      language: 'en',
      rates,
      now,
    });

    expect(result.insights).toHaveLength(4);
    expect(result.insights[0].kind).toBe('budget');
    expect(result.insights.map(item => item.kind)).toContain('trial');
  });

  it('returns the selected cash-flow month and its actual payments', () => {
    const result = buildFinancialAnalysisViewModel({
      subscriptions: [subscription({ renewalDate: timestamp(localDate(2026, 9, 10)) })],
      baseCurrency: 'TRY',
      monthlyBudget: null,
      language: 'tr',
      rates,
      now,
    });
    const september = result.analysis.cashFlow.find(month => month.key === '2026-09');

    expect(result.getCashFlowMonth('missing')).toBeNull();
    expect(result.getCashFlowMonth('2026-09')).toBe(september);
    expect(september?.payments.map(payment => payment.subscription.id)).toEqual(['subscription']);
  });
});
