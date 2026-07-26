import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { auth } from '../firebase/config';
import { SubscriptionService } from '../firebase/firestore';
import React from 'react';
import { SummaryWidget } from '../../widgets/SummaryWidget';
import { getMarketRatesWithDynamicCache, convertCurrency, SUPPORTED_CURRENCIES } from '@/utils/currency';
import { Platform } from 'react-native';

export const BACKGROUND_WIDGET_SYNC_TASK = 'BACKGROUND_WIDGET_SYNC_TASK';

/**
 * Updates AsyncStorage widget data and triggers a native Android widget re-render
 */
export const updateWidgetData = async (subscriptions: any[], targetBaseCurrency?: string) => {
  try {
    let baseCurrency = targetBaseCurrency;
    if (!baseCurrency) {
      try {
        const storedCurrency = await AsyncStorage.getItem('@submate_base_currency');
        baseCurrency = storedCurrency || 'TRY';
      } catch {
        baseCurrency = 'TRY';
      }
    }

    // Ensure exchange rates are loaded
    await getMarketRatesWithDynamicCache(baseCurrency);

    // Calculate total spend in base currency for active subscriptions
    let totalSpend = 0;
    if (subscriptions && Array.isArray(subscriptions)) {
      for (const sub of subscriptions) {
        if (sub.isPaused) continue;
        const subAmount = typeof sub.amount === 'number' ? sub.amount : parseFloat(sub.amount) || 0;
        const subCurrency = sub.currency || 'TRY';
        const converted = convertCurrency(subAmount, subCurrency, baseCurrency);
        totalSpend += converted;
      }
    }

    const matchedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency);
    const symbol = matchedCurrency ? matchedCurrency.symbol : baseCurrency;
    const monthlyTotalFormatted = `${symbol}${totalSpend.toFixed(2)}`;

    // Find next payment
    let nextPaymentName = 'None';
    let nextPaymentDate = '--';

    if (subscriptions && Array.isArray(subscriptions) && subscriptions.length > 0) {
      const today = new Date();
      let nextSub = null;
      let minDiff = Infinity;

      for (const sub of subscriptions) {
        if (sub.isPaused || !sub.renewalDate) continue;

        const rawDate = typeof sub.renewalDate?.toDate === 'function'
          ? sub.renewalDate.toDate()
          : new Date(sub.renewalDate);

        if (isNaN(rawDate.getTime())) continue;

        const nextOccurrence = new Date(today.getFullYear(), today.getMonth(), rawDate.getDate());
        if (nextOccurrence.getTime() < today.getTime()) {
          nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
        }

        const diff = nextOccurrence.getTime() - today.getTime();
        if (diff >= 0 && diff < minDiff) {
          minDiff = diff;
          nextSub = sub;
        }
      }

      if (nextSub) {
        nextPaymentName = nextSub.name;
        const subRawDate = typeof nextSub.renewalDate?.toDate === 'function'
          ? nextSub.renewalDate.toDate()
          : new Date(nextSub.renewalDate);

        nextPaymentDate = subRawDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
    }

    const widgetData = {
      monthlyTotal: monthlyTotalFormatted,
      nextPaymentName,
      nextPaymentDate,
    };

    await AsyncStorage.setItem('widget_data', JSON.stringify(widgetData));

    if (Platform.OS !== 'web') {
      requestWidgetUpdate({
        widgetName: 'SummaryWidget',
        renderWidget: () => (
          <SummaryWidget
            monthlyTotal={monthlyTotalFormatted}
            nextPaymentName={nextPaymentName}
            nextPaymentDate={nextPaymentDate}
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
