import { describe, expect, it } from '@jest/globals';
import type { Subscription } from '@/services/firebase/types';
import {
  SUBSCRIPTION_CATEGORIES,
  SUBSCRIPTION_NAME_MAX_LENGTH,
  subscriptionSchema,
  type SubscriptionFormInput,
} from '@/features/subscriptions/schemas/subscription.schema';
import {
  normalizeSubscriptionNameInput,
  SUBSCRIPTION_CATEGORY_OPTIONS,
} from '@/features/subscriptions/components/subscription-form/constants';
import { createSubscriptionFormDefaults } from '@/features/subscriptions/components/subscription-form/formDefaults';

const validInput: SubscriptionFormInput = {
  name: 'Netflix',
  category: 'Entertainment',
  amount: '19.99',
  billingCycle: 'monthly',
  renewalDate: new Date('2026-09-15T00:00:00.000Z'),
};

const subscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'subscription-1',
  name: 'Netflix',
  category: 'Entertainment',
  amount: 19.99,
  currency: 'USD',
  billingCycle: 'monthly',
  renewalDate: { toDate: () => new Date('2026-09-15T00:00:00.000Z') } as Subscription['renewalDate'],
  notes: null,
  createdAt: {} as Subscription['createdAt'],
  updatedAt: {} as Subscription['updatedAt'],
  ...overrides,
});

describe('subscription form model', () => {
  it('creates complete independent defaults for a new subscription', () => {
    const firstDefaults = createSubscriptionFormDefaults();
    const secondDefaults = createSubscriptionFormDefaults();

    expect(firstDefaults).toMatchObject({
      id: undefined,
      name: '',
      category: '',
      amount: 0,
      currency: 'USD',
      billingCycle: 'monthly',
      status: 'active',
      pauseEndDate: null,
      reminderOffset: '1_day',
      isTrial: false,
      hasContract: false,
      notes: '',
      cardId: null,
      isSplit: false,
      splitMembers: [],
      priceHistory: [],
    });
    expect(firstDefaults.renewalDate).toBeInstanceOf(Date);
    expect(firstDefaults.trialEndDate).toBeInstanceOf(Date);
    expect(firstDefaults.contractEndDate).toBeInstanceOf(Date);
    expect(firstDefaults.renewalDate).not.toBe(firstDefaults.trialEndDate);
    expect(firstDefaults.splitMembers).not.toBe(secondDefaults.splitMembers);
    expect(firstDefaults.priceHistory).not.toBe(secondDefaults.priceHistory);
  });

  it('preserves edit identity while isolating mutable edit arrays', () => {
    const initialData = subscription({
      splitMembers: [{ id: 'member-1', name: 'Ada', phone: '5551234', shareAmount: 9.99, isPaid: false }],
      priceHistory: [{ amount: 17.99, date: '2026-08-01' }],
    });

    const defaults = createSubscriptionFormDefaults(initialData);
    defaults.splitMembers[0].name = 'Grace';
    defaults.priceHistory[0].amount = 18.99;

    expect(defaults.id).toBe('subscription-1');
    expect(defaults.splitMembers).not.toBe(initialData.splitMembers);
    expect(defaults.priceHistory).not.toBe(initialData.priceHistory);
    expect(initialData.splitMembers?.[0].name).toBe('Ada');
    expect(initialData.priceHistory?.[0].amount).toBe(17.99);
  });

  it('derives category option values from the schema category tuple', () => {
    expect(SUBSCRIPTION_CATEGORY_OPTIONS.map((option) => option.value)).toEqual([...SUBSCRIPTION_CATEGORIES]);
  });

  it('uses the shared 100-character name boundary with sanitizer truncation', () => {
    const longName = 'n'.repeat(SUBSCRIPTION_NAME_MAX_LENGTH + 1);

    expect(subscriptionSchema.parse({ ...validInput, name: longName }).name).toBe('n'.repeat(100));
  });

  it('normalizes manual name entry at the shared 100-character boundary', () => {
    const longName = 'n'.repeat(SUBSCRIPTION_NAME_MAX_LENGTH + 1);

    expect(normalizeSubscriptionNameInput(longName)).toBe('n'.repeat(100));
  });

  it('coerces string amounts to numeric form output', () => {
    expect(subscriptionSchema.parse(validInput).amount).toBe(19.99);
  });
});
