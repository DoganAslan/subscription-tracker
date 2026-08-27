import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import type { Subscription } from '@/services/firebase/types';
import { subscriptionRepository, type SubscriptionRepository } from '../data/subscriptionRepository';
import { subscriptionKeys } from './subscriptionKeys';

type SubscriptionFeedStatus = 'idle' | 'loading' | 'success' | 'error';

interface SubscriptionFeedContextValue {
  status: SubscriptionFeedStatus;
  error: Error | null;
  refresh: () => Promise<void>;
}

interface SubscriptionFeedProviderProps {
  children: React.ReactNode;
  repository?: SubscriptionRepository;
  userId?: string | null;
}

const SubscriptionFeedContext = createContext<SubscriptionFeedContextValue | null>(null);

export function SubscriptionFeedProvider({
  children,
  repository = subscriptionRepository,
  userId,
}: SubscriptionFeedProviderProps) {
  const authUserId = useAuthStore((state) => state.user?.uid ?? null);
  const activeUserId = userId === undefined ? authUserId : userId;
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<string | null>(null);
  const activeUserIdRef = useRef<string | null>(activeUserId);
  const [status, setStatus] = useState<SubscriptionFeedStatus>(activeUserId ? 'loading' : 'idle');
  const [error, setError] = useState<Error | null>(null);

  activeUserIdRef.current = activeUserId;

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    if (previousUserId && previousUserId !== activeUserId) {
      queryClient.removeQueries({ queryKey: subscriptionKeys.list(previousUserId), exact: true });
    }
    previousUserIdRef.current = activeUserId;

    if (!activeUserId) {
      setStatus('idle');
      setError(null);
      return;
    }

    let isCurrentListener = true;
    setStatus('loading');
    setError(null);

    const unsubscribe = repository.subscribe(
      activeUserId,
      (subscriptions: Subscription[]) => {
        if (!isCurrentListener) return;
        queryClient.setQueryData(subscriptionKeys.list(activeUserId), subscriptions);
        setStatus('success');
        setError(null);
      },
      (listenerError: Error) => {
        if (!isCurrentListener) return;
        setStatus('error');
        setError(listenerError);
      },
    );

    return () => {
      isCurrentListener = false;
      unsubscribe();
    };
  }, [activeUserId, queryClient, repository]);

  useEffect(() => () => {
    previousUserIdRef.current = null;
  }, []);

  const refresh = useCallback(async () => {
    if (!activeUserId) return;

    setStatus('loading');
    setError(null);

    try {
      const subscriptions = await repository.fetch(activeUserId);
      if (activeUserIdRef.current !== activeUserId) return;
      queryClient.setQueryData(subscriptionKeys.list(activeUserId), subscriptions);
      setStatus('success');
    } catch (refreshError) {
      if (activeUserIdRef.current !== activeUserId) return;
      setStatus('error');
      setError(refreshError instanceof Error ? refreshError : new Error('Unable to refresh subscriptions'));
    }
  }, [activeUserId, queryClient, repository]);

  return (
    <SubscriptionFeedContext.Provider value={{ status, error, refresh }}>
      {children}
    </SubscriptionFeedContext.Provider>
  );
}

export function useSubscriptionFeedStatus(): SubscriptionFeedContextValue {
  const context = useContext(SubscriptionFeedContext);
  if (!context) {
    throw new Error('useSubscriptionFeedStatus must be used inside SubscriptionFeedProvider');
  }
  return context;
}
