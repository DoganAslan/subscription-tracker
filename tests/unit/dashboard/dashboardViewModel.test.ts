import { buildDashboardViewModel } from '@/features/dashboard/utils/dashboardViewModel';
import type { Subscription } from '@/services/firebase/types';

const localDate = (year: number, month: number, day: number, hour = 12): Date => (
  new Date(year, month - 1, day, hour)
);

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

const rates = { TRY: 1, USD: 0.03, EUR: 0.027 };
const now = localDate(2026, 8, 28);

describe('buildDashboardViewModel', () => {
  it('returns the next five active subscriptions in actual renewal order', () => {
    const subscriptions = [
      subscription({ id: 'late', renewalDate: timestamp(localDate(2026, 9, 20)) }),
      subscription({ id: 'paused', status: 'paused', renewalDate: timestamp(localDate(2026, 8, 29)) }),
      subscription({ id: 'legacy-paused', isPaused: true, renewalDate: timestamp(localDate(2026, 8, 30)) }),
      subscription({ id: 'first', renewalDate: timestamp(localDate(2026, 9, 1)) }),
      subscription({ id: 'second', renewalDate: timestamp(localDate(2026, 9, 2)) }),
      subscription({ id: 'third', renewalDate: timestamp(localDate(2026, 9, 3)) }),
      subscription({ id: 'fourth', renewalDate: timestamp(localDate(2026, 9, 4)) }),
      subscription({ id: 'fifth', renewalDate: timestamp(localDate(2026, 9, 5)) }),
      subscription({ id: 'sixth', renewalDate: timestamp(localDate(2026, 9, 6)) }),
    ];

    const result = buildDashboardViewModel({ subscriptions, query: '', baseCurrency: 'TRY', rates, now });

    expect(result.isSearching).toBe(false);
    expect(result.listSubscriptions.map(item => item.id)).toEqual(['first', 'second', 'third', 'fourth', 'fifth']);
  });

  it.each([
    ['name', 'video'],
    ['category', 'productivity'],
    ['notes', 'family'],
    ['amount', '249.9'],
    ['currency', 'usd'],
    ['billing cycle', 'yearly'],
  ])('matches a normalized query against %s', (_field, query) => {
    const matching = subscription({
      id: 'matching',
      name: 'Prime Video',
      category: 'Productivity',
      notes: 'Family plan',
      amount: 249.9,
      currency: 'USD',
      billingCycle: 'yearly',
    });
    const unrelated = subscription({ id: 'unrelated', name: 'Music', category: 'Audio', notes: null, amount: 50 });

    const result = buildDashboardViewModel({
      subscriptions: [unrelated, matching],
      query: `  ${query.toUpperCase()}  `,
      baseCurrency: 'TRY',
      rates,
      now,
    });

    expect(result.isSearching).toBe(true);
    expect(result.listSubscriptions.map(item => item.id)).toEqual(['matching']);
  });

  it('projects monthly totals and category breakdown with injected rates', () => {
    const subscriptions = [
      subscription({ id: 'monthly', amount: 120, category: 'Entertainment' }),
      subscription({ id: 'yearly-usd', amount: 36, currency: 'USD', billingCycle: 'yearly', category: 'Software' }),
      subscription({ id: 'paused', amount: 9999, status: 'paused', category: 'Ignored' }),
    ];

    const result = buildDashboardViewModel({ subscriptions, query: '', baseCurrency: 'TRY', rates, now });

    expect(result.monthlyTotal).toBe(220);
    expect(result.categoryBreakdown).toEqual([
      { category: 'Entertainment', amount: 120, percentage: 120 / 220 * 100 },
      { category: 'Software', amount: 100, percentage: 100 / 220 * 100 },
    ]);
  });

  it('keeps an active subscription in totals when its renewal date is invalid', () => {
    const invalidRenewal = subscription({
      id: 'invalid-renewal',
      amount: 75,
      renewalDate: {} as Subscription['renewalDate'],
    });

    const result = buildDashboardViewModel({
      subscriptions: [invalidRenewal],
      query: '',
      baseCurrency: 'TRY',
      rates,
      now,
    });

    expect(result.monthlyTotal).toBe(75);
    expect(result.upcomingSubscriptions).toEqual([]);
  });

  it('returns only actionable contract and trial alerts at the injected time', () => {
    const subscriptions = [
      subscription({ id: 'critical', name: 'Critical', contractEndDate: localDate(2026, 9, 2) }),
      subscription({ id: 'warning', name: 'Warning', contractEndDate: localDate(2026, 9, 20) }),
      subscription({ id: 'safe', contractEndDate: localDate(2026, 11, 1) }),
      subscription({ id: 'trial-soon', isTrial: true, trialEndDate: timestamp(localDate(2026, 8, 30)) }),
      subscription({ id: 'trial-later', isTrial: true, trialEndDate: timestamp(localDate(2026, 9, 10)) }),
      subscription({ id: 'legacy-trial', isFreeTrial: true, trialEndDate: timestamp(localDate(2026, 8, 29)) }),
    ];

    const result = buildDashboardViewModel({ subscriptions, query: '', baseCurrency: 'TRY', rates, now });

    expect(result.contractAlerts).toEqual([
      { subscriptionId: 'critical', subscriptionName: 'Critical', daysLeft: 5, severity: 'critical' },
      { subscriptionId: 'warning', subscriptionName: 'Warning', daysLeft: 23, severity: 'warning' },
    ]);
    expect(result.trialAlerts.map(item => item.id)).toEqual(['legacy-trial', 'trial-soon']);
  });
});
