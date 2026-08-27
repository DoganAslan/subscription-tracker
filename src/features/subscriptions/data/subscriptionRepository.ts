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

export const subscriptionRepository: SubscriptionRepository = {
  subscribe: (userId, onData, onError) => SubscriptionService.subscribeToSubscriptions(userId, onData, onError),
  fetch: (userId) => SubscriptionService.getSubscriptions(userId),
};
