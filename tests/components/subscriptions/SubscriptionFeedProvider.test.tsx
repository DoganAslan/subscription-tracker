import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import { useEffect } from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { SubscriptionFeedProvider, useSubscriptionFeedStatus } from '@/features/subscriptions/application/SubscriptionFeedProvider';
import { subscriptionKeys } from '@/features/subscriptions/application/subscriptionKeys';
import type { SubscriptionRepository } from '@/features/subscriptions/data/subscriptionRepository';
import type { Subscription } from '@/services/firebase/types';

jest.mock('@/services/firebase/firestore', () => ({
  SubscriptionService: {
    subscribeToSubscriptions: jest.fn(),
    getSubscriptions: jest.fn(),
  },
}));

interface Listener {
  onData: (subscriptions: Subscription[]) => void;
  onError: (error: Error) => void;
}

interface FeedSnapshot {
  status: ReturnType<typeof useSubscriptionFeedStatus>['status'];
  error: ReturnType<typeof useSubscriptionFeedStatus>['error'];
  refresh: ReturnType<typeof useSubscriptionFeedStatus>['refresh'];
}

const makeSubscription = (id: string): Subscription => ({
  id,
  name: id,
  category: 'Entertainment',
  amount: 10,
  currency: 'TRY',
  billingCycle: 'monthly',
  renewalDate: Timestamp.now(),
  notes: null,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

function FeedProbe({ onSnapshot }: { onSnapshot: (snapshot: FeedSnapshot) => void }) {
  const status = useSubscriptionFeedStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    onSnapshot({
      status: status.status,
      error: status.error,
      refresh: status.refresh,
    });
  }, [onSnapshot, status.error, status.refresh, status.status]);

  return <Text testID="cache-size">{queryClient.getQueryCache().getAll().length}</Text>;
}

describe('SubscriptionFeedProvider', () => {
  it('owns one UID-scoped listener, writes snapshots, refreshes on demand, and preserves data on errors', async () => {
    const listeners = new Map<string, Listener>();
    const unsubscribers = new Map<string, jest.Mock>();
    const subscribe = jest.fn((userId: string, onData: Listener['onData'], onError: Listener['onError']) => {
      listeners.set(userId, { onData, onError });
      const unsubscribe = jest.fn();
      unsubscribers.set(userId, unsubscribe);
      return unsubscribe;
    });
    const refreshedSubscriptions = [makeSubscription('user-b-refresh')];
    const fetch = jest.fn(async () => refreshedSubscriptions);
    const repository: SubscriptionRepository = { subscribe, fetch };
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    let latestSnapshot: FeedSnapshot | undefined;
    const onSnapshot = (snapshot: FeedSnapshot) => {
      latestSnapshot = snapshot;
    };

    const renderFeed = (userId: string) => (
      <QueryClientProvider client={queryClient}>
        <SubscriptionFeedProvider repository={repository} userId={userId}>
          <FeedProbe onSnapshot={onSnapshot} />
        </SubscriptionFeedProvider>
      </QueryClientProvider>
    );

    let view: TestRenderer.ReactTestRenderer;
    act(() => {
      view = TestRenderer.create(renderFeed('user-a'));
    });

    act(() => {
      view.update(renderFeed('user-a'));
    });

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();

    const aSubscriptions = [makeSubscription('a-1')];
    act(() => listeners.get('user-a')?.onData(aSubscriptions));
    expect(queryClient.getQueryData(subscriptionKeys.list('user-a'))).toEqual(aSubscriptions);

    act(() => {
      view.update(renderFeed('user-b'));
    });

    expect(unsubscribers.get('user-a')).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(subscriptionKeys.list('user-a'))).toBeUndefined();
    expect(subscribe).toHaveBeenCalledTimes(2);

    const bSubscriptions = [makeSubscription('b-1')];
    act(() => listeners.get('user-b')?.onData(bSubscriptions));
    expect(queryClient.getQueryData(subscriptionKeys.list('user-b'))).toEqual(bSubscriptions);

    await act(async () => {
      await latestSnapshot?.refresh();
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('user-b');
    expect(subscribe).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(subscriptionKeys.list('user-b'))).toEqual(refreshedSubscriptions);

    const listenerError = new Error('listener failed');
    act(() => listeners.get('user-b')?.onError(listenerError));
    expect(latestSnapshot?.status).toBe('error');
    expect(latestSnapshot?.error).toBe(listenerError);
    expect(queryClient.getQueryData(subscriptionKeys.list('user-b'))).toEqual(refreshedSubscriptions);

    act(() => {
      view.unmount();
    });
    expect(unsubscribers.get('user-b')).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });
});
