import i18n from '@/locales/i18n';
import React from 'react';
import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CardForm } from '@/features/cards/components/CardForm';
import { useCards, useUpdateCard, useDeleteCard } from '@/features/cards/hooks/useCards';
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

  const handleDelete = () => {
    triggerHaptic('warning');
    Alert.alert(i18n.t('global.deleteCard'), i18n.t('global.areYouSureYouWantToD1'),
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            deleteCard(id, {
              onSuccess: () => {
                handleGoBack();
              }
            });
          }
        }
      ]
    );
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
        <Text style={{ color: colors.text }}>{i18n.t('global.cardNotFound')}</Text>
        <TouchableOpacity onPress={handleGoBack} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>{i18n.t('global.goBack')}</Text>
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
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{i18n.t('global.editCard')}</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={{ flex: 1 }}>
          <CardForm 
            initialData={card}
            onSubmit={handleSubmit} 
            isLoading={isUpdating || isDeleting} 
            submitLabel="Update Card"
            onDelete={handleDelete}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
