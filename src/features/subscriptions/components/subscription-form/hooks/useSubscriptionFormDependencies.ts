import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useTranslation } from '@/context/LanguageContext';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import type { SubscriptionFormData } from '../../../schemas/subscription.schema';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CURRENCY_RATES, type ExchangeRates } from '@/utils/currency';
import {
  projectSubscriptionBudget,
  type BudgetProjection,
} from './useBudgetGuard';

export interface SubscriptionFormDependencies {
  budget: number | null;
  project: (candidate: SubscriptionFormData) => BudgetProjection;
  confirm: (projection: BudgetProjection) => Promise<boolean>;
}

const createNativeConfirmation = (title: string, message: string, cancelLabel: string, confirmLabel: string) => (
  new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  })
);

const currentRates = (): ExchangeRates => ({
  ...CURRENCY_RATES,
  TRY: CURRENCY_RATES.TRY ?? 1,
  USD: CURRENCY_RATES.USD ?? 1,
  EUR: CURRENCY_RATES.EUR ?? 1,
});

export const useSubscriptionFormDependencies = (
  editingSubscriptionId?: string | null,
): SubscriptionFormDependencies => {
  const { data: subscriptions = [] } = useSubscriptions();
  const budget = useBudgetStore((state) => state.monthlyBudget);
  const baseCurrency = useCurrencyStore((state) => state.baseCurrency);
  const { currentLanguage, t } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  const project = useCallback((candidate: SubscriptionFormData) => projectSubscriptionBudget({
    subscriptions,
    candidate,
    editingSubscriptionId,
    baseCurrency,
    rates: currentRates(),
  }), [baseCurrency, editingSubscriptionId, subscriptions]);

  const confirm = useCallback(async (projection: BudgetProjection): Promise<boolean> => {
    const title = t.healthScore.warning;
    const message = isTurkish
      ? `Aylık net abonelik toplamın ${projection.monthlyNet.toFixed(2)} ${baseCurrency} ile ${budget?.toFixed(2) ?? '0.00'} ${baseCurrency} bütçeni aşacak. Yine de kaydedilsin mi?`
      : `Your monthly net subscription total of ${projection.monthlyNet.toFixed(2)} ${baseCurrency} will exceed your ${budget?.toFixed(2) ?? '0.00'} ${baseCurrency} budget. Save anyway?`;

    if (Platform.OS === 'web') {
      return window.confirm(`${title}\n\n${message}`);
    }

    return createNativeConfirmation(
      title,
      message,
      t.common.cancel,
      isTurkish ? 'Yine de kaydet' : 'Save anyway',
    );
  }, [baseCurrency, budget, isTurkish]);

  return { budget, project, confirm };
};
