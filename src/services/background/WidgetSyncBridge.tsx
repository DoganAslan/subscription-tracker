import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import type { Subscription } from '@/services/firebase/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { clearWidgetData as clearWidgetDataForLogout, resetWidgetSync, updateWidgetData } from './widgetSync';
import { serializeSubscriptionDate } from '@/domain/subscriptions/recurrence';

type WidgetScheduleUpdate = (subscriptions: Subscription[], baseCurrency?: string, language?: string) => Promise<unknown>;
type ClearWidgetData = (baseCurrency?: string, language?: string) => Promise<unknown>;

export interface WidgetSyncBridgeProps {
  subscriptions?: Subscription[];
  baseCurrency?: string;
  language?: string;
  userId?: string | null;
  authReady?: boolean;
  scheduleUpdate?: WidgetScheduleUpdate;
  resetWidgetSync?: () => void;
  clearWidgetData?: ClearWidgetData;
}

const legacySplitMemberAmount = (member: unknown): unknown => (
  (member as { amount?: unknown }).amount
);

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
      renewalDate: serializeSubscriptionDate(subscription.renewalDate),
      status: subscription.status ?? '',
      isPaused: subscription.isPaused === true,
      isTrial: subscription.isTrial === true,
      isFreeTrial: subscription.isFreeTrial === true,
      trialEndDate: serializeSubscriptionDate(subscription.trialEndDate),
      isSplit: subscription.isSplit === true,
      splitMembers: (subscription.splitMembers ?? [])
        .map(member => ({
          id: member.id ?? '',
          name: member.name ?? '',
          phone: member.phone ?? '',
          shareAmount: member.shareAmount ?? legacySplitMemberAmount(member) ?? '',
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
  userId: injectedUserId,
  authReady: injectedAuthReady,
  scheduleUpdate = updateWidgetData,
  resetWidgetSync: reset = resetWidgetSync,
  clearWidgetData = clearWidgetDataForLogout,
}: WidgetSyncBridgeProps) {
  const { data: cachedSubscriptions } = useSubscriptions();
  const storedBaseCurrency = useCurrencyStore(state => state.baseCurrency);
  const { currentLanguage } = useTranslation();
  const authUserId = useAuthStore(state => state.user?.uid ?? null);
  const authIsLoading = useAuthStore(state => state.isLoading);
  const subscriptions = injectedSubscriptions ?? cachedSubscriptions;
  const baseCurrency = injectedBaseCurrency ?? storedBaseCurrency;
  const language = injectedLanguage ?? currentLanguage;
  const userId = injectedUserId === undefined ? authUserId : injectedUserId;
  const authReady = injectedAuthReady ?? (injectedUserId === undefined ? !authIsLoading : true);
  const contentKey = useMemo(
    () => subscriptions ? snapshotKey(subscriptions, baseCurrency, language) : null,
    [subscriptions, baseCurrency, language],
  );
  const lastScheduledKeyRef = useRef<string | null>(null);
  const previousUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!authReady) return;
    const previousUserId = previousUserIdRef.current;
    if (previousUserId === undefined) {
      previousUserIdRef.current = userId;
      if (!userId) {
        lastScheduledKeyRef.current = null;
        reset();
        void clearWidgetData(baseCurrency, language).catch(() => undefined);
      }
      return;
    }
    if (previousUserId === userId) return;

    previousUserIdRef.current = userId;
    lastScheduledKeyRef.current = null;
  }, [authReady, baseCurrency, clearWidgetData, language, reset, userId]);

  useEffect(() => {
    if (!authReady || !userId || !subscriptions || !contentKey || contentKey === lastScheduledKeyRef.current) return;

    lastScheduledKeyRef.current = contentKey;
    void scheduleUpdate(subscriptions, baseCurrency, language).catch(() => undefined);
  }, [authReady, baseCurrency, contentKey, language, scheduleUpdate, subscriptions, userId]);

  return null;
}
