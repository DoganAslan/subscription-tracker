import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TestRenderer, { act } from 'react-test-renderer';
import { SessionLifecycleCoordinator } from '@/features/auth/application/SessionLifecycleCoordinator';
import { subscriptionKeys } from '@/features/subscriptions/application/subscriptionKeys';
import { cardKeys } from '@/features/cards/application/cardKeys';
import { useAuthStore } from '@/store/useAuthStore';

jest.mock('@/services/background/widgetSync', () => ({ resetWidgetSync: jest.fn(), clearWidgetData: jest.fn(async () => null) }));
jest.mock('@/store/useProfileStore', () => ({ useProfileStore: { getState: () => ({ resetProfile: jest.fn() }) } }));

describe('cross-account isolation', () => {
  afterEach(() => { act(() => useAuthStore.setState({ user: null, isLoading: true })); jest.clearAllMocks(); });
  it('clears user A subscriptions, cards, profile, and widget before user B renders', () => {
    act(() => useAuthStore.setState({ user: { uid: 'user-a' } as never, isLoading: false }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(subscriptionKeys.list('user-a'), [{ id: 'private-subscription-a' }]);
    queryClient.setQueryData(cardKeys.list('user-a'), [{ id: 'private-card-a' }]);
    const resetProfile = jest.fn(); const resetWidgetSync = jest.fn(); const clearWidgetData = jest.fn(async () => null);
    let view!: TestRenderer.ReactTestRenderer;
    act(() => { view = TestRenderer.create(<QueryClientProvider client={queryClient}><SessionLifecycleCoordinator resetProfile={resetProfile} resetWidgetSync={resetWidgetSync} clearWidgetData={clearWidgetData} /></QueryClientProvider>); });
    act(() => useAuthStore.getState().setUser({ uid: 'user-b' } as never));
    expect(queryClient.getQueryData(subscriptionKeys.list('user-a'))).toBeUndefined();
    expect(queryClient.getQueryData(cardKeys.list('user-a'))).toBeUndefined();
    expect(resetProfile).toHaveBeenCalledTimes(1);
    expect(resetWidgetSync).toHaveBeenCalledTimes(1);
    expect(clearWidgetData).toHaveBeenCalledTimes(1);
    act(() => view.unmount());
    queryClient.clear();
  });
});
