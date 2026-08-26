import * as Sentry from '@sentry/react-native';

let monitoringInitialized = false;

export function initializeMonitoring(): void {
  if (monitoringInitialized) return;
  monitoringInitialized = true;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    enabled: !__DEV__,
    sendDefaultPii: false,
    tracesSampleRate: 0.05,
    maxBreadcrumbs: 30,
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'console') return null;
      return { ...breadcrumb, data: undefined };
    },
    beforeSend(event) {
      return {
        ...event,
        user: event.user?.id ? { id: event.user.id } : undefined,
        request: event.request
          ? { method: event.request.method, url: event.request.url }
          : undefined,
        breadcrumbs: event.breadcrumbs?.map(breadcrumb => ({
          ...breadcrumb,
          data: undefined,
        })),
      };
    },
  });
}

export function captureAppError(error: unknown, area: string): void {
  if (__DEV__) return;
  Sentry.captureException(error, {
    tags: { area },
  });
}

