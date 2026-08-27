import { SubscriptionService } from '@/services/firebase/firestore';
import type { Subscription } from '@/services/firebase/types';

export interface SubscriptionRepository {
  subscribe(
    userId: string,
    onData: (subscriptions: Subscription[]) => void,
    onError: (error: Error) => void,
  ): () => void;
  fetch(userId: string): Promise<Subscription[]>;
}

const loadError = () => new Error('Unable to load subscriptions');
const synchronizeError = () => new Error('Unable to synchronize subscriptions');

export const subscriptionRepository: SubscriptionRepository = {
  subscribe: (userId, onData, onError) => {
    try {
      return SubscriptionService.subscribeToSubscriptions(userId, onData, () => {
        onError(synchronizeError());
      });
    } catch {
      onError(synchronizeError());
      return () => undefined;
    }
  },
  fetch: async (userId) => {
    try {
      return await SubscriptionService.getSubscriptions(userId);
    } catch {
      throw loadError();
    }
  },
};
