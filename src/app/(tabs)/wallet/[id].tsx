import i18n, { t } from '@/locales/i18n';
import React from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardForm } from '@/features/cards/components/CardForm';
import { useCards, useUpdateCard, useDeleteCard, cardKeys } from '@/features/cards/hooks/useCards';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CardFormData } from '@/features/cards/schemas/card.schema';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/utils/haptics';

export default function EditCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const { data: cards, isLoading: isLoadingCard } = useCards();
  const { mutate: updateCard, isPending: isUpdating } = useUpdateCard();
  const { mutate: deleteCard, isPending: isDeleting } = useDeleteCard();

  const card = cards?.find(c => c.id === id);

  const handleGoBack = () => {
    router.replace('/(tabs)/wallet');
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
      
      const currentList = queryClient.getQueryData<any[]>(cardKeys.list(user.uid)) || [];
      const updatedList = currentList.filter((item: any) => item.id !== targetCardId);
      queryClient.setQueryData(cardKeys.list(user.uid), updatedList);

      deleteCard(targetCardId);
      handleGoBack();
    } catch (error) {
      console.error('[Wallet Purge Error]:', error);
    }
  };

  const handleDeleteTrigger = (cardId: string, cardName: string) => {
    triggerHaptic('warning');
    const confirmMsg = (t.global as any)?.deleteCardConfirm
      ? (t.global as any).deleteCardConfirm.replace('{{name}}', cardName)
      : `Are you sure you want to permanently delete ${cardName}?`;
    const deleteTitle = (t.global as any)?.deleteCardTitle || 'Delete Card';
    const deleteDesc = (t.global as any)?.deleteCardDesc 
      ? (t.global as any).deleteCardDesc.replace('{{name}}', cardName)
      : `${cardName} will be removed from your wallet. This action cannot be undone.`;

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        executePurge(cardId);
      }
    } else {
      Alert.alert(
        deleteTitle,
        deleteDesc,
        [
          { text: t.common?.cancel || 'Cancel', style: 'cancel' },
          { text: t.common?.delete || 'Delete', style: 'destructive', onPress: () => executePurge(cardId) }
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
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.global?.editCard || 'Edit Card'}</Text>
          <View style={{ width: 70 }} />
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

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

