import type { Subscription } from '@/services/firebase/types';

export function addCachedSubscription(
  current: Subscription[] | undefined,
  item: Subscription,
): Subscription[] {
  return [...(current ?? []), item];
}

export function updateCachedSubscription(
  current: Subscription[] | undefined,
  id: string,
  patch: Partial<Subscription>,
): Subscription[] {
  return (current ?? []).map(subscription =>
    subscription.id === id ? { ...subscription, ...patch } : subscription,
  );
}

export function removeCachedSubscription(
  current: Subscription[] | undefined,
  id: string,
): Subscription[] {
  return (current ?? []).filter(subscription => subscription.id !== id);
}
