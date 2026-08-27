import React from 'react';
import { Timestamp } from 'firebase/firestore';
import TestRenderer, { act } from 'react-test-renderer';
import { WidgetSyncBridge } from '@/services/background/WidgetSyncBridge';
import type { Subscription } from '@/services/firebase/types';

jest.mock('@/services/background/widgetSync', () => ({
  updateWidgetData: jest.fn(async () => null),
  resetWidgetSync: jest.fn(),
  clearWidgetData: jest.fn(async () => null),
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

jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: jest.fn(() => null),
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
        userId="user-a"
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

  it('resets across UID changes, persists a neutral widget on logout, and waits for the next signed-in snapshot', () => {
    const scheduleUpdate = jest.fn(async () => null);
    const resetWidgetSync = jest.fn();
    const clearWidgetData = jest.fn(async () => null);
    const renderBridge = (userId: string | null, subscriptions?: Subscription[]) => (
      <WidgetSyncBridge
        userId={userId}
        subscriptions={subscriptions}
        baseCurrency="TRY"
        language="tr"
        scheduleUpdate={scheduleUpdate}
        resetWidgetSync={resetWidgetSync}
        clearWidgetData={clearWidgetData}
      />
    );

    let view!: TestRenderer.ReactTestRenderer;
    act(() => {
      view = TestRenderer.create(renderBridge('user-a', [makeSubscription(200)]));
    });
    expect(scheduleUpdate).toHaveBeenCalledTimes(1);
    expect(clearWidgetData).not.toHaveBeenCalled();

    act(() => {
      view.update(renderBridge(null, [makeSubscription(200)]));
    });
    expect(resetWidgetSync).toHaveBeenCalledTimes(1);
    expect(clearWidgetData).toHaveBeenCalledWith('TRY', 'tr');
    expect(scheduleUpdate).toHaveBeenCalledTimes(1);

    act(() => {
      view.update(renderBridge('user-b'));
    });
    expect(resetWidgetSync).toHaveBeenCalledTimes(2);
    expect(clearWidgetData).toHaveBeenCalledTimes(1);
    expect(scheduleUpdate).toHaveBeenCalledTimes(1);

    act(() => {
      view.update(renderBridge('user-b', [makeSubscription(300)]));
    });
    expect(scheduleUpdate).toHaveBeenCalledTimes(2);

    act(() => {
      view.unmount();
    });
  });

  it('does not clear widget data merely because a signed-in cache starts undefined', () => {
    const clearWidgetData = jest.fn(async () => null);
    let view!: TestRenderer.ReactTestRenderer;
    act(() => {
      view = TestRenderer.create(
        <WidgetSyncBridge
          userId="user-a"
          baseCurrency="TRY"
          language="tr"
          clearWidgetData={clearWidgetData}
        />,
      );
    });

    expect(clearWidgetData).not.toHaveBeenCalled();
    act(() => {
      view.unmount();
    });
  });

  it('schedules when only a legacy split-member amount changes', () => {
    const scheduleUpdate = jest.fn(async () => null);
    const legacySubscription = (amount: number) => ({
      ...makeSubscription(100),
      isSplit: true,
      splitMembers: [{
        id: 'member-a',
        name: 'Ada',
        phone: '905550000000',
        shareAmount: undefined,
        amount,
        isPaid: false,
      }],
    }) as unknown as Subscription;

    let view!: TestRenderer.ReactTestRenderer;
    act(() => {
      view = TestRenderer.create(
        <WidgetSyncBridge userId="user-a" subscriptions={[legacySubscription(25)]} baseCurrency="TRY" language="tr" scheduleUpdate={scheduleUpdate} />,
      );
    });
    act(() => {
      view.update(
        <WidgetSyncBridge userId="user-a" subscriptions={[legacySubscription(30)]} baseCurrency="TRY" language="tr" scheduleUpdate={scheduleUpdate} />,
      );
    });

    expect(scheduleUpdate).toHaveBeenCalledTimes(2);
    act(() => {
      view.unmount();
    });
  });
});
