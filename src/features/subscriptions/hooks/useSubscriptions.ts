import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubscriptionService } from '@/services/firebase/firestore';
import { Subscription } from '@/services/firebase/types';
import { SubscriptionFormData } from '../schemas/subscription.schema';
import { Timestamp } from 'firebase/firestore';
import { useToastStore } from '@/store/useToastStore';
import { useAuthStore } from '@/store/useAuthStore';
import { NotificationService } from '@/features/notifications/services/notificationService';
import * as Haptics from 'expo-haptics';

// React Query Keys
export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  lists: () => [...subscriptionKeys.all, 'list'] as const,
  list: (userId: string) => [...subscriptionKeys.lists(), userId] as const,
};

export function useSubscriptions() {
  const user = useAuthStore(state => state.user);

  return useQuery({
    queryKey: subscriptionKeys.list(user?.uid || ''),
    queryFn: () => SubscriptionService.getSubscriptions(user!.uid),
    enabled: !!user?.uid, // Only fetch if user exists
  });
}

export function useAddSubscription() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const showToast = useToastStore(state => state.showToast);

  return useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      if (!user) throw new Error("Not authenticated");
      
      const payload = {
        ...data,
        notes: data.notes || '',
        renewalDate: Timestamp.fromDate(data.renewalDate),
        trialEndDate: data.trialEndDate ? Timestamp.fromDate(data.trialEndDate) : undefined,
      };
      
      const id = await SubscriptionService.addSubscription(user.uid, payload);
      return { id, payload };
    },
    onSuccess: (result) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.list(user!.uid) });
      showToast('Subscription added successfully', 'success');
      NotificationService.scheduleSubscriptionNotifications({ id: result.id, ...result.payload } as any);
    },
    onError: (error) => {
      showToast('Failed to add subscription', 'error');
      console.error(error);
    }
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const showToast = useToastStore(state => state.showToast);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SubscriptionFormData }) => {
      if (!user) throw new Error("Not authenticated");
      
      const payload = {
        ...data,
        notes: data.notes || '',
        renewalDate: Timestamp.fromDate(data.renewalDate),
        trialEndDate: data.trialEndDate ? Timestamp.fromDate(data.trialEndDate) : undefined,
      };
      
      await SubscriptionService.updateSubscription(user.uid, id, payload);
      return { id, payload };
    },
    onSuccess: (result) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.list(user!.uid) });
      showToast('Subscription updated', 'success');
      NotificationService.scheduleSubscriptionNotifications({ id: result.id, ...result.payload } as any);
    },
    onError: (error) => {
      showToast('Failed to update subscription', 'error');
      console.error(error);
    }
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const showToast = useToastStore(state => state.showToast);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      await SubscriptionService.deleteSubscription(user.uid, id);
      return id;
    },
    // Optimistic Update Implementation
    onMutate: async (deletedId) => {
      if (!user) return;
      
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: subscriptionKeys.list(user.uid) });
      
      // Snapshot the previous value
      const previousSubscriptions = queryClient.getQueryData<Subscription[]>(subscriptionKeys.list(user.uid));

      // Optimistically update to the new value
      if (previousSubscriptions) {
        queryClient.setQueryData<Subscription[]>(
          subscriptionKeys.list(user.uid),
          previousSubscriptions.filter(sub => sub.id !== deletedId)
        );
      }

      // Return a context object with the snapshotted value
      return { previousSubscriptions };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, deletedId, context) => {
      if (context?.previousSubscriptions && user) {
        queryClient.setQueryData(subscriptionKeys.list(user.uid), context.previousSubscriptions);
      }
      showToast('Failed to delete subscription', 'error');
    },
    // Always refetch after error or success to sync with server
    onSettled: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.list(user.uid) });
      }
    },
    onSuccess: (id) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showToast('Subscription removed', 'success');
      NotificationService.cancelSubscriptionNotifications(id);
    }
  });
}
