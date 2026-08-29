import { useMemo } from 'react';
import { calculateSubscriptionCost } from '@/domain/subscriptions/billing';
import { getAssignedCardId } from '@/domain/subscriptions/cardAssignment';
import { normalizeSubscriptionState } from '@/domain/subscriptions/normalization';
import type { Card, Subscription } from '@/services/firebase/types';
import { CURRENCY_RATES, SUPPORTED_CURRENCIES, type ExchangeRates } from '@/utils/currency';

export type WalletCardSummary = {
  card: Card;
  linkedSubscriptions: Subscription[];
  monthlyCommitmentBySubscriptionId: Record<string, number>;
  monthlyCommitment: number;
  monthlyLimitInBaseCurrency: number | null;
  limitUsagePercent: number | null;
  isOverLimit: boolean;
};

export type WalletViewModel = {
  cardSummaries: WalletCardSummary[];
  linkedSubscriptionCount: number;
  currencySymbol: string;
};

type WalletViewModelInput = {
  cards: Card[];
  subscriptions: Subscription[];
  baseCurrency: string;
  rates?: Readonly<ExchangeRates>;
};

const convert = (amount: number, from: string, to: string, rates: Readonly<ExchangeRates>): number => {
  if (from.toUpperCase() === to.toUpperCase()) return amount;
  const fromRate = rates[from.toUpperCase()];
  const toRate = rates[to.toUpperCase()];
  if (!Number.isFinite(fromRate) || !Number.isFinite(toRate) || fromRate <= 0 || toRate <= 0) return amount;
  return (amount / fromRate) * toRate;
};

export function buildWalletViewModel({ cards, subscriptions, baseCurrency, rates = CURRENCY_RATES as ExchangeRates }: WalletViewModelInput): WalletViewModel {
  const activeLinked = subscriptions.filter(subscription => !normalizeSubscriptionState(subscription).isPaused && getAssignedCardId(subscription));
  const cardSummaries = cards.map(card => {
    const linkedSubscriptions = activeLinked.filter(subscription => getAssignedCardId(subscription) === card.id);
    const monthlyCommitmentBySubscriptionId = Object.fromEntries(linkedSubscriptions.map(subscription => [
      String(subscription.id || subscription.name),
      calculateSubscriptionCost(subscription, { baseCurrency, rates }).monthlyNet,
    ]));
    const monthlyCommitment = Object.values(monthlyCommitmentBySubscriptionId).reduce((sum, amount) => sum + amount, 0);
    const monthlyLimitInBaseCurrency = typeof card.monthlyLimit === 'number' && card.monthlyLimit > 0
      ? convert(card.monthlyLimit, card.currency || baseCurrency, baseCurrency, rates)
      : null;
    const limitUsagePercent = monthlyLimitInBaseCurrency ? (monthlyCommitment / monthlyLimitInBaseCurrency) * 100 : null;
    return { card, linkedSubscriptions, monthlyCommitmentBySubscriptionId, monthlyCommitment, monthlyLimitInBaseCurrency, limitUsagePercent, isOverLimit: limitUsagePercent !== null && limitUsagePercent > 100 };
  });
  return {
    cardSummaries,
    linkedSubscriptionCount: activeLinked.length,
    currencySymbol: SUPPORTED_CURRENCIES.find(currency => currency.code === baseCurrency)?.symbol || baseCurrency,
  };
}

export function useWalletViewModel(input: Omit<WalletViewModelInput, 'rates'>): WalletViewModel {
  return useMemo(() => buildWalletViewModel(input), [input.baseCurrency, input.cards, input.subscriptions]);
}
