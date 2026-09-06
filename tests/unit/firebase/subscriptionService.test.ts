import { describe, expect, it, jest } from '@jest/globals';
import { SubscriptionService } from '@/services/firebase/firestore';

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(async () => ({ id: 'subscription-1' })),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => 'server-timestamp'),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock('@/services/firebase/config', () => ({ db: {} }));
jest.mock('@/services/firebase/collections', () => ({
  getCardsCollection: jest.fn(),
  getCardDoc: jest.fn(),
  getSubscriptionDoc: jest.fn(),
  getSubscriptionsCollection: jest.fn(() => 'subscriptions'),
}));

const mockAddDoc = (jest.requireMock('firebase/firestore') as { addDoc: jest.Mock }).addDoc;

describe('SubscriptionService.addSubscription', () => {
  it('omits empty optional usage history instead of sending an invalid null value', async () => {
    await SubscriptionService.addSubscription('user-1', {
      name: 'Streaming service',
      category: 'Entertainment',
      amount: 19.99,
      currency: 'TRY',
      billingCycle: 'monthly',
      renewalDate: new Date('2026-09-01') as never,
      notes: '',
      usageLogDates: undefined,
    });

    const firestorePayload = mockAddDoc.mock.calls[0][1] as Record<string, unknown>;

    expect(firestorePayload).not.toHaveProperty('usageLogDates');
  });
});
