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
  daysBefore: number = 2
) => {
  if (Platform.OS === 'web') return;

  try {
    // Check permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    // Cancel existing notifications for this subscription to avoid duplicates
    await cancelSubscriptionNotifications(subscriptionId);

    // Calculate the trigger date
    const triggerDate = new Date(renewalDate);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    // Set notification time to 10:00 AM
    triggerDate.setHours(10, 0, 0, 0);

    // If the trigger date is in the past, don't schedule it
    if (triggerDate.getTime() <= Date.now()) {
      return;
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
      },
    });
    
    console.log(`Scheduled reminder for ${subscriptionName} at ${triggerDate.toLocaleString()}`);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};
