import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getNextRenewalDate } from '@/features/dashboard/utils/calculations';

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

const getNotifId = (subId: string): string => `sub_remind_${subId}`;

export const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
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

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    await setupNotificationChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

export const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
  if (Platform.OS === 'web') return undefined;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return undefined;

  if (Device.isDevice) {
    try {
      const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
      return pushToken;
    } catch (error) {
      console.log('Expo push token notice (local notifications active):', error);
    }
  }
  return undefined;
};

export const testNotification = async () => {
  if (Platform.OS === 'web') return;
  const hasPermission = await requestNotificationPermissions();
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
      channelId: 'default',
    },
  });
};

export const cancelSubReminder = async (subId: string): Promise<void> => {
  if (Platform.OS === 'web') return;

  try {
    const notifId = getNotifId(subId);
    await Notifications.cancelScheduledNotificationAsync(notifId);
  } catch (error) {
    // Silently handle if it wasn't scheduled
  }
};

export const scheduleSubReminder = async (subscription: any, nextRenewalDate: Date): Promise<boolean> => {
  if (Platform.OS === 'web' || subscription.isPaused === true) return false;

  const hasPermission = await requestNotificationPermissions();
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

  let isImmediateTest = false;

  // If trigger date has passed, check if renewal is still in the future
  if (triggerDate.getTime() <= Date.now()) {
    if (renewalDate.getTime() > Date.now()) {
      // Send quick reminder in 5 seconds
      triggerDate = new Date(Date.now() + 5000);
      isImmediateTest = true;
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
          isImmediateTest = true;
        } else {
          return false;
        }
      }
    }
  }

  const notifIdentifier = getNotifId(subscription.id);
  const title = isImmediateTest ? '🔔 Abonelik Yaklaşıyor' : '⏳ Ödeme Hatırlatıcı';
  const body = `${subscription.name} yenilenmesine 2 gün kaldı!`;

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
        channelId: 'default',
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
          channelId: 'default',
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

  const hasPermission = await requestNotificationPermissions();
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

  const doomIdentifier = `sub_contract_doom_${subscription.id}`;

  try {
    await Notifications.cancelScheduledNotificationAsync(doomIdentifier).catch(() => {});

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
          channelId: 'default',
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
          channelId: 'default',
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
        if (!sub.isPaused && sub.renewalDate) {
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
