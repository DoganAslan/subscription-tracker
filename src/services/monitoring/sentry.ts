import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

export type MonitoringArea = 'react_error_boundary';

interface MonitoringConfig {
  enabled: boolean;
  dsn?: string;
  isDev: boolean;
  platform: string;
}

type SanitizableEvent = {
  breadcrumbs?: unknown[];
  contexts?: unknown;
  exception?: { values?: Record<string, unknown>[] };
  extra?: unknown;
  message?: unknown;
  request?: unknown;
  user?: unknown;
  [key: string]: unknown;
};

let monitoringInitialized = false;

const isTestEnvironment = () =>
  typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

/** Returns true only for an explicit native production opt-in with a DSN. */
export function shouldInitializeMonitoring({ enabled, dsn, isDev, platform }: MonitoringConfig): boolean {
  return enabled && Boolean(dsn?.trim()) && !isDev && platform !== 'web';
}

/**
 * Removes every free-form, identity, request, and contextual field before an
 * event can leave the device. The remaining exception is deliberately generic
 * so an error message cannot accidentally contain personal financial data.
 */
export function sanitizeEvent(event: SanitizableEvent): SanitizableEvent {
  const sanitizedExceptions = event.exception?.values?.map(value => ({
    type: typeof value.type === 'string' ? value.type : 'Error',
    value: 'Application error',
  }));

  return {
    ...event,
    user: undefined,
    request: undefined,
    extra: undefined,
    message: undefined,
    contexts: undefined,
    breadcrumbs: [],
    exception: sanitizedExceptions ? { values: sanitizedExceptions } : undefined,
  };
}

export function initializeMonitoring(enabled: boolean): void {
  if (monitoringInitialized || isTestEnvironment()) return;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (!shouldInitializeMonitoring({ enabled, dsn, isDev: __DEV__, platform: Platform.OS })) return;

  Sentry.init({
    dsn,
    enabled: true,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    maxBreadcrumbs: 0,
    beforeBreadcrumb: () => null,
    beforeSend: event => sanitizeEvent(event as unknown as SanitizableEvent) as unknown as typeof event,
  });
  monitoringInitialized = true;
}

export function captureAppError(_error: unknown, area: MonitoringArea): void {
  if (!monitoringInitialized) return;

  // A fixed error preserves no message, user input, financial data, or stack
  // payload supplied by the failing application path.
  Sentry.captureException(new Error('Application error'), { tags: { area } });
}

export function clearMonitoringContext(): void {
  if (!monitoringInitialized) return;

  Sentry.setUser(null);
  Sentry.setContext('account', null);
  Sentry.setTag('account_state', undefined);
}

/** Stops future telemetry as soon as the user withdraws diagnostics consent. */
export function disableMonitoring(): void {
  if (!monitoringInitialized) return;

  clearMonitoringContext();
  monitoringInitialized = false;
  void Sentry.close().catch(() => {
    // Diagnostics must never affect the app when the SDK cannot close cleanly.
  });
}
