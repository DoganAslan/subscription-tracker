import { useMemo } from 'react';
import type { Subscription } from '@/services/firebase/types';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CURRENCY_RATES, type ExchangeRates } from '@/utils/currency';
import { buildCalendarViewModel } from '../utils/calendarViewModel';

export function useCalendarViewModel(
  subscriptions: readonly Subscription[] | undefined,
  selectedDate: Date,
) {
  const baseCurrency = useCurrencyStore(state => state.baseCurrency || 'USD');

  return useMemo(() => {
    const rates: ExchangeRates = {
      ...CURRENCY_RATES,
      EUR: CURRENCY_RATES.EUR ?? 1,
      USD: CURRENCY_RATES.USD ?? 1,
      TRY: CURRENCY_RATES.TRY ?? 1,
    };

    return buildCalendarViewModel({ subscriptions, selectedDate, baseCurrency, rates });
  }, [baseCurrency, selectedDate, subscriptions]);
}
