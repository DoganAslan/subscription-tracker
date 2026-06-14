import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { auth } from '../firebase/config';
import { SubscriptionService } from '../firebase/firestore';
import React from 'react';
import { SummaryWidget } from '../../widgets/SummaryWidget';

export const BACKGROUND_WIDGET_SYNC_TASK = 'BACKGROUND_WIDGET_SYNC_TASK';

// Define the background task
TaskManager.defineTask(BACKGROUND_WIDGET_SYNC_TASK, async () => {
  console.log('[Background Sync] Task triggered');
  try {
    // Wait for auth to initialize if needed
    const user = await new Promise((resolve) => {
      if (auth.currentUser) {
        resolve(auth.currentUser);
      } else {
        const unsubscribe = auth.onAuthStateChanged((u) => {
          unsubscribe();
          resolve(u);
        });
        
        // Timeout in case auth state takes too long
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

    // Fetch latest subscriptions from Firestore (read-only)
    console.log('[Background Sync] Fetching subscriptions for user:', (user as any).uid);
    const subscriptions = await SubscriptionService.getSubscriptions((user as any).uid);
    
    // Calculate monthly total
    const total = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
    const monthlyTotal = total.toFixed(2);
    
    // Find next payment
    let nextPaymentName = 'None';
    let nextPaymentDate = '--';
    
    if (subscriptions.length > 0) {
      // Sort by billing date to find the next one
      const today = new Date();
      let nextSub = subscriptions[0];
      let minDiff = Infinity;
      
      for (const sub of subscriptions) {
        if (!sub.renewalDate) continue;
        const billingDate = sub.renewalDate.toDate();
        // Calculate next occurrence this month/year
        const nextOccurrence = new Date(today.getFullYear(), today.getMonth(), billingDate.getDate());
        if (nextOccurrence < today) {
          nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
        }
        const diff = nextOccurrence.getTime() - today.getTime();
        if (diff < minDiff) {
          minDiff = diff;
          nextSub = sub;
        }
      }
      
      nextPaymentName = nextSub.name;
      nextPaymentDate = nextSub.renewalDate ? 
        new Date(today.getFullYear(), today.getMonth(), nextSub.renewalDate.toDate().getDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 
        '--';
    }

    const widgetData = {
      monthlyTotal,
      nextPaymentName,
      nextPaymentDate,
    };

    console.log('[Background Sync] Updating AsyncStorage and Widget:', widgetData);
    await AsyncStorage.setItem('widget_data', JSON.stringify(widgetData));

    // Request the widget to update its UI
    requestWidgetUpdate({
      widgetName: 'SummaryWidget',
      renderWidget: () => (
        <SummaryWidget 
          monthlyTotal={monthlyTotal} 
          nextPaymentName={nextPaymentName} 
          nextPaymentDate={nextPaymentDate} 
        />
      ),
      widgetNotFound: () => {
        console.log('[Background Sync] Widget not found on home screen.');
      }
    });

    console.log('[Background Sync] Task complete.');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[Background Sync] Failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the task (call this early in app lifecycle)
export async function registerBackgroundSync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WIDGET_SYNC_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_WIDGET_SYNC_TASK, {
        minimumInterval: 60 * 60 * 4, // 4 hours in seconds (battery friendly)
        stopOnTerminate: false, // Continue running after app is closed on Android
        startOnBoot: true, // Start after device reboot on Android
      });
      console.log('[Background Sync] Successfully registered exponential backoff task (4h minimum).');
    } else {
      console.log('[Background Sync] Task already registered.');
    }
  } catch (err) {
    console.error('[Background Sync] Registration failed:', err);
  }
}
