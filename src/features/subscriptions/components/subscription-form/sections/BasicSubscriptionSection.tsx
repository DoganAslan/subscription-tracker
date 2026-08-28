import React, { useMemo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { getBillingCycleLabel, getCategoryLabel } from '@/utils/categoryMeta';
import { SUPPORTED_CURRENCIES } from '@/utils/currency';
import type {
  SubscriptionFormData,
  SubscriptionFormInput,
} from '../../../schemas/subscription.schema';
import { normalizeSubscriptionNameInput, SUBSCRIPTION_CATEGORY_OPTIONS } from '../constants';
import { AmountCurrencyField } from '../fields/AmountCurrencyField';
import { OptionPickerField } from '../fields/OptionPickerField';
import { SubscriptionDateField } from '../fields/SubscriptionDateField';
import { createSubscriptionFormStyles } from '../subscriptionForm.styles';

const BILLING_CYCLE_OPTIONS = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: '6 Months', value: 'biannually' },
  { label: 'Yearly', value: 'yearly' },
  { label: '2 Years', value: 'biennially' },
] as const;

const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES.map(({ code, symbol }) => ({
  value: code,
  label: `${code} (${symbol})`,
}));

interface BasicSubscriptionSectionProps {
  isEdit: boolean;
  hideHero?: boolean;
  isScanning: boolean;
  onScanReceipt: () => Promise<void>;
}

const formatLocalizedDate = (date: Date, localeCode: string): string => {
  try {
    return new Intl.DateTimeFormat(localeCode, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
};

export function BasicSubscriptionSection({
  isEdit,
  hideHero,
  isScanning,
  onScanReceipt,
}: BasicSubscriptionSectionProps) {
  const { colors } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const styles = useMemo(() => createSubscriptionFormStyles(colors), [colors]);
  const { control } = useFormContext<SubscriptionFormInput, undefined, SubscriptionFormData>();
  const isTrial = Boolean(useWatch({ control, name: 'isTrial' }));
  const isTurkish = currentLanguage === 'tr';
  const formatDate = (date: Date) => formatLocalizedDate(date, currentLanguage || 'en');
  const categoryOptions = useMemo(
    () => SUBSCRIPTION_CATEGORY_OPTIONS.map((option) => ({
      ...option,
      label: getCategoryLabel(option.value, isTurkish),
    })),
    [isTurkish],
  );
  const billingCycleOptions = useMemo(
    () => BILLING_CYCLE_OPTIONS.map((option) => ({
      ...option,
      label: getBillingCycleLabel(option.value, isTurkish),
    })),
    [isTurkish],
  );

  return (
    <>
      {!isEdit ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isTurkish ? 'Fatura görselinden AI ile doldur' : 'Fill from a receipt with AI'}
          accessibilityState={{ disabled: isScanning }}
          activeOpacity={0.85}
          disabled={isScanning}
          onPress={() => { void onScanReceipt(); }}
          style={styles.aiScanButton}
        >
          {isScanning ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
            <>
              <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
              <Text style={styles.aiScanText} numberOfLines={1} ellipsizeMode="tail">
                {isTurkish ? 'Fatura görselinden AI ile doldur' : 'Fill from a receipt with AI'}
              </Text>
              <Ionicons name="sparkles" size={16} color="#FBBF24" />
            </>
          )}
        </TouchableOpacity>
      ) : null}

      {!isEdit ? (
        <View style={styles.basicInfoHeading}>
          <Text style={styles.basicInfoTitle}>{isTurkish ? 'Temel bilgiler' : 'The essentials'}</Text>
          <Text style={styles.basicInfoDescription}>
            {isTurkish ? 'Bu dört bilgiyle aboneliğini takip etmeye başlayabilirsin.' : 'These details are enough to start tracking.'}
          </Text>
        </View>
      ) : null}

      {!hideHero ? (
        <AmountCurrencyField
          amountLabel={isTrial ? t.global.posttrialPrice : (isTurkish ? 'Tutar' : 'Amount')}
          currencyLabel={isTurkish ? 'Para birimi' : 'Currency'}
          currencyModalTitle={t.global.selectCurrency}
          closeLabel={t.global.close}
          amountPlaceholder={t.global['000']}
          currencyOptions={CURRENCY_OPTIONS}
        />
      ) : null}

      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <Input
            accessibilityLabel={t.subs.name}
            label={t.subs.name}
            placeholder={t.global.egNetflix}
            onBlur={field.onBlur}
            onChangeText={(text) => field.onChange(normalizeSubscriptionNameInput(text))}
            value={typeof field.value === 'string' ? field.value : ''}
            error={fieldState.error?.message}
          />
        )}
      />

      <OptionPickerField
        name="category"
        label={t.subs.category}
        modalTitle={t.global.selectCategory}
        closeLabel={t.global.close}
        placeholder={t.global.selectACategory}
        options={categoryOptions}
        formatSelected={(value) => getCategoryLabel(value, isTurkish)}
      />

      <OptionPickerField
        name="billingCycle"
        label={t.subs.billingCycle}
        modalTitle={isTurkish ? 'Faturalandırma dönemi seç' : 'Select billing cycle'}
        closeLabel={t.global.close}
        options={billingCycleOptions}
        formatSelected={(value) => getBillingCycleLabel(value, isTurkish)}
      />

      {!isTrial ? (
        <SubscriptionDateField
          name="renewalDate"
          label={t.global.renewalDate}
          doneLabel={t.global.done}
          formatDate={formatDate}
        />
      ) : null}
    </>
  );
}
