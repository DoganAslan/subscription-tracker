jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  init: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
  setUser: jest.fn(),
}));

import * as Sentry from '@sentry/react-native';
import {
  captureAppError,
  clearMonitoringContext,
  sanitizeEvent,
  shouldInitializeMonitoring,
} from '@/services/monitoring/sentry';

describe('privacy-preserving monitoring', () => {
  it('does not initialize outside an opted-in native production context', () => {
    expect(shouldInitializeMonitoring({ enabled: false, dsn: 'https://dsn', isDev: false, platform: 'android' })).toBe(false);
    expect(shouldInitializeMonitoring({ enabled: true, dsn: '', isDev: false, platform: 'android' })).toBe(false);
    expect(shouldInitializeMonitoring({ enabled: true, dsn: 'https://dsn', isDev: true, platform: 'android' })).toBe(false);
    expect(shouldInitializeMonitoring({ enabled: true, dsn: 'https://dsn', isDev: false, platform: 'web' })).toBe(false);
    expect(shouldInitializeMonitoring({ enabled: true, dsn: 'https://dsn', isDev: false, platform: 'ios' })).toBe(true);
  });

  it('drops an event containing identity, money, card-like values, prompts, and request data', () => {
    const sanitized = sanitizeEvent({
      user: { id: 'firebase-user-id', email: 'user@example.com' },
      request: { data: { amount: 19.99, cardNumber: '4111111111111111' } },
      breadcrumbs: [{ message: 'Netflix renewal 19.99 TRY' }],
      extra: { prompt: 'Should I buy Prime Video?' },
      message: 'The user entered user@example.com',
      contexts: { app: { name: 'SubMate' } },
      exception: { values: [{ type: 'Error', value: 'Subscription amount: 19.99' }] },
    } as never);

    expect(sanitized?.user).toBeUndefined();
    expect(sanitized?.request).toBeUndefined();
    expect(sanitized?.breadcrumbs).toEqual([]);
    expect(sanitized?.extra).toBeUndefined();
    expect(sanitized?.message).toBeUndefined();
    expect(sanitized?.contexts).toBeUndefined();
    expect(sanitized?.exception?.values?.[0]?.value).toBe('Application error');
  });

  it('does not capture or clear context before monitoring has been initialized', () => {
    captureAppError(new Error('sensitive error'), 'react_error_boundary');
    clearMonitoringContext();

    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.setUser).not.toHaveBeenCalled();
  });
});
