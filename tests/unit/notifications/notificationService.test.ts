jest.mock('expo-notifications', () => ({
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  cancelScheduledNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

import * as Notifications from 'expo-notifications';
import {
  cancelSubscriptionReminders,
  getSubscriptionReminderIds,
  isNotificationPermissionGranted,
} from '@/services/notificationService';

describe('local notification contract', () => {
  it('uses stable unique identifiers per subscription', () => {
    expect(getSubscriptionReminderIds('sub-1')).toEqual({
      payment: 'submate:payment:sub-1',
      contract: 'submate:contract:sub-1',
    });
  });

  it('accepts iOS provisional authorization for local reminders', () => {
    expect(isNotificationPermissionGranted({ granted: false, ios: { status: 3 } } as never)).toBe(true);
  });

  it('cancels only the payment and contract reminders of one subscription', async () => {
    await cancelSubscriptionReminders('sub-1');

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('submate:payment:sub-1');
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('submate:contract:sub-1');
  });
});
