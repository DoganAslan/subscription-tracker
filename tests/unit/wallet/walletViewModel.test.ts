import { buildWalletViewModel } from '@/features/wallet/hooks/useWalletViewModel';
import type { Card, Subscription } from '@/services/firebase/types';

const timestamp = (date: Date): Subscription['renewalDate'] => ({ toDate: () => new Date(date), toMillis: () => date.getTime() }) as Subscription['renewalDate'];
const card = (overrides: Partial<Card> = {}): Card => ({
  id: 'card', userId: 'user', name: 'Main card', type: 'visa', expiryMonth: 12, expiryYear: 2030,
  monthlyLimit: 1000, color: '#2563EB', currency: 'TRY', createdAt: timestamp(new Date()) as Card['createdAt'], updatedAt: timestamp(new Date()) as Card['updatedAt'], ...overrides,
});
const subscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'subscription', name: 'Service', category: 'Software', amount: 120, currency: 'TRY', billingCycle: 'monthly',
  renewalDate: timestamp(new Date(2026, 8, 10)), notes: null, createdAt: timestamp(new Date()), updatedAt: timestamp(new Date()), ...overrides,
});
const rates = { TRY: 1, USD: 0.03, EUR: 0.027 };

describe('buildWalletViewModel', () => {
  it('links canonical and legacy card assignments while excluding paused subscriptions', () => {
    const result = buildWalletViewModel({
      cards: [card()],
      subscriptions: [
        subscription({ id: 'canonical', cardId: 'card' }),
        subscription({ id: 'legacy', cardId: undefined, assignedCardId: 'card' }),
        subscription({ id: 'paused', cardId: 'card', status: 'paused' }),
        subscription({ id: 'legacy-paused', cardId: 'card', isPaused: true }),
      ],
      baseCurrency: 'TRY', rates,
    });

    expect(result.linkedSubscriptionCount).toBe(2);
    expect(result.cardSummaries[0].linkedSubscriptions.map(item => item.id)).toEqual(['canonical', 'legacy']);
  });

  it('normalizes billing cycles and currencies into a monthly card commitment', () => {
    const result = buildWalletViewModel({
      cards: [card({ monthlyLimit: 500 })],
      subscriptions: [
        subscription({ id: 'monthly', cardId: 'card', amount: 100 }),
        subscription({ id: 'yearly-usd', cardId: 'card', amount: 36, currency: 'USD', billingCycle: 'yearly' }),
      ],
      baseCurrency: 'TRY', rates,
    });

    expect(result.cardSummaries[0].monthlyCommitment).toBe(200);
    expect(result.cardSummaries[0].limitUsagePercent).toBe(40);
    expect(result.cardSummaries[0].isOverLimit).toBe(false);
  });

  it('reports over-limit cards and leaves cards without a limit unscored', () => {
    const result = buildWalletViewModel({
      cards: [card({ id: 'limited', monthlyLimit: 50 }), card({ id: 'unlimited', monthlyLimit: undefined })],
      subscriptions: [subscription({ cardId: 'limited', amount: 80 })],
      baseCurrency: 'TRY', rates,
    });

    expect(result.cardSummaries[0]).toMatchObject({ limitUsagePercent: 160, isOverLimit: true });
    expect(result.cardSummaries[1]).toMatchObject({ limitUsagePercent: null, isOverLimit: false });
  });
});
