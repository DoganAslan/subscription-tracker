import { useMemo } from 'react';
import type { Subscription } from '@/services/firebase/types';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CURRENCY_RATES, type ExchangeRates } from '@/utils/currency';
import { buildDashboardViewModel } from '../utils/dashboardViewModel';

export function useDashboardViewModel(
  subscriptions: readonly Subscription[] | undefined,
  query: string,
) {
  const baseCurrency = useCurrencyStore(state => state.baseCurrency || 'USD');

  return useMemo(() => {
    const rates: ExchangeRates = {
      ...CURRENCY_RATES,
      EUR: CURRENCY_RATES.EUR ?? 1,
      USD: CURRENCY_RATES.USD ?? 1,
      TRY: CURRENCY_RATES.TRY ?? 1,
    };

    return buildDashboardViewModel({
      subscriptions,
      query,
      baseCurrency,
      rates,
      now: new Date(),
    });
  }, [baseCurrency, query, subscriptions]);
}
