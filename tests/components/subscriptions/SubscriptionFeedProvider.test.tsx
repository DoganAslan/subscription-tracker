import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import { useEffect, type ReactElement } from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { SubscriptionFeedProvider, useSubscriptionFeedStatus } from '@/features/subscriptions/application/SubscriptionFeedProvider';
import { subscriptionKeys } from '@/features/subscriptions/application/subscriptionKeys';
import { subscriptionRepository, type SubscriptionRepository } from '@/features/subscriptions/data/subscriptionRepository';
import { useLiveSubscriptions, useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { SubscriptionService } from '@/services/firebase/firestore';
import type { Subscription } from '@/services/firebase/types';
import { useAuthStore } from '@/store/useAuthStore';

jest.mock('@/services/firebase/firestore', () => ({
  SubscriptionService: {
    subscribeToSubscriptions: jest.fn(),
    getSubscriptions: jest.fn(),
  },
}));

jest.mock('@/services/background/widgetSync', () => ({
  triggerWidgetSync: jest.fn(),
  updateWidgetData: jest.fn(),
}));

jest.mock('@/services/notificationService', () => ({
  scheduleSubReminder: jest.fn(),
  cancelSubReminder: jest.fn(),
  cancelContractDoomReminder: jest.fn(),
  scheduleContractDoomReminder: jest.fn(),
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

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
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

const createDeferred = <T,>(): Deferred<T> => {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
};

const getSafeErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

const renderWithAct = (element: ReactElement) => {
  let view!: TestRenderer.ReactTestRenderer;
  act(() => {
    view = TestRenderer.create(element);
  });
  return view;
};

const unmountWithAct = (view: TestRenderer.ReactTestRenderer) => {
  act(() => {
    view.unmount();
  });
};

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
  afterEach(() => {
    act(() => {
      useAuthStore.setState({ user: null });
    });
    jest.clearAllMocks();
  });

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
    expect(getSafeErrorMessage(latestSnapshot?.error)).toBe('Unable to synchronize subscriptions');
    expect(queryClient.getQueryData(subscriptionKeys.list('user-b'))).toEqual(refreshedSubscriptions);

    act(() => {
      view.unmount();
    });
    expect(unsubscribers.get('user-b')).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });

  it('ignores a refresh resolution after unmount', async () => {
    const refresh = createDeferred<Subscription[]>();
    const repository: SubscriptionRepository = {
      subscribe: () => jest.fn(),
      fetch: () => refresh.promise,
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let latestSnapshot: FeedSnapshot | undefined;
    const view = renderWithAct(
      <QueryClientProvider client={queryClient}>
        <SubscriptionFeedProvider repository={repository} userId="user-a">
          <FeedProbe onSnapshot={(snapshot) => { latestSnapshot = snapshot; }} />
        </SubscriptionFeedProvider>
      </QueryClientProvider>,
    );

    act(() => {
      void latestSnapshot?.refresh();
      view.unmount();
    });
    await act(async () => {
      refresh.resolve([makeSubscription('late-a')]);
      await refresh.promise;
    });

    expect(queryClient.getQueryData(subscriptionKeys.list('user-a'))).toBeUndefined();
    queryClient.clear();
  });

  it('characterizes that a refresh resolution after a UID switch cannot restore the old UID cache', async () => {
    const refresh = createDeferred<Subscription[]>();
    const repository: SubscriptionRepository = {
      subscribe: () => jest.fn(),
      fetch: () => refresh.promise,
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let latestSnapshot: FeedSnapshot | undefined;
    const renderFeed = (userId: string) => (
      <QueryClientProvider client={queryClient}>
        <SubscriptionFeedProvider repository={repository} userId={userId}>
          <FeedProbe onSnapshot={(snapshot) => { latestSnapshot = snapshot; }} />
        </SubscriptionFeedProvider>
      </QueryClientProvider>
    );
    const view = renderWithAct(renderFeed('user-a'));

    act(() => {
      void latestSnapshot?.refresh();
      view.update(renderFeed('user-b'));
    });
    await act(async () => {
      refresh.resolve([makeSubscription('late-a')]);
      await refresh.promise;
    });

    expect(queryClient.getQueryData(subscriptionKeys.list('user-a'))).toBeUndefined();
    unmountWithAct(view);
    queryClient.clear();
  });

  it('clears a listener error emitted while an in-flight refresh later succeeds', async () => {
    let listener: Listener | undefined;
    const refresh = createDeferred<Subscription[]>();
    const repository: SubscriptionRepository = {
      subscribe: (_userId, onData, onError) => {
        listener = { onData, onError };
        return jest.fn();
      },
      fetch: () => refresh.promise,
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let latestSnapshot: FeedSnapshot | undefined;
    const view = renderWithAct(
      <QueryClientProvider client={queryClient}>
        <SubscriptionFeedProvider repository={repository} userId="user-a">
          <FeedProbe onSnapshot={(snapshot) => { latestSnapshot = snapshot; }} />
        </SubscriptionFeedProvider>
      </QueryClientProvider>,
    );

    act(() => {
      void latestSnapshot?.refresh();
      listener?.onError(new Error('Firebase permission-denied'));
    });
    expect(latestSnapshot?.status).toBe('error');
    await act(async () => {
      refresh.resolve([makeSubscription('refresh-success')]);
      await refresh.promise;
    });

    expect(latestSnapshot?.status).toBe('success');
    expect(latestSnapshot?.error).toBeNull();
    unmountWithAct(view);
    queryClient.clear();
  });

  it('turns a synchronous listener setup failure into safe feed error state', () => {
    const repository: SubscriptionRepository = {
      subscribe: () => {
        throw Object.assign(new Error('Firebase native exception'), { code: 'permission-denied' });
      },
      fetch: async () => [],
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let latestSnapshot: FeedSnapshot | undefined;

    let view: TestRenderer.ReactTestRenderer | undefined;
    expect(() => {
      view = renderWithAct(
        <QueryClientProvider client={queryClient}>
          <SubscriptionFeedProvider repository={repository} userId="user-a">
            <FeedProbe onSnapshot={(snapshot) => { latestSnapshot = snapshot; }} />
          </SubscriptionFeedProvider>
        </QueryClientProvider>,
      );
    }).not.toThrow();

    expect(latestSnapshot?.status).toBe('error');
    expect(getSafeErrorMessage(latestSnapshot?.error)).toBe('Unable to synchronize subscriptions');
    if (view) unmountWithAct(view);
    queryClient.clear();
  });

  it('turns a refresh rejection into safe feed error state', async () => {
    const repository: SubscriptionRepository = {
      subscribe: () => jest.fn(),
      fetch: async () => {
        throw Object.assign(new Error('Firebase native refresh failure'), { code: 'unavailable' });
      },
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let latestSnapshot: FeedSnapshot | undefined;
    const view = renderWithAct(
      <QueryClientProvider client={queryClient}>
        <SubscriptionFeedProvider repository={repository} userId="user-a">
          <FeedProbe onSnapshot={(snapshot) => { latestSnapshot = snapshot; }} />
        </SubscriptionFeedProvider>
      </QueryClientProvider>,
    );

    await act(async () => {
      await latestSnapshot?.refresh();
    });

    expect(latestSnapshot?.status).toBe('error');
    expect(getSafeErrorMessage(latestSnapshot?.error)).toBe('Unable to refresh subscriptions');
    unmountWithAct(view);
    queryClient.clear();
  });

  it('uses explicit null as signed out and undefined as the auth UID', () => {
    act(() => {
      useAuthStore.setState({ user: { uid: 'auth-user' } as never });
    });
    const subscribe = jest.fn(() => jest.fn());
    const repository: SubscriptionRepository = { subscribe, fetch: async () => [] };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const renderFeed = (userId?: string | null) => (
      <QueryClientProvider client={queryClient}>
        <SubscriptionFeedProvider repository={repository} userId={userId}>
          <Text>feed</Text>
        </SubscriptionFeedProvider>
      </QueryClientProvider>
    );

    const view = renderWithAct(renderFeed(null));
    expect(subscribe).not.toHaveBeenCalled();
    act(() => {
      view.update(renderFeed(undefined));
    });

    expect(subscribe).toHaveBeenCalledWith('auth-user', expect.any(Function), expect.any(Function));
    unmountWithAct(view);
    queryClient.clear();
  });
});

function SubscriptionQueryProbe({
  live,
  onQuery,
}: {
  live: boolean;
  onQuery: (query: ReturnType<typeof useSubscriptions>) => void;
}) {
  const query = live ? useLiveSubscriptions() : useSubscriptions();

  useEffect(() => {
    onQuery(query);
  }, [onQuery, query]);

  return <Text>{query.data?.length ?? 0}</Text>;
}

describe('subscription cache observer hooks', () => {
  afterEach(() => {
    act(() => {
      useAuthStore.setState({ user: null });
    });
    jest.clearAllMocks();
  });

  it('keeps useSubscriptions disabled until its caller explicitly refetches', async () => {
    act(() => {
      useAuthStore.setState({ user: { uid: 'user-a' } as never });
    });
    const subscriptions = [makeSubscription('manual-refetch')];
    jest.mocked(SubscriptionService.getSubscriptions).mockResolvedValue(subscriptions);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let latestQuery: ReturnType<typeof useSubscriptions> | undefined;
    const view = renderWithAct(
      <QueryClientProvider client={queryClient}>
        <SubscriptionQueryProbe live={false} onQuery={(query) => { latestQuery = query; }} />
      </QueryClientProvider>,
    );

    expect(SubscriptionService.getSubscriptions).not.toHaveBeenCalled();
    await act(async () => {
      await latestQuery?.refetch();
    });

    expect(SubscriptionService.getSubscriptions).toHaveBeenCalledWith('user-a');
    expect(queryClient.getQueryData(subscriptionKeys.list('user-a'))).toEqual(subscriptions);
    unmountWithAct(view);
    queryClient.clear();
  });

  it('keeps the deprecated live alias as a cache observer without a listener', () => {
    act(() => {
      useAuthStore.setState({ user: { uid: 'user-a' } as never });
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = renderWithAct(
      <QueryClientProvider client={queryClient}>
        <SubscriptionQueryProbe live onQuery={() => undefined} />
      </QueryClientProvider>,
    );

    expect(SubscriptionService.subscribeToSubscriptions).not.toHaveBeenCalled();
    unmountWithAct(view);
    queryClient.clear();
  });
});

describe('subscriptionRepository error boundary', () => {
  afterEach(() => jest.clearAllMocks());

  it('normalizes Firebase fetch and listener setup errors', async () => {
    const vendorError = Object.assign(new Error('Firebase permission-denied'), { code: 'permission-denied' });
    jest.mocked(SubscriptionService.getSubscriptions).mockRejectedValue(vendorError);
    jest.mocked(SubscriptionService.subscribeToSubscriptions).mockImplementation(() => {
      throw vendorError;
    });
    const onError = jest.fn();

    const fetchError = await subscriptionRepository.fetch('user-a').catch((error: unknown) => error);
    expect(fetchError).toBeInstanceOf(Error);
    expect(fetchError).toHaveProperty('message', 'Unable to load subscriptions');
    expect(fetchError).not.toHaveProperty('code');
    const unsubscribe = subscriptionRepository.subscribe('user-a', () => undefined, onError);

    const listenerError = onError.mock.calls[0]?.[0];
    expect(listenerError).toBeInstanceOf(Error);
    expect(listenerError).toHaveProperty('message', 'Unable to synchronize subscriptions');
    expect(listenerError).not.toHaveProperty('code');
    expect(unsubscribe).toBeInstanceOf(Function);
  });

  it('normalizes Firebase listener callback errors', () => {
    const vendorError = Object.assign(new Error('Firebase native callback'), { code: 'unavailable' });
    jest.mocked(SubscriptionService.subscribeToSubscriptions).mockImplementation((_userId, _onData, onError) => {
      onError?.(vendorError);
      return jest.fn();
    });
    const onError = jest.fn();

    subscriptionRepository.subscribe('user-a', () => undefined, onError);

    const listenerError = onError.mock.calls[0]?.[0];
    expect(listenerError).toBeInstanceOf(Error);
    expect(listenerError).toHaveProperty('message', 'Unable to synchronize subscriptions');
    expect(listenerError).not.toHaveProperty('code');
  });
});
