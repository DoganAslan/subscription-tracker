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
const synchronizeError = () => new Error('Unable to synchronize subscriptions');
const refreshError = () => new Error('Unable to refresh subscriptions');

export function SubscriptionFeedProvider({
  children,
  repository = subscriptionRepository,
  userId,
}: SubscriptionFeedProviderProps) {
  const authUserId = useAuthStore((state) => state.user?.uid ?? null);
  const activeUserId = userId === undefined ? authUserId : userId;
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<string | null>(null);
  const lifecycleGenerationRef = useRef(0);
  const [status, setStatus] = useState<SubscriptionFeedStatus>(activeUserId ? 'loading' : 'idle');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // The generation is invalidated by the previous effect's cleanup. Do not
    // advance it here: descendant mount effects may call refresh() before this
    // passive effect runs, and their valid initial work must share this scope.
    const lifecycleGeneration = lifecycleGenerationRef.current;
    const previousUserId = previousUserIdRef.current;
    if (previousUserId && previousUserId !== activeUserId) {
      queryClient.removeQueries({ queryKey: subscriptionKeys.list(previousUserId), exact: true });
    }
    previousUserIdRef.current = activeUserId;

    if (!activeUserId) {
      setStatus('idle');
      setError(null);
      return () => {
        if (lifecycleGenerationRef.current === lifecycleGeneration) {
          lifecycleGenerationRef.current += 1;
        }
      };
    }

    setStatus('loading');
    setError(null);

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = repository.subscribe(
        activeUserId,
        (subscriptions: Subscription[]) => {
          if (lifecycleGenerationRef.current !== lifecycleGeneration) return;
          queryClient.setQueryData(subscriptionKeys.list(activeUserId), subscriptions);
          setStatus('success');
          setError(null);
        },
        () => {
          if (lifecycleGenerationRef.current !== lifecycleGeneration) return;
          setStatus('error');
          setError(synchronizeError());
        },
      );
    } catch {
      setStatus('error');
      setError(synchronizeError());
    }

    return () => {
      if (lifecycleGenerationRef.current === lifecycleGeneration) {
        lifecycleGenerationRef.current += 1;
      }
      unsubscribe?.();
    };
  }, [activeUserId, queryClient, repository]);

  useEffect(() => () => {
    previousUserIdRef.current = null;
  }, []);

  const refresh = useCallback(async () => {
    if (!activeUserId) return;
    const lifecycleGeneration = lifecycleGenerationRef.current;

    setStatus('loading');
    setError(null);

    try {
      const subscriptions = await repository.fetch(activeUserId);
      if (lifecycleGenerationRef.current !== lifecycleGeneration) return;
      queryClient.setQueryData(subscriptionKeys.list(activeUserId), subscriptions);
      setStatus('success');
      setError(null);
    } catch {
      if (lifecycleGenerationRef.current !== lifecycleGeneration) return;
      setStatus('error');
      setError(refreshError());
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
