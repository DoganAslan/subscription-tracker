import { readFileSync } from 'node:fs';

describe('notification startup ownership', () => {
  it('does not request notification permission during root startup', () => {
    const root = readFileSync('src/app/_layout.tsx', 'utf8');

    expect(root).not.toContain('registerForPushNotificationsAsync');
    expect(root).not.toContain('requestNotificationPermissions()');
  });
});
