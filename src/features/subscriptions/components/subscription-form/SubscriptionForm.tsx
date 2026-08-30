import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, ScrollView } from 'react-native';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyboardAccessory } from '@/components/ui/KeyboardAccessory';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';
import {
  subscriptionSchema,
  type SubscriptionFormData,
  type SubscriptionFormInput,
} from '../../schemas/subscription.schema';
import { createSubscriptionFormDefaults } from './formDefaults';
import { useBudgetGuard } from './hooks/useBudgetGuard';
import { useReceiptScanner, type ReceiptFormPatch } from './hooks/useReceiptScanner';
import { useSubscriptionFormDependencies } from './hooks/useSubscriptionFormDependencies';
import { AdvancedSubscriptionSection } from './sections/AdvancedSubscriptionSection';
import { BasicSubscriptionSection } from './sections/BasicSubscriptionSection';
import { SubscriptionFormActions } from './sections/SubscriptionFormActions';
import { createSubscriptionFormStyles } from './subscriptionForm.styles';
import type { SubscriptionFormProps } from './SubscriptionForm.types';

const patchOptions = { shouldDirty: true, shouldValidate: true } as const;

export function SubscriptionForm({
  initialData,
  onSubmit,
  isLoading,
  submitLabel,
  onDelete,
  hideHero,
  externalAmount,
  children,
}: SubscriptionFormProps) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const styles = useMemo(() => createSubscriptionFormStyles(colors), [colors]);
  const form = useForm<SubscriptionFormInput, undefined, SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: createSubscriptionFormDefaults(initialData),
  });
  const dependencies = useSubscriptionFormDependencies(initialData?.id);
  const budgetGuard = useBudgetGuard({ ...dependencies, submit: onSubmit });
  const receiptScanner = useReceiptScanner();
  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (externalAmount === undefined) return;
    form.setValue('amount', externalAmount, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [externalAmount, form.setValue]);

  const applyReceiptPatch = useCallback((patch: ReceiptFormPatch) => {
    if (patch.name !== undefined) form.setValue('name', patch.name, patchOptions);
    if (patch.amount !== undefined) form.setValue('amount', patch.amount, patchOptions);
    if (patch.currency !== undefined) form.setValue('currency', patch.currency, patchOptions);
    if (patch.billingCycle !== undefined) form.setValue('billingCycle', patch.billingCycle, patchOptions);
  }, [form.setValue]);

  const scanReceipt = useCallback(async () => {
    const result = await receiptScanner.scanReceipt();
    const isTurkish = currentLanguage === 'tr';

    switch (result.status) {
      case 'success':
        triggerHaptic('success');
        applyReceiptPatch(result.patch);
        return;
      case 'permission-denied':
        Alert.alert(
          isTurkish ? 'İzin gerekli' : 'Permission required',
          isTurkish
            ? 'Fatura görselini taramak için fotoğraf galerisi izni vermelisin.'
            : 'You need to grant photo library permission to scan receipts.',
        );
        return;
      case 'unreadable':
        triggerHaptic('error');
        Alert.alert(
          isTurkish ? 'Fatura okunamadı' : 'Receipt could not be read',
          isTurkish
            ? 'Görselin net olduğundan emin olup tekrar dene. Büyük faturaların analizi biraz daha uzun sürebilir.'
            : 'Make sure the image is clear and try again. Large receipts can take a little longer to analyze.',
        );
        return;
      case 'error':
        triggerHaptic('error');
        Alert.alert(
          isTurkish ? 'Hata' : 'Error',
          isTurkish ? 'Analiz sırasında beklenmeyen bir hata oluştu.' : 'An unexpected error occurred during analysis.',
        );
        return;
      case 'cancelled':
        return;
    }
  }, [applyReceiptPatch, currentLanguage, receiptScanner]);

  const submitForm = form.handleSubmit(async (data) => {
    triggerHaptic('heavy');
    try {
      await budgetGuard.submit(data);
    } catch {
      // The caller owns error presentation; keeping the form mounted preserves retryable input.
    }
  });

  return (
    <FormProvider {...form}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {children}
        <BasicSubscriptionSection
          isEdit={isEdit}
          hideHero={hideHero}
          isScanning={receiptScanner.isScanning}
          onScanReceipt={scanReceipt}
        />
        <AdvancedSubscriptionSection initiallyOpen={isEdit} />
        <SubscriptionFormActions
          isEdit={isEdit}
          isLoading={isLoading}
          isPending={budgetGuard.isPending}
          submitLabel={submitLabel}
          onSubmit={() => { void submitForm(); }}
          onDelete={onDelete}
        />
      </ScrollView>
      <KeyboardAccessory />
    </FormProvider>
  );
}
