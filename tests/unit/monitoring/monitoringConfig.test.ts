jest.mock('@sentry/react-native', () => ({}));

import { shouldInitializeMonitoring } from '@/services/monitoring/sentry';

describe('monitoring release configuration', () => {
  it('does not initialize when the DSN is blank', () => {
    expect(
      shouldInitializeMonitoring({
        enabled: true,
        dsn: '',
        isDev: false,
        platform: 'android',
      }),
    ).toBe(false);
  });
});
