import { useMemo } from 'react';
import type { Subscription } from '@/services/firebase/types';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CURRENCY_RATES, type ExchangeRates } from '@/utils/currency';
import { buildDashboardViewModel } from '../utils/dashboardViewModel';

export function useDashboardViewModel(
  subscriptions: readonly Subscription[] | undefined,
  query: string,
  currentRates?: Readonly<ExchangeRates> | null,
) {
  const baseCurrency = useCurrencyStore(state => state.baseCurrency || 'USD');

  return useMemo(() => {
    const rateSource = currentRates ?? CURRENCY_RATES;
    const rates: ExchangeRates = {
      ...rateSource,
      EUR: rateSource.EUR ?? 1,
      USD: rateSource.USD ?? 1,
      TRY: rateSource.TRY ?? 1,
    };

    return buildDashboardViewModel({
      subscriptions,
      query,
      baseCurrency,
      rates,
      now: new Date(),
    });
  }, [baseCurrency, currentRates, query, subscriptions]);
}
