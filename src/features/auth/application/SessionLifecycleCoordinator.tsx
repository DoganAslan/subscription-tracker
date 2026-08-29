import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscriptionKeys } from '@/features/subscriptions/application/subscriptionKeys';
import { clearWidgetData as clearWidgetDataForSession, resetWidgetSync as resetWidgetSyncForSession } from '@/services/background/widgetSync';
import { useAuthStore } from '@/store/useAuthStore';
import { useProfileStore } from '@/store/useProfileStore';
import { cardKeys } from '@/features/cards/application/cardKeys';

type ClearWidgetData = () => Promise<unknown>;
const resetProfileForSession = () => useProfileStore.getState().resetProfile();

interface SessionLifecycleCoordinatorProps {
  resetWidgetSync?: () => void;
  clearWidgetData?: ClearWidgetData;
  resetProfile?: () => void;
}

export function SessionLifecycleCoordinator({
  resetWidgetSync = resetWidgetSyncForSession,
  clearWidgetData = clearWidgetDataForSession,
  resetProfile = resetProfileForSession,
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
      queryClient.removeQueries({
        queryKey: cardKeys.list(previousUserId),
        exact: true,
      });
      resetProfile();
      resetWidgetSync();
      void clearWidgetData().catch(() => undefined);
      previousUserId = nextUserId;
    });
  }, [clearWidgetData, queryClient, resetProfile, resetWidgetSync]);

  return null;
}
