import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { t } from '@/locales/i18n';

Notifications.setNotificationHandler({
  handleNotification: () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
};

// Senior architectural shield: Alias it so any hook calling the old name works too!
export const requestPushPermissions = requestNotificationPermissions;

export const scheduleSubscriptionNotification = async (subscription: {
  id: string;
  name: string;
  nextBillingDate: string; // Expected format: YYYY-MM-DD
  price: string;
}) => {
  try {
    // 1. Web check: Browsers do not support native device background task scheduling
    if (Platform.OS === 'web') {
      console.log('🔔 Notification Engine: Web platform bypassed.');
      return null;
    }

    // 2. Clear any existing duplicate alert for this specific subscription id
    await Notifications.cancelScheduledNotificationAsync(subscription.id);

    // 3. Parse Target Billing Date
    const targetDate = new Date(subscription.nextBillingDate);

    // Safety check: If date parse fails, abort gracefully
    if (isNaN(targetDate.getTime())) return null;

    // 4. Set Alert Time to exactly 24 Hours PRIOR to renewal date
    const alertDate = new Date(targetDate.getTime());
    alertDate.setDate(alertDate.getDate() - 1);

    // Set explicit comfortable morning hour (10:00 AM Local time)
    alertDate.setHours(10, 0, 0, 0);

    const now = new Date();

    // 5. CRITICAL EDGE CASE FIX: If target alert is in the past, shift it intelligently
    if (alertDate.getTime() <= now.getTime()) {
      console.log(`⚠️ Alert time for [${subscription.name}] calculated in the past. Shifting trigger forward.`);

      // If the subscription renewal is literally tomorrow or today, fire alert 1 minute from now
      // This ensures the user is warned immediately instead of losing the alert entirely.
      alertDate.setTime(now.getTime() + 60 * 1000);
    }

    // 6. Register with the OS Native Scheduler
    const notificationId = await Notifications.scheduleNotificationAsync({
      id: subscription.id, // Direct mapping lets us cancel or update it later
      content: {
        title: '💳 Fatura Hatırlatıcı: ' + subscription.name,
        body: `Yarın ${subscription.price} tutarında ödemen gerçekleşecek. İptal etmek ister misin?`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { subscriptionId: subscription.id },
      },
      // Cross-platform trigger allocation
      trigger: {
        date: alertDate,
      },
    });

    console.log(`🚀 Notification successfully locked for [${subscription.name}] at: ${alertDate.toString()}`);
    return notificationId;

  } catch (error) {
    console.error('❌ Notification Scheduler Failed:', error);
    return null;
  }
};

export const cancelRenewalReminder = async (notifId?: string | null) => {
  if (Platform.OS === 'web' || !notifId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notifId);
    console.log(`[Push Disarmed] Cancelled ticket ${notifId}`);
  } catch (e) {
    console.warn('[Push Cancel Bypassed]:', e);
  }
};



