import { describe, expect, it } from '@jest/globals';
import { Timestamp } from 'firebase/firestore';
import type { Subscription } from '@/services/firebase/types';
import type { SubscriptionFormData } from '@/features/subscriptions/schemas/subscription.schema';
import { projectSubscriptionBudget } from '@/features/subscriptions/components/subscription-form/hooks/useBudgetGuard';

const subscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'existing-subscription',
  name: 'Existing subscription',
  category: 'Entertainment',
  amount: 100,
  currency: 'TRY',
  billingCycle: 'monthly',
  renewalDate: Timestamp.fromDate(new Date('2026-09-01T00:00:00.000Z')),
  notes: null,
  createdAt: Timestamp.fromDate(new Date('2026-08-01T00:00:00.000Z')),
  updatedAt: Timestamp.fromDate(new Date('2026-08-01T00:00:00.000Z')),
  ...overrides,
});

const formData = (overrides: Partial<SubscriptionFormData> = {}): SubscriptionFormData => ({
  name: 'Candidate subscription',
  category: 'Entertainment',
  amount: 120,
  currency: 'TRY',
  billingCycle: 'monthly',
  renewalDate: new Date('2026-09-01T00:00:00.000Z'),
  status: 'active',
  reminderOffset: '1_day',
  isTrial: false,
  hasContract: false,
  notes: null,
  isSplit: false,
  splitMembers: [],
  priceHistory: [],
  ...overrides,
});

const context = {
  baseCurrency: 'TRY',
  rates: { TRY: 1, USD: 0.03, EUR: 0.027 },
};

describe('projectSubscriptionBudget', () => {
  it('uses canonical paused and split semantics for monthly gross and net totals', () => {
    const projection = projectSubscriptionBudget({
      subscriptions: [
        subscription({ id: 'paused', amount: 500, status: 'paused' }),
        subscription({
          id: 'split-yearly',
          amount: 1_200,
          billingCycle: 'yearly',
          isSplit: true,
          splitMembers: [{ id: 'ada', name: 'Ada', phone: '', shareAmount: 300, isPaid: false }],
        }),
      ],
      candidate: formData({
        amount: 120,
        isSplit: true,
        splitMembers: [
          { id: 'grace', name: 'Grace', phone: '', shareAmount: 20, isPaid: false },
          { id: 'invalid', name: 'Invalid', phone: '', shareAmount: '', isPaid: false },
        ],
      }),
      ...context,
    });

    expect(projection).toEqual({ monthlyGross: 220, monthlyNet: 175 });
  });

  it('replaces the edited subscription rather than counting it twice', () => {
    const projection = projectSubscriptionBudget({
      subscriptions: [
        subscription({ id: 'editing', amount: 100 }),
        subscription({ id: 'other', amount: 40 }),
      ],
      candidate: formData({ amount: 150 }),
      editingSubscriptionId: 'editing',
      ...context,
    });

    expect(projection).toEqual({ monthlyGross: 190, monthlyNet: 190 });
  });
});
