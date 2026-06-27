import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const getNotifId = (subId: string): string => `sub_remind_${subId}`;

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

export const cancelSubReminder = async (subId: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  
  try {
    await Notifications.cancelScheduledNotificationAsync(getNotifId(subId));
  } catch (error) {
    // Silently handle if it wasn't scheduled
  }
};

export const scheduleSubReminder = async (subscription: any, nextRenewalDate: Date): Promise<void> => {
  if (Platform.OS === 'web' || subscription.isPaused === true) return;

  // Cancel any existing reminder first using deterministic ID
  await cancelSubReminder(subscription.id);

  // Calculate Trigger Date: 2 Days before nextRenewalDate at strictly 09:00:00 AM
  const triggerDate = new Date(nextRenewalDate);
  triggerDate.setDate(triggerDate.getDate() - 2);
  triggerDate.setHours(9, 0, 0, 0);

  // Guard against retroactive spam (past dates)
  if (triggerDate.getTime() <= Date.now()) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    identifier: getNotifId(subscription.id),
    content: {
      title: "⏳ Ödeme Hatırlatıcı",
      body: `${subscription.name} yenilenmesine 2 gün kaldı!`,
      sound: true,
    },
    trigger: {
      date: triggerDate,
    },
  });
};

export const resyncAllReminders = async (subscriptions: any[]): Promise<void> => {
  if (Platform.OS === 'web') return;

  try {
    // Master Recovery: Wipe slate clean
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Reschedule valid futures
    if (subscriptions && Array.isArray(subscriptions)) {
      for (const sub of subscriptions) {
        if (!sub.isPaused && sub.renewalDate) {
          // Note: using the specific parsing logic or assuming renewalDate is a Date/Timestamp
          const rawDate = typeof sub.renewalDate?.toDate === 'function' 
            ? sub.renewalDate.toDate() 
            : new Date(sub.renewalDate);
          
          await scheduleSubReminder(sub, rawDate);
        }
      }
    }
  } catch (error) {
    console.error('Failed to resync reminders:', error);
  }
};

export const scheduleContractDoomReminder = async (subscription: any) => {
  if (Platform.OS === 'web') return;
  if (!subscription.contractEndDate) return;

  const contractDate = new Date(
    typeof subscription.contractEndDate?.toDate === 'function' 
      ? subscription.contractEndDate.toDate() 
      : subscription.contractEndDate
  );
  
  if (isNaN(contractDate.getTime())) return;

  const triggerDate = new Date(contractDate);
  triggerDate.setDate(triggerDate.getDate() - 7);
  triggerDate.setHours(9, 0, 0, 0);

  if (triggerDate.getTime() <= Date.now()) return;

  try {
    const identifier = `sub_contract_doom_${subscription.id}`;
    
    await cancelSubReminder(identifier);
    await Notifications.cancelScheduledNotificationAsync(identifier);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Taahhüt Bitiş Uyarısı',
        body: `${subscription.name} aboneliğinizin taahhüdü 7 gün sonra bitiyor. Fiyat artışına dikkat edin!`,
        sound: true,
        data: { subscriptionId: subscription.id, type: 'contract_doom' },
      },
      trigger: triggerDate,
      identifier: identifier
    });
  } catch (error) {
    console.error('Failed to schedule contract doom reminder:', error);
  }
};

