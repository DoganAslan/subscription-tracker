jest.mock('expo-notifications', () => ({
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  setNotificationHandler: jest.fn(),
}));

import {
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
});
