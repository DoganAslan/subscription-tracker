import React from 'react';
import { Timestamp } from 'firebase/firestore';
import TestRenderer, { act } from 'react-test-renderer';
import { WidgetSyncBridge } from '@/services/background/WidgetSyncBridge';
import type { Subscription } from '@/services/firebase/types';

jest.mock('@/services/background/widgetSync', () => ({
  updateWidgetData: jest.fn(async () => null),
}));

jest.mock('@/features/subscriptions/hooks/useSubscriptions', () => ({
  useSubscriptions: jest.fn(() => ({ data: undefined })),
}));

jest.mock('@/store/useCurrencyStore', () => ({
  useCurrencyStore: jest.fn(() => 'TRY'),
}));

jest.mock('@/context/LanguageContext', () => ({
  useTranslation: jest.fn(() => ({ currentLanguage: 'tr' })),
}));

const makeSubscription = (amount: number, id = 'netflix'): Subscription => ({
  id,
  name: id === 'netflix' ? 'Netflix' : 'Spotify',
  category: 'Entertainment',
  amount,
  currency: 'TRY',
  billingCycle: 'monthly',
  renewalDate: Timestamp.fromDate(new Date('2026-09-01T00:00:00.000Z')),
  notes: null,
  createdAt: Timestamp.fromDate(new Date('2026-08-01T00:00:00.000Z')),
  updatedAt: Timestamp.fromDate(new Date('2026-08-01T00:00:00.000Z')),
});

describe('WidgetSyncBridge', () => {
  it('schedules once per distinct subscription, currency, and language snapshot', () => {
    const scheduleUpdate = jest.fn(async () => null);
    const initialSubscriptions = [makeSubscription(200), makeSubscription(15, 'spotify')];
    const renderBridge = (subscriptions: Subscription[], baseCurrency: string, language: string) => (
      <WidgetSyncBridge
        subscriptions={subscriptions}
        baseCurrency={baseCurrency}
        language={language}
        scheduleUpdate={scheduleUpdate}
      />
    );

    let view!: TestRenderer.ReactTestRenderer;
    act(() => {
      view = TestRenderer.create(renderBridge(initialSubscriptions, 'TRY', 'tr'));
    });
    expect(scheduleUpdate).toHaveBeenCalledTimes(1);
    expect(scheduleUpdate).toHaveBeenLastCalledWith(initialSubscriptions, 'TRY', 'tr');

    act(() => {
      view.update(renderBridge([makeSubscription(200), makeSubscription(15, 'spotify')], 'TRY', 'tr'));
    });
    expect(scheduleUpdate).toHaveBeenCalledTimes(1);

    act(() => {
      view.update(renderBridge([makeSubscription(15, 'spotify'), makeSubscription(200)], 'TRY', 'tr'));
    });
    expect(scheduleUpdate).toHaveBeenCalledTimes(1);

    act(() => {
      view.update(renderBridge([makeSubscription(250), makeSubscription(15, 'spotify')], 'TRY', 'tr'));
    });
    expect(scheduleUpdate).toHaveBeenCalledTimes(2);

    act(() => {
      view.update(renderBridge([makeSubscription(250), makeSubscription(15, 'spotify')], 'USD', 'tr'));
    });
    expect(scheduleUpdate).toHaveBeenCalledTimes(3);

    act(() => {
      view.update(renderBridge([makeSubscription(250), makeSubscription(15, 'spotify')], 'USD', 'en'));
    });
    expect(scheduleUpdate).toHaveBeenCalledTimes(4);

    act(() => {
      view.unmount();
    });
    expect(scheduleUpdate).toHaveBeenCalledTimes(4);
  });
});
