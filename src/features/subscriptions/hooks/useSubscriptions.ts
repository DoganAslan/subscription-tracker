import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubscriptionService } from '@/services/firebase/firestore';
import { useAuthStore } from '@/store/useAuthStore';
import { Subscription } from '@/services/firebase/types';
import { SubscriptionFormData } from '../schemas/subscription.schema';
import { triggerHaptic } from '@/utils/haptics';
import Toast from 'react-native-toast-message';
import { scheduleSubReminder, cancelSubReminder, scheduleContractDoomReminder } from '@/services/notificationService';
import { getNextRenewalDate } from '@/features/dashboard/utils/calculations';
import { Timestamp } from 'firebase/firestore';
import { triggerWidgetSync } from '@/services/background/widgetSync';
import { useTranslation } from '@/context/LanguageContext';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  list: (userId: string) => [...subscriptionKeys.all, 'list', userId] as const,
};

const safeToTimestamp = (val: any): Timestamp | null => {
  if (!val) return null;
  if (val instanceof Timestamp) return val;
  if (typeof val?.toDate === 'function') return Timestamp.fromDate(val.toDate());
  if (val instanceof Date) return isNaN(val.getTime()) ? null : Timestamp.fromDate(val);
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
};

const safeToDate = (val: any): Date => {
  if (!val) return new Date();
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
  if (typeof val?.toDate === 'function') return val.toDate();
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
};

export function useSubscriptions() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: subscriptionKeys.list(user?.uid || ''),
    queryFn: () => SubscriptionService.getSubscriptions(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useAddSubscription() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      if (!user) throw new Error("Not authenticated");

      const cleanMembers = Array.isArray(data.splitMembers)
        ? data.splitMembers.map((m: any, idx: number) => ({
            id: String(m.id || Date.now() + idx),
            name: String(m.name || ''),
            phone: String(m.phone || ''),
            shareAmount: Number(m.shareAmount) || 0,
            isPaid: Boolean(m.isPaid),
          }))
        : [];

      const payload = {
        ...data,
        status: data.status || 'active',
        notes: data.notes || '',
        isSplit: data.isSplit ?? false,
        splitMembers: cleanMembers,
        renewalDate: safeToTimestamp(data.renewalDate) || Timestamp.now(),
        trialEndDate: safeToTimestamp(data.trialEndDate),
        contractEndDate: data.hasContract ? safeToTimestamp(data.contractEndDate) : null,
        hasContract: data.hasContract || false,
      };

      delete (payload as any).paymentDetails;

      const newId = await SubscriptionService.addSubscription(user.uid, payload as any);
      return { id: newId, payload };
    },
    onSuccess: (result) => {
      triggerHaptic('success');
      if (user) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.list(user.uid) });
        triggerWidgetSync(user.uid);
      }
      Toast.show({ type: 'success', text1: (t.global as any)?.subscriptionAdded || 'Subscription Added', position: 'top' });
      try {
        const renDate = safeToDate(result.payload.renewalDate);
        const nextDate = getNextRenewalDate(renDate, result.payload.billingCycle);
        scheduleSubReminder({ id: result.id, ...result.payload, renewalDate: renDate }, nextDate).catch((e) => {
          console.error('Reminder error:', e);
        });

        if (result.payload.hasContract && result.payload.contractEndDate) {
          const cDate = safeToDate(result.payload.contractEndDate);
          scheduleContractDoomReminder({ id: result.id, ...result.payload, contractEndDate: cDate }).catch((e) => console.error(e));
        }
      } catch (err) {
        console.error('Failed to parse dates for reminder:', err);
      }
    },
    onError: (error) => {
      triggerHaptic('error');
      Toast.show({ type: 'error', text1: (t.global as any)?.failedToAddSub || 'Failed to add subscription', position: 'top' });
      console.error(error);
    }
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SubscriptionFormData> | any }) => {
      if (!user) throw new Error("Not authenticated");

      const cachedSubs = queryClient.getQueryData<Subscription[]>(subscriptionKeys.list(user.uid));
      const oldSub = cachedSubs?.find(s => s.id === id);

      const payload: any = {
        ...data,
      };

      if (data.renewalDate !== undefined) {
        payload.renewalDate = safeToTimestamp(data.renewalDate) || Timestamp.now();
      }
      if (data.trialEndDate !== undefined) {
        payload.trialEndDate = safeToTimestamp(data.trialEndDate);
      }
      if (data.contractEndDate !== undefined) {
        payload.contractEndDate = safeToTimestamp(data.contractEndDate);
      }

      if (Array.isArray(data.splitMembers)) {
        payload.splitMembers = data.splitMembers.map((m: any, idx: number) => ({
          id: String(m.id || Date.now() + idx),
          name: String(m.name || ''),
          phone: String(m.phone || ''),
          shareAmount: Number(m.shareAmount) || 0,
          isPaid: Boolean(m.isPaid),
        }));
      }

      delete payload.paymentDetails;
      delete payload.status;
      delete payload.pauseEndDate;

      // Clean undefined keys before Firestore
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      let newPriceHistory = oldSub?.priceHistory || [];
      if (oldSub && payload.amount !== undefined && oldSub.amount !== payload.amount) {
        newPriceHistory = [...newPriceHistory, { amount: payload.amount, date: new Date().toISOString() }];
        payload.priceHistory = newPriceHistory;
      }

      await SubscriptionService.updateSubscription(user.uid, id, payload);
      return { id, payload, oldSub };
    },
    onSuccess: (result) => {
      triggerHaptic('success');
      if (user) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.list(user.uid) });
        triggerWidgetSync(user.uid);
      }
      Toast.show({ type: 'success', text1: (t.global as any)?.subscriptionUpdated || 'Subscription Updated', position: 'top' });
      try {
        const mergedSub = {
          ...result.oldSub,
          ...result.payload,
        };

        if (mergedSub.renewalDate) {
          const renDate = safeToDate(mergedSub.renewalDate);
          const billingCycleVal = mergedSub.billingCycle || 'monthly';
          const nextDate = getNextRenewalDate(renDate, billingCycleVal);

          scheduleSubReminder({ id: result.id, ...mergedSub, renewalDate: renDate }, nextDate).catch((e) => {
            console.error('Reminder error:', e);
          });
        }

        if (mergedSub.hasContract && mergedSub.contractEndDate) {
          const cDate = safeToDate(mergedSub.contractEndDate);
          scheduleContractDoomReminder({ id: result.id, ...mergedSub, contractEndDate: cDate }).catch((e) => console.error(e));
        } else {
          try {
            if (Platform.OS !== 'web') {
              Notifications.cancelScheduledNotificationAsync('sub_contract_doom_' + result.id);
            }
          } catch(e) {}
        }
      } catch (err) {
        console.error('Failed to parse dates for reminder:', err);
      }
    },
    onError: (error) => {
      triggerHaptic('error');
      Toast.show({ type: 'error', text1: (t.global as any)?.failedToUpdateSub || 'Failed to update subscription', position: 'top' });
      console.error(error);
    }
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      await SubscriptionService.deleteSubscription(user.uid, id);
      return id;
    },
    onSuccess: (id) => {
      triggerHaptic('medium');
      if (user) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.list(user.uid) });
        triggerWidgetSync(user.uid);
      }
      cancelSubReminder(id).catch(console.error);
      Toast.show({ type: 'success', text1: (t.global as any)?.subscriptionDeleted || 'Subscription Deleted', position: 'top' });
    },
    onError: (error) => {
      triggerHaptic('error');
      Toast.show({ type: 'error', text1: (t.global as any)?.failedToDeleteSub || 'Failed to delete subscription', position: 'top' });
      console.error(error);
    }
  });
}

export function useTogglePauseSubscription() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { status: 'active' | 'paused'; pauseEndDate?: Date | null } }) => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        status: data.status,
        pauseEndDate: data.pauseEndDate ? Timestamp.fromDate(data.pauseEndDate) : null,
      };
      await SubscriptionService.updateSubscription(user.uid, id, payload as any);
      return { id, status: data.status };
    },
    onSuccess: ({ id, status }) => {
      triggerHaptic('selection');
      if (user) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.list(user.uid) });
        triggerWidgetSync(user.uid);
      }
      if (status === 'paused') {
        cancelSubReminder(id).catch(console.error);
        Toast.show({ type: 'info', text1: (t.global as any)?.subscriptionPaused || 'Subscription Paused', position: 'top' });
      } else {
        Toast.show({ type: 'success', text1: (t.global as any)?.subscriptionResumed || 'Subscription Resumed', position: 'top' });
      }
    },
    onError: (error) => {
      triggerHaptic('error');
      Toast.show({ type: 'error', text1: (t.global as any)?.failedToUpdateStatus || 'Failed to update status', position: 'top' });
      console.error(error);
    }
  });
}

