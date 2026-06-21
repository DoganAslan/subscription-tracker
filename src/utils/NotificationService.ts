import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set up the default notification handler to display notifications even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests notification permissions from the user.
 * Call this when the app initializes or when adding the first subscription.
 */
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }
  
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }
  
  return true;
};

/**
 * Cancels all previously scheduled notifications for a specific subscription.
 * This should be called before updating a subscription or when deleting one.
 */
export const cancelSubscriptionNotifications = async (subscriptionId: string) => {
  if (Platform.OS === 'web') return;

  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.subscriptionId === subscriptionId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

/**
 * Schedules a local push notification for a subscription renewal.
 * @param subscriptionId The unique ID of the subscription (for cancellation purposes)
 * @param subscriptionName The name of the subscription
 * @param renewalDate The date of the renewal
 * @param daysBefore How many days before the renewal date to send the reminder
 */
export const scheduleRenewalReminder = async (
  subscriptionId: string,
  subscriptionName: string,
  renewalDate: Date,
  daysBefore: number = 2,
  billingCycle: string = 'monthly'
): Promise<Date | null> => {
  if (Platform.OS === 'web') return null;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    await cancelSubscriptionNotifications(subscriptionId);

    let targetDate = new Date(renewalDate);
    targetDate.setHours(9, 0, 0, 0); // Default to 9:00 AM

    let triggerDate = new Date(targetDate);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);

    const today = new Date();

    if (triggerDate.getTime() <= today.getTime()) {
      while (triggerDate.getTime() <= today.getTime()) {
        if (billingCycle === 'weekly') {
          targetDate.setDate(targetDate.getDate() + 7);
        } else if (billingCycle === 'monthly') {
          targetDate.setMonth(targetDate.getMonth() + 1);
        } else if (billingCycle === 'quarterly') {
          targetDate.setMonth(targetDate.getMonth() + 3);
        } else if (billingCycle === 'biannually') {
          targetDate.setMonth(targetDate.getMonth() + 6);
        } else if (billingCycle === 'yearly') {
          targetDate.setFullYear(targetDate.getFullYear() + 1);
        } else if (billingCycle === 'biennially') {
          targetDate.setFullYear(targetDate.getFullYear() + 2);
        } else {
          targetDate.setMonth(targetDate.getMonth() + 1);
        }
        triggerDate = new Date(targetDate);
        triggerDate.setDate(triggerDate.getDate() - daysBefore);
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Upcoming Subscription Renewal 🔔',
        body: `Your ${subscriptionName} subscription will renew in ${daysBefore} days.`,
        data: { subscriptionId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'default',
      },
    });
    
    console.log(`Scheduled reminder for ${subscriptionName} at ${triggerDate.toLocaleString()}`);
    return triggerDate;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};
