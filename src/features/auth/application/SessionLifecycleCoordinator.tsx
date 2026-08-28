import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscriptionKeys } from '@/features/subscriptions/application/subscriptionKeys';
import { clearWidgetData as clearWidgetDataForSession, resetWidgetSync as resetWidgetSyncForSession } from '@/services/background/widgetSync';
import { useAuthStore } from '@/store/useAuthStore';

type ClearWidgetData = () => Promise<unknown>;

interface SessionLifecycleCoordinatorProps {
  resetWidgetSync?: () => void;
  clearWidgetData?: ClearWidgetData;
}

export function SessionLifecycleCoordinator({
  resetWidgetSync = resetWidgetSyncForSession,
  clearWidgetData = clearWidgetDataForSession,
}: SessionLifecycleCoordinatorProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let previousUserId = useAuthStore.getState().user?.uid ?? null;

    return useAuthStore.subscribe((state) => {
      const nextUserId = state.user?.uid ?? null;
      if (!previousUserId || previousUserId === nextUserId) {
        previousUserId = nextUserId;
        return;
      }

      queryClient.removeQueries({
        queryKey: subscriptionKeys.list(previousUserId),
        exact: true,
      });
      resetWidgetSync();
      void clearWidgetData().catch(() => undefined);
      previousUserId = nextUserId;
    });
  }, [clearWidgetData, queryClient, resetWidgetSync]);

  return null;
}
