import { describe, expect, it } from '@jest/globals';
import {
  getNextRenewal,
  getRenewalsInRange,
  parseSubscriptionDate,
  type RecurringSubscription,
} from '@/domain/subscriptions/recurrence';

const localNoon = (year: number, month: number, day: number): Date => new Date(year, month - 1, day, 12);

const expectLocalDate = (actual: Date | null, year: number, month: number, day: number): void => {
  expect(actual).not.toBeNull();
  expect(actual?.getFullYear()).toBe(year);
  expect(actual?.getMonth()).toBe(month - 1);
  expect(actual?.getDate()).toBe(day);
  expect(actual?.getHours()).toBe(0);
};

const subscription = (overrides: Partial<RecurringSubscription> = {}): RecurringSubscription => ({
  billingCycle: 'monthly',
  renewalDate: localNoon(2027, 1, 31),
  ...overrides,
});

describe('parseSubscriptionDate', () => {
  it('clones supported dates and rejects invalid values', () => {
    const date = localNoon(2027, 1, 31);
    const parsed = parseSubscriptionDate(date);

    expect(parsed).not.toBe(date);
    expectLocalDate(parsed, 2027, 1, 31);
    expectLocalDate(parseSubscriptionDate({ toDate: () => date }), 2027, 1, 31);
    expect(parseSubscriptionDate('not a date')).toBeNull();
  });
});

describe('getNextRenewal', () => {
  it.each([
    ['clamps a 31 January monthly anchor in a non-leap February', subscription(), localNoon(2027, 2, 1), [2027, 2, 28]],
    ['clamps a 31 January monthly anchor in a leap February', subscription({ renewalDate: localNoon(2028, 1, 31) }), localNoon(2028, 2, 1), [2028, 2, 29]],
    ['preserves a 30 November quarterly anchor through February', subscription({ billingCycle: 'quarterly', renewalDate: localNoon(2026, 11, 30) }), localNoon(2027, 2, 1), [2027, 2, 28]],
    ['jumps a weekly recurrence to the first date on or after the reference date', subscription({ billingCycle: 'weekly', renewalDate: localNoon(2020, 1, 1) }), localNoon(2026, 8, 26), [2026, 8, 26]],
    ['jumps a biennial recurrence to the first date on or after the reference date', subscription({ billingCycle: 'biennially', renewalDate: localNoon(2000, 1, 1) }), localNoon(2026, 8, 26), [2028, 1, 1]],
  ])('%s', (_description, recurringSubscription, from, expected) => {
    expectLocalDate(getNextRenewal(recurringSubscription, from), expected[0], expected[1], expected[2]);
  });

  it('uses a future active trial end as the first renewal', () => {
    expectLocalDate(
      getNextRenewal(
        subscription({ isTrial: true, trialEndDate: localNoon(2027, 2, 14) }),
        localNoon(2027, 1, 31),
      ),
      2027,
      2,
      14,
    );
  });

  it('returns null for paused or invalid subscriptions', () => {
    expect(getNextRenewal(subscription({ isPaused: true }), localNoon(2027, 1, 1))).toBeNull();
    expect(getNextRenewal(subscription({ renewalDate: 'not a date' }), localNoon(2027, 1, 1))).toBeNull();
  });
});

describe('getRenewalsInRange', () => {
  it('returns an inclusive sequence while preserving the original monthly anchor day', () => {
    const renewals = getRenewalsInRange(subscription(), {
      start: localNoon(2027, 1, 1),
      end: localNoon(2027, 3, 31),
    });

    expect(renewals).toHaveLength(3);
    expectLocalDate(renewals[0], 2027, 1, 31);
    expectLocalDate(renewals[1], 2027, 2, 28);
    expectLocalDate(renewals[2], 2027, 3, 31);
  });

  it('returns an empty range for paused legacy subscriptions and invalid renewal dates', () => {
    const range = { start: localNoon(2027, 1, 1), end: localNoon(2027, 3, 31) };

    expect(getRenewalsInRange(subscription({ isPaused: true }), range)).toEqual([]);
    expect(getRenewalsInRange(subscription({ renewalDate: 'not a date' }), range)).toEqual([]);
  });
});
