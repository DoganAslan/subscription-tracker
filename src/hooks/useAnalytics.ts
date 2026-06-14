import { useMemo } from 'react';
import { Subscription } from '@/services/firebase/types';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { calculateMetrics, DashboardMetrics } from '@/features/dashboard/utils/calculations';

export function useAnalytics(subscriptions: Subscription[] | undefined): DashboardMetrics {
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);

  return useMemo(() => {
    return calculateMetrics(subscriptions || [], baseCurrency);
  }, [subscriptions, baseCurrency]);
}
