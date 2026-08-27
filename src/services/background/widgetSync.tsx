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

export const BACKGROUND_WIDGET_SYNC_TASK = 'BACKGROUND_WIDGET_SYNC_TASK';
let widgetUpdateQueue: Promise<unknown> = Promise.resolve();

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
const performWidgetDataUpdate = async (subscriptions: Subscription[], targetBaseCurrency?: string) => {
  try {
    const baseCurrency = targetBaseCurrency || await getStoredBaseCurrency();
    const isTurkish = (await AsyncStorage.getItem('@submate_lang')) !== 'en';

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

export const updateWidgetData = (subscriptions: Subscription[], targetBaseCurrency?: string) => {
  const snapshot = [...subscriptions];
  const queuedUpdate = widgetUpdateQueue
    .catch(() => undefined)
    .then(() => performWidgetDataUpdate(snapshot, targetBaseCurrency));
  widgetUpdateQueue = queuedUpdate;
  return queuedUpdate;
};

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
