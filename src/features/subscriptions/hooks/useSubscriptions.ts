import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubscriptionService } from '@/services/firebase/firestore';
import { Subscription } from '@/services/firebase/types';
import { SubscriptionFormData } from '../schemas/subscription.schema';
import { Timestamp } from 'firebase/firestore';
import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { triggerHaptic } from '@/utils/haptics';
import { scheduleSubReminder, cancelSubReminder, scheduleContractDoomReminder } from '@/services/notificationService';
import { getNextRenewalDate } from '@/features/dashboard/utils/calculations';
import * as Notifications from 'expo-notifications';

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
    initialData: [], // Ensure subscriptions array is never undefined
  });
}

export function useAddSubscription() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);


  return useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        ...data,
        notes: data.notes || '',
        isSplit: data.isSplit ?? false,
        splitParticipants: data.splitParticipants ?? [],
        renewalDate: Timestamp.fromDate(data.renewalDate),
        trialEndDate: data.trialEndDate ? Timestamp.fromDate(data.trialEndDate) : null, // Avoid undefined
        contractEndDate: data.hasContract && data.contractEndDate ? Timestamp.fromDate(data.contractEndDate) : null,
        hasContract: data.hasContract || false,
      };
      
      delete (payload as any).paymentDetails;
      // Clean undefined keys before Firestore
      Object.keys(payload).forEach(key => payload[key as keyof typeof payload] === undefined && delete payload[key as keyof typeof payload]);
      
      const docRef = await SubscriptionService.addSubscription(user.uid, payload);
      return { id: typeof docRef === 'string' ? docRef : docRef?.id || `temp_${Date.now()}`, payload };
    },
    onSuccess: (result) => {
      triggerHaptic('success');
      if (user) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.list(user.uid) });
      }
      try {
        const nextDate = getNextRenewalDate(result.payload.renewalDate, result.payload.billingCycle);
        scheduleSubReminder({ id: result.id, ...result.payload }, nextDate).catch(() => {});
        if (result.payload.hasContract && result.payload.contractEndDate) {
          scheduleContractDoomReminder({ id: result.id, ...result.payload }, result.payload.contractEndDate.toDate()).catch(() => {});
        }
      } catch (err) {
        // silent fail
      }
      Toast.show({ type: 'success', text1: 'Subscription Saved', position: 'top' });
    },
    onError: (error) => {
      triggerHaptic('error');
      Toast.show({ type: 'error', text1: 'Failed to add subscription', position: 'top' });
      console.error(error);
    }
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SubscriptionFormData }) => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        ...data,
        notes: data.notes || '',
        isSplit: data.isSplit ?? false,
        splitParticipants: data.splitParticipants ?? [],
        renewalDate: Timestamp.fromDate(data.renewalDate),
        trialEndDate: data.trialEndDate ? Timestamp.fromDate(data.trialEndDate) : null,
        contractEndDate: data.hasContract && data.contractEndDate ? Timestamp.fromDate(data.contractEndDate) : null,
        hasContract: data.hasContract || false,
      };
      
      delete (payload as any).paymentDetails;
      // Clean undefined keys before Firestore
      Object.keys(payload).forEach(key => payload[key as keyof typeof payload] === undefined && delete payload[key as keyof typeof payload]);
      
      await SubscriptionService.updateSubscription(user.uid, id, payload);
      return { id, payload };
    },
    onSuccess: (result) => {
      triggerHaptic('success');
      if (user) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.list(user.uid) });
      }
      try {
        const nextDate = getNextRenewalDate(result.payload.renewalDate, result.payload.billingCycle);
        scheduleSubReminder({ id: result.id, ...result.payload }, nextDate).catch(() => {});

        if (result.payload.hasContract && result.payload.contractEndDate) {
          scheduleContractDoomReminder({ id: result.id, ...result.payload }).catch(() => {});
        } else {
          try {
            Notifications.cancelScheduledNotificationAsync('sub_contract_doom_' + result.id);
          } catch(e) {}
        }
      } catch (err) {
        // silent fail
      }
      Toast.show({ type: 'success', text1: 'Subscription Updated', position: 'top' });
    },
    onError: (error) => {
      triggerHaptic('error');
      Toast.show({ type: 'error', text1: 'Failed to update subscription', position: 'top' });
      console.error(error);
    }
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);


  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      await SubscriptionService.deleteSubscription(user.uid, id);
      return id;
    },
    onSuccess: (id) => {
      triggerHaptic('success');
      if (user) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.list(user.uid) });
      }
      try {
        cancelSubReminder(id).catch(() => {});
      } catch (err) {
        // silent fail
      }
      Toast.show({ type: 'success', text1: 'Subscription Removed', position: 'top' });
    },
    onError: (error) => {
      triggerHaptic('error');
      Toast.show({ type: 'error', text1: 'Failed to delete subscription', position: 'top' });
      console.error(error);
    }
  });
}
