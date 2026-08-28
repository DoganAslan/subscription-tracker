import { useState } from 'react';
import { useUpdateSubscription } from '@/features/subscriptions/hooks/useSubscriptions';
import type { Subscription } from '@/services/firebase/types';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export function useUsageActions(nowFactory: () => Date = () => new Date()) {
  const [updatingUsageId, setUpdatingUsageId] = useState<string | null>(null);
  const { mutate: updateSubscription } = useUpdateSubscription();

  const logUsage = (subscription: Subscription) => {
    const id = String(subscription.id || '');
    if (!id) return;
    const now = nowFactory();
    const todayKey = now.toISOString().slice(0, 10);
    const recentLogs = (subscription.usageLogDates || []).filter(value => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && now.getTime() - date.getTime() <= NINETY_DAYS_MS;
    });
    const alreadyLoggedToday = recentLogs.some(value => value.slice(0, 10) === todayKey);

    setUpdatingUsageId(id);
    updateSubscription({
      id,
      data: {
        lastUsedDate: now.toISOString(),
        usageLogDates: alreadyLoggedToday ? recentLogs : [...recentLogs, now.toISOString()],
        usageScore: (subscription.usageScore || 0) + (alreadyLoggedToday ? 0 : 1),
      },
    }, { onSettled: () => setUpdatingUsageId(null) });
  };

  const setUsageFrequency = (
    subscription: Subscription,
    frequency: NonNullable<Subscription['usageFrequency']>,
  ) => {
    const id = String(subscription.id || '');
    if (!id) return;
    setUpdatingUsageId(id);
    updateSubscription({ id, data: { usageFrequency: frequency } }, {
      onSettled: () => setUpdatingUsageId(null),
    });
  };

  return { updatingUsageId, logUsage, setUsageFrequency };
}
