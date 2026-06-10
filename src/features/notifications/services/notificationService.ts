import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Subscription } from '@/services/firebase/types';
import { useNotificationStore } from '../store/useNotificationStore';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export class NotificationService {
  static async requestPermissionsAsync() {
    if (Platform.OS === 'web') return false;

    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device.');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  }

  static async cancelSubscriptionNotifications(subscriptionId: string) {
    if (Platform.OS === 'web') return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduled) {
      const data = notification.content.data as { subscriptionId?: string };
      if (data?.subscriptionId === subscriptionId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  static async scheduleSubscriptionNotifications(subscription: Subscription) {
    if (Platform.OS === 'web') return;

    // Always clear existing notifications to prevent duplicates
    await this.cancelSubscriptionNotifications(subscription.id!);

    // Do not schedule if reminder is none or subscription is paused
    if (subscription.reminderOffset === 'none' || subscription.status === 'paused') return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notifications permissions are not granted. Aborting schedule.');
      return;
    }

    const targetDate = (subscription.isFreeTrial && subscription.trialEndDate) 
      ? subscription.trialEndDate.toDate() 
      : subscription.renewalDate.toDate();
      
    const today = new Date();
    
    // Do not schedule if the exact target time has already passed
    if (targetDate < today) return;

    const triggerDate = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);

    // Only schedule if the calculated trigger date is in the future
    if (triggerDate > today) {
      const isTrial = subscription.isFreeTrial && subscription.trialEndDate;
      const title = isTrial ? '🎁 Free Trial Expiring Tomorrow' : '💸 Upcoming Payment Alert';
      const body = isTrial 
        ? `Your free trial for ${subscription.name} ends tomorrow. Cancel now to avoid being automatically charged ${subscription.amount.toFixed(2)} ${subscription.currency}.`
        : `Your ${subscription.name} subscription is renewing tomorrow. You will be charged ${subscription.amount.toFixed(2)} ${subscription.currency}.`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { subscriptionId: subscription.id },
          sound: true,
        },
        trigger: {
          date: triggerDate,
        } as Notifications.DateTriggerInput,
      });
    }
  }

  static async rescheduleAll(subscriptions: Subscription[]) {
    if (Platform.OS === 'web') return;

    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const sub of subscriptions) {
      await this.scheduleSubscriptionNotifications(sub);
    }
  }
}
