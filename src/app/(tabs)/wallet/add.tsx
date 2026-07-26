import React, { useState, useCallback } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardForm } from '@/features/cards/components/CardForm';
import { useAddCard } from '@/features/cards/hooks/useCards';
import { useRouter, useFocusEffect } from 'expo-router';
import { CardFormData } from '@/features/cards/schemas/card.schema';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/utils/haptics';
import { useTranslation } from '@/context/LanguageContext';

export default function AddCardScreen() {
  const router = useRouter();
  const { mutate: addCard, isPending } = useAddCard();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [formKey, setFormKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFormKey(prev => prev + 1);
    }, [])
  );

  const handleGoBack = () => {
    router.replace('/(tabs)/wallet');
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
        {/* Navigation Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
            <Text style={[styles.backButtonText, { color: colors.primary }]}>{t.common?.cancel || 'Cancel'}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.global?.addVirtualCard || 'Add Card'}</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={{ flex: 1 }}>
          <CardForm 
            key={formKey}
            onSubmit={handleSubmit} 
            isLoading={isPending} 
            submitLabel={t.global?.saveChanges || 'Save Card'} 
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
