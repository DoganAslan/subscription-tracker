import type { Subscription } from '@/services/firebase/types';

export const BACKGROUND_WIDGET_SYNC_TASK = 'BACKGROUND_WIDGET_SYNC_TASK';

export const updateWidgetData = async (
  _subscriptions: Subscription[],
  _baseCurrency = 'TRY',
  _language = 'tr',
) => null;

export const resetWidgetSync = () => undefined;
export const clearWidgetData = async (
  _targetBaseCurrency?: string,
  _targetLanguage?: string,
) => undefined;
export const triggerWidgetSync = async (_userId: string) => undefined;
export const registerBackgroundSync = async () => undefined;
