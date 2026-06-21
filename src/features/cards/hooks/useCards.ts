import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CardService } from '@/services/firebase/firestore';
import { Card } from '@/services/firebase/types';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/useAuthStore';
import { triggerHaptic } from '@/utils/haptics';

// React Query Keys
export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (userId: string) => [...cardKeys.lists(), userId] as const,
};

export function useCards() {
  const user = useAuthStore(state => state.user);

  return useQuery({
    queryKey: cardKeys.list(user?.uid || ''),
    queryFn: () => CardService.getCards(user!.uid),
    enabled: !!user?.uid,
    initialData: [],
  });
}

export function useAddCard() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  return useMutation({
    mutationFn: async (data: Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
      if (!user) throw new Error("Not authenticated");
      const docId = await CardService.addCard(user.uid, data);
      return { id: docId, ...data };
    },
    onSuccess: () => {
      triggerHaptic('success');
      if (user) {
        queryClient.invalidateQueries({ queryKey: cardKeys.list(user.uid) });
      }
      Toast.show({ type: 'success', text1: 'Card Saved', position: 'top' });
    },
    onError: (error) => {
      triggerHaptic('error');
      Toast.show({ type: 'error', text1: 'Failed to add card', position: 'top' });
      console.error(error);
    }
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Card> }) => {
      if (!user) throw new Error("Not authenticated");
      await CardService.updateCard(user.uid, id, data);
      return { id, ...data };
    },
    onSuccess: () => {
      triggerHaptic('success');
      if (user) {
        queryClient.invalidateQueries({ queryKey: cardKeys.list(user.uid) });
      }
      Toast.show({ type: 'success', text1: 'Card Updated', position: 'top' });
    },
    onError: (error) => {
      triggerHaptic('error');
      Toast.show({ type: 'error', text1: 'Failed to update card', position: 'top' });
      console.error(error);
    }
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      await CardService.deleteCard(user.uid, id);
      return id;
    },
    onSuccess: () => {
      triggerHaptic('success');
      if (user) {
        queryClient.invalidateQueries({ queryKey: cardKeys.list(user.uid) });
        // Since deleteCard also unlinks subscriptions, invalidate them too
        queryClient.invalidateQueries({ queryKey: ['subscriptions', 'list', user.uid] });
      }
      Toast.show({ type: 'success', text1: 'Card Removed', position: 'top' });
    },
    onError: (error) => {
      triggerHaptic('error');
      Toast.show({ type: 'error', text1: 'Failed to delete card', position: 'top' });
      console.error(error);
    }
  });
}
