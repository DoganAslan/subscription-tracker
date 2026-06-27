import * as Notifications from 'expo-notifications';
import { parseSafeDate } from '@/utils/dateHelpers';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
};

export const scheduleSubscriptionAlert = async (subName: string, amount: number, currency: string, renewalDate: string | Date, isFreeTrial: boolean) => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Calculate target date: 24 hours before the renewal/expiration date
  const targetDate = parseSafeDate(renewalDate);
  targetDate.setDate(targetDate.getDate() - 1); // Subtract 1 day
  targetDate.setHours(10, 0, 0, 0); // Alert at 10:00 AM

  // If the target date is already in the past, don't schedule
  if (targetDate.getTime() < Date.now()) return;

  const title = isFreeTrial ? `🚨 Free Trial Expiring!` : `💳 Upcoming Payment`;
  const body = isFreeTrial 
    ? `Your free trial for ${subName} ends tomorrow. Cancel now to avoid being charged!` 
    : `Your ${subName} subscription will charge ${amount} ${currency} tomorrow.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      date: targetDate,
    },
  });
  
  console.log(`Notification scheduled for ${subName} on ${targetDate.toLocaleString()}`);
};
