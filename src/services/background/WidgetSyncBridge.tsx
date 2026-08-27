import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import type { Subscription } from '@/services/firebase/types';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { updateWidgetData } from './widgetSync';

type WidgetScheduleUpdate = (subscriptions: Subscription[], baseCurrency?: string, language?: string) => Promise<unknown>;

export interface WidgetSyncBridgeProps {
  subscriptions?: Subscription[];
  baseCurrency?: string;
  language?: string;
  scheduleUpdate?: WidgetScheduleUpdate;
}

const dateKey = (value: unknown): string => {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object' && 'toDate' in value) {
    const toDate = (value as { toDate?: unknown }).toDate;
    if (typeof toDate === 'function') {
      const date = toDate.call(value);
      if (date instanceof Date) return date.toISOString();
    }
  }
  return value == null ? '' : String(value);
};

const snapshotKey = (subscriptions: Subscription[], baseCurrency: string, language: string): string => JSON.stringify({
  baseCurrency,
  language,
  subscriptions: subscriptions
    .map(subscription => ({
      id: subscription.id ?? '',
      name: subscription.name,
      amount: subscription.amount,
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      renewalDate: dateKey(subscription.renewalDate),
      status: subscription.status ?? '',
      isPaused: subscription.isPaused === true,
      isTrial: subscription.isTrial === true,
      isFreeTrial: subscription.isFreeTrial === true,
      trialEndDate: dateKey(subscription.trialEndDate),
      isSplit: subscription.isSplit === true,
      splitMembers: (subscription.splitMembers ?? [])
        .map(member => ({
          id: member.id ?? '',
          name: member.name ?? '',
          phone: member.phone ?? '',
          shareAmount: member.shareAmount ?? '',
          isPaid: member.isPaid === true,
        }))
        .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
    }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
});

export function WidgetSyncBridge({
  subscriptions: injectedSubscriptions,
  baseCurrency: injectedBaseCurrency,
  language: injectedLanguage,
  scheduleUpdate = updateWidgetData,
}: WidgetSyncBridgeProps) {
  const { data: cachedSubscriptions } = useSubscriptions();
  const storedBaseCurrency = useCurrencyStore(state => state.baseCurrency);
  const { currentLanguage } = useTranslation();
  const subscriptions = injectedSubscriptions ?? cachedSubscriptions;
  const baseCurrency = injectedBaseCurrency ?? storedBaseCurrency;
  const language = injectedLanguage ?? currentLanguage;
  const contentKey = useMemo(
    () => subscriptions ? snapshotKey(subscriptions, baseCurrency, language) : null,
    [subscriptions, baseCurrency, language],
  );
  const lastScheduledKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!subscriptions || !contentKey || contentKey === lastScheduledKeyRef.current) return;

    lastScheduledKeyRef.current = contentKey;
    void scheduleUpdate(subscriptions, baseCurrency, language).catch(() => undefined);
  }, [baseCurrency, contentKey, language, scheduleUpdate, subscriptions]);

  return null;
}
