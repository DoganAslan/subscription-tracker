import { buildCalendarViewModel } from '@/features/calendar/utils/calendarViewModel';
import type { BillingCycle, Subscription } from '@/services/firebase/types';

const localDate = (year: number, month: number, day: number): Date => new Date(year, month - 1, day, 12);

const timestamp = (date: Date): Subscription['renewalDate'] => ({
  toDate: () => new Date(date),
  toMillis: () => date.getTime(),
}) as Subscription['renewalDate'];

const subscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'subscription',
  name: 'Service',
  category: 'Entertainment',
  amount: 120,
  currency: 'TRY',
  billingCycle: 'monthly',
  renewalDate: timestamp(localDate(2026, 1, 31)),
  notes: null,
  createdAt: timestamp(localDate(2026, 1, 1)),
  updatedAt: timestamp(localDate(2026, 1, 1)),
  ...overrides,
});

const rates = { TRY: 1, USD: 0.03, EUR: 0.027 };

describe('buildCalendarViewModel', () => {
  it.each([
    [localDate(2026, 2, 1), 28],
    [localDate(2028, 2, 1), 29],
  ])('clamps a January 31 monthly renewal in %s to day %s', (selectedDate, expectedDay) => {
    const result = buildCalendarViewModel({
      subscriptions: [subscription()],
      selectedDate,
      baseCurrency: 'TRY',
      rates,
    });

    expect(result.paymentCountByDay.get(expectedDay)).toBe(1);
  });

  it('returns every weekly occurrence and charges each occurrence in the displayed month', () => {
    const weekly = subscription({
      id: 'weekly',
      amount: 70,
      billingCycle: 'weekly',
      renewalDate: timestamp(localDate(2026, 8, 3)),
    });

    const result = buildCalendarViewModel({
      subscriptions: [weekly],
      selectedDate: localDate(2026, 8, 10),
      baseCurrency: 'TRY',
      rates,
    });

    expect([...result.paymentCountByDay.keys()]).toEqual([3, 10, 17, 24, 31]);
    expect(result.monthlyTotal).toBe(350);
    expect(result.dailyPayments.map(payment => payment.subscription.id)).toEqual(['weekly']);
  });

  it.each<[BillingCycle, number, boolean]>([
    ['quarterly', 3, true],
    ['biannually', 6, true],
    ['yearly', 12, true],
    ['biennially', 24, true],
    ['quarterly', 4, false],
    ['biannually', 7, false],
    ['yearly', 13, false],
    ['biennially', 25, false],
  ])('projects %s month offset %s correctly', (billingCycle, monthOffset, isDue) => {
    const selectedDate = localDate(2026, 1 + monthOffset, 15);
    const result = buildCalendarViewModel({
      subscriptions: [subscription({ billingCycle, renewalDate: timestamp(localDate(2026, 1, 15)) })],
      selectedDate,
      baseCurrency: 'TRY',
      rates,
    });

    expect(result.paymentCountByDay.has(15)).toBe(isDue);
  });

  it('excludes canonical and legacy paused records from totals, days, and active count', () => {
    const result = buildCalendarViewModel({
      subscriptions: [
        subscription({ id: 'active', amount: 100, renewalDate: timestamp(localDate(2026, 8, 12)) }),
        subscription({ id: 'paused', amount: 500, status: 'paused', renewalDate: timestamp(localDate(2026, 8, 12)) }),
        subscription({ id: 'legacy-paused', amount: 500, isPaused: true, renewalDate: timestamp(localDate(2026, 8, 12)) }),
      ],
      selectedDate: localDate(2026, 8, 12),
      baseCurrency: 'TRY',
      rates,
    });

    expect(result.activeCount).toBe(1);
    expect(result.paymentCountByDay.get(12)).toBe(1);
    expect(result.monthlyTotal).toBe(100);
    expect(result.dailyPayments.map(payment => payment.subscription.id)).toEqual(['active']);
  });

  it('uses injected rates for the selected day payment and monthly total', () => {
    const result = buildCalendarViewModel({
      subscriptions: [subscription({ amount: 30, currency: 'USD', renewalDate: timestamp(localDate(2026, 8, 18)) })],
      selectedDate: localDate(2026, 8, 18),
      baseCurrency: 'TRY',
      rates,
    });

    expect(result.monthlyTotal).toBe(1000);
    expect(result.dailyPayments[0]?.amountInBaseCurrency).toBe(1000);
  });

  it('builds a Monday-first grid for the displayed month', () => {
    const result = buildCalendarViewModel({
      subscriptions: [],
      selectedDate: localDate(2026, 8, 1),
      baseCurrency: 'TRY',
      rates,
    });

    expect(result.calendarDays.slice(0, 6)).toEqual([null, null, null, null, null, 1]);
    expect(result.calendarDays.at(-1)).toBe(31);
  });
});
