import i18n, { t } from '@/locales/i18n';
import React from 'react';
import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CardForm } from '@/features/cards/components/CardForm';
import { useCards, useUpdateCard, useDeleteCard, cardKeys } from '@/features/cards/hooks/useCards';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CardFormData } from '@/features/cards/schemas/card.schema';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/utils/haptics';
import { Alert } from 'react-native';

export default function EditCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const { data: cards, isLoading: isLoadingCard } = useCards();
  const { mutate: updateCard, isPending: isUpdating } = useUpdateCard();
  const { mutate: deleteCard, isPending: isDeleting } = useDeleteCard();

  const card = cards?.find(c => c.id === id);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/wallet');
    }
  };

  const handleSubmit = (data: CardFormData) => {
    triggerHaptic('success');
    updateCard({ id, data }, {
      onSuccess: () => {
        handleGoBack();
      }
    });
  };

  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  const executePurge = async (targetCardId: string) => {
    try {
      if (!user) return;
      
      // A. Fetch current truth from Cache
      const currentList = queryClient.getQueryData<any[]>(cardKeys.list(user.uid)) || [];

      // B. Filter out the dead entity
      const updatedList = currentList.filter((item: any) => item.id !== targetCardId);

      // C. Write back strictly BEFORE updating UI
      queryClient.setQueryData(cardKeys.list(user.uid), updatedList);

      // D. Update backend and sync
      deleteCard(targetCardId);

      console.log(`[Wallet Purge] Card ${targetCardId} annihilated successfully.`);
      handleGoBack();
    } catch (error) {
      console.error('[Wallet Purge Fatal Error]:', error);
    }
  };

  const handleDeleteTrigger = (cardId: string, cardName: string) => {
    triggerHaptic('warning');
    if (Platform.OS === 'web') {
      // Web Browser Safe Confirm
      if (window.confirm(`${cardName} kartını cüzdandan kalıcı olarak silmek istediğinize emin misiniz?`)) {
        executePurge(cardId);
      }
    } else {
      // Native iOS / Android Alert
      Alert.alert(
        'Kartı İmha Et',
        `${cardName} cüzdanınızdan kaldırılacak. Bu işlem geri alınamaz.`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Sil', style: 'destructive', onPress: () => executePurge(cardId) }
        ]
      );
    }
  };
  if (isLoadingCard) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!card) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>{t.global.cardNotFound}</Text>
        <TouchableOpacity onPress={handleGoBack} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>{t.global.goBack}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleGoBack} style={{ padding: 4 }}>
             <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{t.global.editCard}</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={{ flex: 1 }}>
          <CardForm 
            initialData={card}
            onSubmit={handleSubmit} 
            isLoading={isUpdating || isDeleting} 
            submitLabel="Update Card"
            onDelete={() => handleDeleteTrigger(id, card.name)}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
