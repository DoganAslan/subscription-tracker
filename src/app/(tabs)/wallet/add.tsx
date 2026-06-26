import i18n from '@/locales/i18n';
import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { CardForm } from '@/features/cards/components/CardForm';
import { useAddCard } from '@/features/cards/hooks/useCards';
import { useRouter, useFocusEffect } from 'expo-router';
import { CardFormData } from '@/features/cards/schemas/card.schema';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/utils/haptics';

export default function AddCardScreen() {
  const router = useRouter();
  const { mutate: addCard, isPending } = useAddCard();
  const { colors } = useTheme();
  const [formKey, setFormKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFormKey(prev => prev + 1);
    }, [])
  );

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/wallet');
    }
  };

  const handleSubmit = (data: CardFormData) => {
    triggerHaptic('success');
    addCard(data, {
      onSuccess: () => {
        handleGoBack();
      }
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleGoBack} style={{ padding: 4 }}>
             <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{i18n.t('global.addVirtualCard')}</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={{ flex: 1 }}>
          <CardForm 
            key={formKey}
            onSubmit={handleSubmit} 
            isLoading={isPending} 
            submitLabel="Save Card" 
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
