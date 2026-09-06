import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNextRenewalDate } from '@/features/dashboard/utils/calculations';
import i18n from '@/locales/i18n';

const NOTIFICATION_HISTORY_KEY = '@submate_notification_history';
const MAX_NOTIFICATION_HISTORY_ITEMS = 60;

export type NotificationHistoryItem = {
  id: string;
  title: string;
  body: string;
  receivedAt: number;
  read: boolean;
};

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const REMINDER_CHANNEL_ID = 'submate-reminders';

export const getSubscriptionReminderIds = (subscriptionId: string) => ({
  payment: `submate:payment:${subscriptionId}`,
  contract: `submate:contract:${subscriptionId}`,
});

export const isNotificationPermissionGranted = (status: Notifications.NotificationPermissionsStatus): boolean =>
  status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

const notificationToHistoryItem = (
  notification: Notifications.Notification,
  read = false,
): NotificationHistoryItem => ({
  id: notification.request.identifier,
  title: notification.request.content.title || 'SubMate',
  body: notification.request.content.body || '',
  receivedAt: Date.now(),
  read,
});

const persistNotificationHistoryItem = async (item: NotificationHistoryItem) => {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    const existing: NotificationHistoryItem[] = stored ? JSON.parse(stored) : [];
    const previous = existing.find(historyItem => historyItem.id === item.id);
    const next = [
      { ...previous, ...item, receivedAt: item.receivedAt || previous?.receivedAt || Date.now() },
      ...existing.filter(historyItem => historyItem.id !== item.id),
    ].slice(0, MAX_NOTIFICATION_HISTORY_ITEMS);
    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('[Notifications] Could not save notification history:', error);
  }
};

export const getNotificationHistory = async (): Promise<NotificationHistoryItem[]> => {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('[Notifications] Could not read notification history:', error);
    return [];
  }
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const history = await getNotificationHistory();
  return history.filter(item => !item.read).length;
};

export const markNotificationsAsRead = async (): Promise<void> => {
  const history = await getNotificationHistory();
  await AsyncStorage.setItem(
    NOTIFICATION_HISTORY_KEY,
    JSON.stringify(history.map(item => ({ ...item, read: true }))),
  );
};

export const clearNotificationHistory = async (): Promise<void> => {
  await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
};

// Expo exposes the notifications that are still visible in the system tray.
// Merging them here also catches reminders delivered while the app was closed.
export const syncPresentedNotificationsToHistory = async (): Promise<void> => {
  if (Platform.OS === 'web') return;

  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    await Promise.all(
      presented.map(notification =>
        persistNotificationHistoryItem(notificationToHistoryItem(notification)),
      ),
    );
  } catch (error) {
    console.warn('[Notifications] Could not sync displayed notifications:', error);
  }
};

export const registerNotificationHistoryListeners = () => {
  if (Platform.OS === 'web') return () => undefined;

  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    void persistNotificationHistoryItem(notificationToHistoryItem(notification));
  });
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    void persistNotificationHistoryItem(notificationToHistoryItem(response.notification, true));
  });

  void Notifications.getLastNotificationResponseAsync().then(response => {
    if (response) {
      void persistNotificationHistoryItem(notificationToHistoryItem(response.notification, true));
    }
  }).catch(() => undefined);

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};

export const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Ödeme Hatırlatıcıları',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  }
};

export const getNotificationPermissionState = async (): Promise<Notifications.NotificationPermissionsStatus | null> => {
  if (Platform.OS === 'web') return null;
  try {
    return await Notifications.getPermissionsAsync();
  } catch {
    return null;
  }
};

export const requestReminderPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    await setupNotificationChannel();

    const existing = await Notifications.getPermissionsAsync();
    if (isNotificationPermissionGranted(existing)) return true;

    const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
    return isNotificationPermissionGranted(requested);
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Backward-compatible name for UI actions. It remains local-only and does not fetch a push token.
export const requestNotificationPermissions = requestReminderPermission;

export const testNotification = async () => {
  if (Platform.OS === 'web') return;
  const hasPermission = await requestReminderPermission();
  if (!hasPermission) {
    console.log('No permission for test notification');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Test Bildirimi',
      body: 'SubMate bildirim sistemi başarıyla çalışıyor!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
};

export const cancelSubReminder = async (subId: string): Promise<void> => {
  if (Platform.OS === 'web') return;

  try {
    const notifId = getSubscriptionReminderIds(subId).payment;
    await Notifications.cancelScheduledNotificationAsync(notifId);
  } catch (error) {
    // Silently handle if it wasn't scheduled
  }
};

export const cancelContractDoomReminder = async (subId: string): Promise<void> => {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelScheduledNotificationAsync(getSubscriptionReminderIds(subId).contract);
  } catch {
    // The notification may not have been scheduled yet.
  }
};

export const scheduleSubReminder = async (subscription: any, nextRenewalDate: Date): Promise<boolean> => {
  if (Platform.OS === 'web' || subscription?.status === 'paused') return false;

  const hasPermission = await requestReminderPermission();
  if (!hasPermission) return false;

  if (!subscription || !subscription.id) return false;

  // Cancel any existing reminder first using deterministic ID
  await cancelSubReminder(subscription.id);

  let renewalDate = new Date(nextRenewalDate);
  if (isNaN(renewalDate.getTime())) return false;

  // Calculate Trigger Date: 2 Days before nextRenewalDate at 09:00 AM
  let triggerDate = new Date(renewalDate);
  triggerDate.setDate(triggerDate.getDate() - 2);
  triggerDate.setHours(9, 0, 0, 0);


  // If trigger date has passed, check if renewal is still in the future
  if (triggerDate.getTime() <= Date.now()) {
    if (renewalDate.getTime() > Date.now()) {
      // Send quick reminder in 5 seconds
      triggerDate = new Date(Date.now() + 5000);
    } else {
      // The renewal date is in the past! Advance to the NEXT renewal date cycle
      const cycle = subscription.billingCycle || 'monthly';
      const advancedDate = getNextRenewalDate(new Date(renewalDate.getTime() + 86400000), cycle);
      renewalDate = advancedDate;
      triggerDate = new Date(renewalDate);
      triggerDate.setDate(triggerDate.getDate() - 2);
      triggerDate.setHours(9, 0, 0, 0);

      if (triggerDate.getTime() <= Date.now()) {
        if (renewalDate.getTime() > Date.now()) {
          triggerDate = new Date(Date.now() + 5000);
        } else {
          return false;
        }
      }
    }
  }

  const notifIdentifier = getSubscriptionReminderIds(subscription.id).payment;

  // Calculate exact days remaining for dynamic text
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const renMidnight = new Date(renewalDate);
  renMidnight.setHours(0, 0, 0, 0);

  const diffMs = renMidnight.getTime() - todayMidnight.getTime();
  const daysLeft = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  const isEnglish = (i18n.language || 'tr').startsWith('en');

  let title = '⏳ Ödeme Hatırlatıcı';
  let body = `${subscription.name} yenilenmesine ${daysLeft} gün kaldı!`;

  if (daysLeft === 0) {
    title = isEnglish ? '💳 Payment Due Today!' : '💳 Bugün Ödemeniz Var!';
    body = isEnglish
      ? `Your ${subscription.name} subscription payment is due today.`
      : `${subscription.name} aboneliğinizin ödemesi bugün gerçekleşiyor.`;
  } else if (daysLeft === 1) {
    title = isEnglish ? '⏳ Payment Due Tomorrow' : '⏳ Yarın Ödemeniz Var';
    body = isEnglish
      ? `Your ${subscription.name} subscription renews tomorrow (1 day).`
      : `${subscription.name} aboneliğinizin yenilenmesine 1 gün kaldı (yarın).`;
  } else {
    title = isEnglish ? '⏳ Payment Reminder' : '⏳ Ödeme Hatırlatıcı';
    body = isEnglish
      ? `Your ${subscription.name} subscription renews in ${daysLeft} days.`
      : `${subscription.name} yenilenmesine ${daysLeft} gün kaldı!`;
  }

  // Strategy 1: Try Date trigger first
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: notifIdentifier,
      content: {
        title,
        body,
        sound: true,
        data: { subId: subscription.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
    return true;
  } catch (error) {
    console.log('Date trigger failed (Exact Alarm restriction fallback to TIME_INTERVAL)...');
    // Strategy 2: Fallback to seconds interval trigger which avoids exact alarm restrictions
    try {
      const secondsToTrigger = Math.max(2, Math.floor((triggerDate.getTime() - Date.now()) / 1000));
      await Notifications.scheduleNotificationAsync({
        identifier: notifIdentifier,
        content: {
          title,
          body,
          sound: true,
          data: { subId: subscription.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsToTrigger,
          channelId: REMINDER_CHANNEL_ID,
        },
      });
      return true;
    } catch (fallbackError) {
      console.error('Notification fallback schedule error:', fallbackError);
      return false;
    }
  }
};

export const scheduleContractDoomReminder = async (subscription: any): Promise<boolean> => {
  if (Platform.OS === 'web' || !subscription || !subscription.contractEndDate) return false;

  const hasPermission = await requestReminderPermission();
  if (!hasPermission) return false;

  const contractDate = new Date(
    typeof subscription.contractEndDate?.toDate === 'function'
      ? subscription.contractEndDate.toDate()
      : subscription.contractEndDate
  );

  if (isNaN(contractDate.getTime())) return false;

  let triggerDate = new Date(contractDate);
  triggerDate.setDate(triggerDate.getDate() - 7);
  triggerDate.setHours(9, 0, 0, 0);

  let isImmediateTest = false;

  if (triggerDate.getTime() <= Date.now()) {
    if (contractDate.getTime() > Date.now()) {
      triggerDate = new Date(Date.now() + 5000);
      isImmediateTest = true;
    } else {
      return false;
    }
  }

  const doomIdentifier = getSubscriptionReminderIds(subscription.id).contract;

  try {
    await cancelContractDoomReminder(subscription.id);

    const title = isImmediateTest ? '⚠️ Taahhüt Bitiş Uyarısı' : '⚠️ Taahhüt Bitiş Uyarısı';
    const body = `${subscription.name} aboneliğinizin taahhüdü 7 gün sonra bitiyor. Fiyat artışına dikkat edin!`;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: doomIdentifier,
        content: {
          title,
          body,
          sound: true,
          data: { subscriptionId: subscription.id, type: 'contract_doom' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: REMINDER_CHANNEL_ID,
        },
      });
      return true;
    } catch (err) {
      const secondsToTrigger = Math.max(2, Math.floor((triggerDate.getTime() - Date.now()) / 1000));
      await Notifications.scheduleNotificationAsync({
        identifier: doomIdentifier,
        content: {
          title,
          body,
          sound: true,
          data: { subscriptionId: subscription.id, type: 'contract_doom' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsToTrigger,
          channelId: REMINDER_CHANNEL_ID,
        },
      });
      return true;
    }
  } catch (error) {
    console.error('Failed to schedule contract doom reminder:', error);
    return false;
  }
};

export const resyncAllReminders = async (subscriptions: any[]): Promise<void> => {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (subscriptions && Array.isArray(subscriptions)) {
      for (const sub of subscriptions) {
        if (sub.status !== 'paused' && sub.renewalDate) {
          const rawDate = typeof sub.renewalDate?.toDate === 'function'
            ? sub.renewalDate.toDate()
            : new Date(sub.renewalDate);

          await scheduleSubReminder(sub, rawDate);
        }
        if (sub.hasContract && sub.contractEndDate) {
          await scheduleContractDoomReminder(sub);
        }
      }
    }
  } catch (error) {
    console.error('Failed to resync reminders:', error);
  }
};
