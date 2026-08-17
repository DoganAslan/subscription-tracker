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
import { getSecureData } from '@/utils/secureStorage';
import { getMonthlyCost, getNextRenewalDate } from '@/features/dashboard/utils/calculations';
import { Subscription } from '@/services/firebase/types';

export const BACKGROUND_WIDGET_SYNC_TASK = 'BACKGROUND_WIDGET_SYNC_TASK';

const getStoredBaseCurrency = async (): Promise<string> => {
  try {
    const storedState = await getSecureData('currency-storage');
    const parsedState = storedState ? JSON.parse(storedState) : null;
    return parsedState?.state?.baseCurrency || 'TRY';
  } catch {
    return 'TRY';
  }
};

const getRelativeDueLabel = (date: Date, isTurkish: boolean) => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const differenceInDays = Math.round((startOfDueDay.getTime() - startOfToday.getTime()) / 86_400_000);

  if (differenceInDays === 0) return isTurkish ? 'Bugün' : 'Today';
  if (differenceInDays === 1) return isTurkish ? 'Yarın' : 'Tomorrow';
  return isTurkish ? `${differenceInDays} gün sonra` : `in ${differenceInDays} days`;
};

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Updates AsyncStorage widget data and triggers a native Android widget re-render
 */
export const updateWidgetData = async (subscriptions: Subscription[], targetBaseCurrency?: string) => {
  try {
    const baseCurrency = targetBaseCurrency || await getStoredBaseCurrency();
    const isTurkish = (await AsyncStorage.getItem('@submate_lang')) !== 'en';

    // Ensure exchange rates are loaded
    await getMarketRatesWithDynamicCache(baseCurrency);

    // Calculate total spend in base currency for active subscriptions
    let totalSpend = 0;
    if (subscriptions && Array.isArray(subscriptions)) {
      for (const sub of subscriptions) {
        if (sub.status === 'paused') continue;
        const subAmount = typeof sub.amount === 'number' ? sub.amount : parseFloat(sub.amount) || 0;
        const subCurrency = sub.currency || 'TRY';
        const converted = convertCurrency(subAmount, subCurrency, baseCurrency);
        totalSpend += getMonthlyCost(converted, sub.billingCycle || 'monthly');
      }
    }

    const matchedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency);
    const symbol = matchedCurrency ? matchedCurrency.symbol : baseCurrency;
    const monthlyTotalFormatted = `${symbol}${totalSpend.toFixed(2)}`;

    // Find next payment
    let nextPaymentName = isTurkish ? 'Yaklaşan ödeme yok' : 'No upcoming payment';
    let nextPaymentDate = '--';
    let nextPaymentMeta = isTurkish ? 'Yeni abonelik eklediğinde burada görünür.' : 'It will appear here after you add a subscription.';
    const activeCount = subscriptions?.filter(sub => sub.status !== 'paused').length || 0;

    if (subscriptions && Array.isArray(subscriptions) && subscriptions.length > 0) {
      const today = new Date();
      let nextSub = null;
      let minDiff = Infinity;

      for (const sub of subscriptions) {
        if (sub.status === 'paused' || !sub.renewalDate) continue;

        const rawDate = toDate(sub.renewalDate);
        if (!rawDate) continue;

        const nextOccurrence = getNextRenewalDate(rawDate, sub.billingCycle || 'monthly');

        const diff = nextOccurrence.getTime() - today.getTime();
        if (diff >= 0 && diff < minDiff) {
          minDiff = diff;
          nextSub = sub;
        }
      }

      if (nextSub) {
        nextPaymentName = nextSub.name;
        const subRawDate = toDate(nextSub.renewalDate);
        if (!subRawDate) return null;
        const nextOccurrence = getNextRenewalDate(subRawDate, nextSub.billingCycle || 'monthly');
        nextPaymentDate = nextOccurrence.toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric' });
        nextPaymentMeta = getRelativeDueLabel(nextOccurrence, isTurkish);
      }
    }

    const widgetData = {
      monthlyTotal: monthlyTotalFormatted,
      nextPaymentName,
      nextPaymentDate,
      nextPaymentMeta,
      activeCount,
      labels: {
        monthlyTotal: isTurkish ? 'AYLIK TOPLAM' : 'MONTHLY TOTAL',
        nextPayment: isTurkish ? 'SIRADAKİ ÖDEME' : 'NEXT PAYMENT',
        activeSubscriptions: isTurkish ? 'aktif abonelik' : 'active subscriptions',
      },
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
            nextPaymentMeta={nextPaymentMeta}
            activeCount={activeCount}
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
