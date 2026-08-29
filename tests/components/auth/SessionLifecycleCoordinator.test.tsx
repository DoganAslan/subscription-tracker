import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TestRenderer, { act } from 'react-test-renderer';
import { SessionLifecycleCoordinator } from '@/features/auth/application/SessionLifecycleCoordinator';
import { subscriptionKeys } from '@/features/subscriptions/application/subscriptionKeys';
import { useAuthStore } from '@/store/useAuthStore';

jest.mock('@/services/background/widgetSync', () => ({
  resetWidgetSync: jest.fn(),
  clearWidgetData: jest.fn(async () => null),
}));
jest.mock('@/store/useProfileStore', () => ({ useProfileStore: { getState: () => ({ resetProfile: jest.fn() }) } }));

describe('SessionLifecycleCoordinator', () => {
  afterEach(() => {
    act(() => {
      useAuthStore.setState({ user: null, isLoading: true });
    });
    jest.clearAllMocks();
  });

  it('isolates the previous account when logout and route-tree unmount happen in the same act', () => {
    act(() => {
      useAuthStore.setState({ user: { uid: 'user-a' } as never, isLoading: false });
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(subscriptionKeys.list('user-a'), [{ id: 'private-a' }]);
    const resetWidgetSync = jest.fn();
    const clearWidgetData = jest.fn(async () => null);
    let view!: TestRenderer.ReactTestRenderer;

    act(() => {
      view = TestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <SessionLifecycleCoordinator
            resetWidgetSync={resetWidgetSync}
            clearWidgetData={clearWidgetData}
          />
        </QueryClientProvider>,
      );
    });

    act(() => {
      useAuthStore.getState().setUser(null);
      view.unmount();
    });

    expect(queryClient.getQueryData(subscriptionKeys.list('user-a'))).toBeUndefined();
    expect(resetWidgetSync).toHaveBeenCalledTimes(1);
    expect(clearWidgetData).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });
});
