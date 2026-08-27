import { describe, expect, it } from '@jest/globals';
import { QueryClient } from '@tanstack/react-query';
import type { Subscription } from '@/services/firebase/types';
import {
  addCachedSubscription,
  removeCachedSubscription,
  updateCachedSubscription,
} from '@/features/subscriptions/application/subscriptionCacheUpdates';
import { subscriptionKeys } from '@/features/subscriptions/application/subscriptionKeys';

const subscription = (id: string, overrides: Partial<Subscription> = {}): Subscription => ({
  id,
  name: `${id} subscription`,
  category: 'Entertainment',
  amount: 100,
  currency: 'TRY',
  billingCycle: 'monthly',
  renewalDate: {} as Subscription['renewalDate'],
  notes: null,
  createdAt: {} as Subscription['createdAt'],
  updatedAt: {} as Subscription['updatedAt'],
  ...overrides,
});

describe('subscription cache updates', () => {
  it('adds a subscription without dropping an existing frozen subscription', () => {
    const existing = subscription('existing');
    const incoming = subscription('incoming');
    const current = Object.freeze([existing]) as unknown as Subscription[];

    const result = addCachedSubscription(current, incoming);

    expect(result).toEqual([existing, incoming]);
    expect(result).not.toBe(current);
    expect(result[0]).toBe(existing);
    expect(current).toEqual([existing]);
  });

  it('updates only the matching subscription without mutating frozen cache data', () => {
    const unchanged = subscription('unchanged');
    const target = subscription('target', { amount: 100, notes: 'before' });
    const current = Object.freeze([unchanged, target]) as unknown as Subscription[];

    const result = updateCachedSubscription(current, 'target', { amount: 250, notes: 'after' });

    expect(result).toEqual([
      unchanged,
      { ...target, amount: 250, notes: 'after' },
    ]);
    expect(result[0]).toBe(unchanged);
    expect(result[1]).not.toBe(target);
    expect(target).toMatchObject({ amount: 100, notes: 'before' });
  });

  it('removes only the matching subscription from a frozen cache list', () => {
    const retained = subscription('retained');
    const removed = subscription('removed');
    const current = Object.freeze([retained, removed]) as unknown as Subscription[];

    const result = removeCachedSubscription(current, 'removed');

    expect(result).toEqual([retained]);
    expect(result).not.toBe(current);
    expect(result[0]).toBe(retained);
    expect(current).toEqual([retained, removed]);
  });

  it('applies pause fields only to the matching subscription', () => {
    const active = subscription('active', { status: 'active' });
    const target = subscription('target', { status: 'active', pauseEndDate: null });
    const pauseEndDate = '2026-09-01T12:00:00.000Z';
    const current = Object.freeze([active, target]) as unknown as Subscription[];

    const result = updateCachedSubscription(current, 'target', { status: 'paused', pauseEndDate });

    expect(result).toEqual([
      active,
      { ...target, status: 'paused', pauseEndDate },
    ]);
    expect(result[0]).toBe(active);
    expect(target).toMatchObject({ status: 'active', pauseEndDate: null });
  });

  it('lets a later Firestore snapshot replace an optimistic cache list', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
    const key = subscriptionKeys.list('user-1');
    const cached = [subscription('existing')];
    const optimistic = addCachedSubscription(cached, subscription('optimistic'));
    const serverSnapshot = [subscription('existing', { amount: 125 })];

    queryClient.setQueryData(key, optimistic);
    queryClient.setQueryData(key, serverSnapshot);

    expect(queryClient.getQueryData<Subscription[]>(key)).toEqual(serverSnapshot);
  });
});
