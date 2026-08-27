import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { auth } from '../firebase/config';
import { SubscriptionService } from '../firebase/firestore';
import React from 'react';
import { SummaryWidget } from '../../widgets/SummaryWidget';
import { getMarketRatesWithDynamicCache, SUPPORTED_CURRENCIES } from '@/utils/currency';
import { Platform } from 'react-native';
import { getSecureData } from '@/utils/secureStorage';
import { Subscription } from '@/services/firebase/types';
import { buildWidgetData } from './widgetData';
import { createLatestWinsCoordinator } from './latestWinsCoordinator';

export const BACKGROUND_WIDGET_SYNC_TASK = 'BACKGROUND_WIDGET_SYNC_TASK';

type WidgetUpdateInput = {
  subscriptions: Subscription[];
  baseCurrency?: string;
  language?: string;
};

const getStoredBaseCurrency = async (): Promise<string> => {
  try {
    const storedState = await getSecureData('currency-storage');
    const parsedState = storedState ? JSON.parse(storedState) : null;
    return parsedState?.state?.baseCurrency || 'TRY';
  } catch {
    return 'TRY';
  }
};

/**
 * Updates AsyncStorage widget data and triggers a native Android widget re-render
 */
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

const widgetContentKey = ({ subscriptions, baseCurrency, language }: WidgetUpdateInput): string => JSON.stringify({
  baseCurrency: baseCurrency ?? '',
  language: language ?? '',
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

const performWidgetDataUpdate = async (
  subscriptions: Subscription[],
  targetBaseCurrency?: string,
  targetLanguage?: string,
) => {
  try {
    const baseCurrency = targetBaseCurrency || await getStoredBaseCurrency();
    const language = targetLanguage ?? await AsyncStorage.getItem('@submate_lang');
    const isTurkish = language !== 'en';

    const rates = await getMarketRatesWithDynamicCache(baseCurrency);

    const matchedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency);
    const symbol = matchedCurrency ? matchedCurrency.symbol : baseCurrency;
    const widgetData = buildWidgetData({
      subscriptions,
      baseCurrency,
      currencySymbol: symbol,
      isTurkish,
      rates,
    });

    await AsyncStorage.setItem('widget_data', JSON.stringify(widgetData));

    if (Platform.OS !== 'web') {
      await requestWidgetUpdate({
        widgetName: 'SummaryWidget',
        renderWidget: () => (
          <SummaryWidget
            monthlyTotal={widgetData.monthlyTotal}
            nextPaymentName={widgetData.nextPaymentName}
            nextPaymentDate={widgetData.nextPaymentDate}
            nextPaymentMeta={widgetData.nextPaymentMeta}
            activeCount={widgetData.activeCount}
            labels={widgetData.labels}
          />
        ),
        widgetNotFound: () => {
          console.log('[Widget Sync] SummaryWidget not found on home screen.');
        },
      });
    }

    return widgetData;
  } catch (error) {
    console.error('[Widget Sync] Failed to update widget data:', error);
    return null;
  }
};

const widgetUpdateCoordinator = createLatestWinsCoordinator<WidgetUpdateInput, Awaited<ReturnType<typeof performWidgetDataUpdate>>>({
  keyOf: widgetContentKey,
  run: ({ subscriptions, baseCurrency, language }) => performWidgetDataUpdate(subscriptions, baseCurrency, language),
});

export const updateWidgetData = (subscriptions: Subscription[], targetBaseCurrency?: string, targetLanguage?: string) => widgetUpdateCoordinator.submit({
  subscriptions: [...subscriptions],
  baseCurrency: targetBaseCurrency,
  language: targetLanguage,
});

/**
 * Manually trigger widget sync for a user
 */
export const triggerWidgetSync = async (userId: string) => {
  try {
    if (!userId || Platform.OS === 'web') return;
    const subscriptions = await SubscriptionService.getSubscriptions(userId);
    await updateWidgetData(subscriptions);
  } catch (error) {
    console.warn('[Widget Sync] Manual trigger warning:', error);
  }
};

// Define the background task
if (Platform.OS !== 'web') {
  TaskManager.defineTask(BACKGROUND_WIDGET_SYNC_TASK, async () => {
    console.log('[Background Sync] Task triggered');
    try {
      const user = await new Promise((resolve) => {
        if (auth.currentUser) {
          resolve(auth.currentUser);
        } else {
          const unsubscribe = auth.onAuthStateChanged((u) => {
            unsubscribe();
            resolve(u);
          });

          setTimeout(() => {
            unsubscribe();
            resolve(null);
          }, 5000);
        }
      });

      if (!user) {
        console.log('[Background Sync] No user logged in, skipping.');
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      console.log('[Background Sync] Fetching subscriptions for user:', (user as any).uid);
      const subscriptions = await SubscriptionService.getSubscriptions((user as any).uid);

      await updateWidgetData(subscriptions);

      console.log('[Background Sync] Task complete.');
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('[Background Sync] Failed:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

// Register the background task (call this early in app lifecycle)
export async function registerBackgroundSync() {
  if (Platform.OS === 'web') return;
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WIDGET_SYNC_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_WIDGET_SYNC_TASK, {
        minimumInterval: 60 * 60 * 4, // 4 hours in seconds (battery friendly)
        stopOnTerminate: false, // Continue running after app is closed on Android
        startOnBoot: true, // Start after device reboot on Android
      });
      console.log('[Background Sync] Successfully registered background widget sync task (4h minimum).');
    } else {
      console.log('[Background Sync] Task already registered.');
    }
  } catch (err) {
    console.error('[Background Sync] Registration failed:', err);
  }
}
