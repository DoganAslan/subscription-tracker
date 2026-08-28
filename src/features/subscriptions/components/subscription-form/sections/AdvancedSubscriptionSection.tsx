import React, { useMemo, useState } from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';
import type {
  SubscriptionFormData,
  SubscriptionFormInput,
} from '../../../schemas/subscription.schema';
import { OptionPickerField } from '../fields/OptionPickerField';
import { SubscriptionDateField } from '../fields/SubscriptionDateField';
import { createSubscriptionFormStyles } from '../subscriptionForm.styles';
import { PaymentCardField } from './PaymentCardField';
import { SplitMembersSection } from './SplitMembersSection';

const REMINDER_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '1_day', label: '1 day' },
  { value: '3_days', label: '3 days' },
  { value: '1_week', label: '1 week' },
] as const;

interface AdvancedSubscriptionSectionProps {
  initiallyOpen: boolean;
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

export function AdvancedSubscriptionSection({ initiallyOpen }: AdvancedSubscriptionSectionProps) {
  const { colors } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const styles = useMemo(() => createSubscriptionFormStyles(colors), [colors]);
  const { control } = useFormContext<SubscriptionFormInput, undefined, SubscriptionFormData>();
  const isTrial = Boolean(useWatch({ control, name: 'isTrial' }));
  const hasContract = Boolean(useWatch({ control, name: 'hasContract' }));
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const isTurkish = currentLanguage === 'tr';
  const formatDate = (date: Date) => formatLocalizedDate(date, currentLanguage || 'en');

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={isTurkish ? 'Gelişmiş seçenekler' : 'Advanced options'}
        accessibilityState={{ expanded: isOpen }}
        activeOpacity={0.8}
        onPress={() => setIsOpen((open) => !open)}
        style={styles.advancedToggle}
      >
        <View style={styles.advancedToggleCopy}>
          <Ionicons name="options-outline" size={20} color={colors.primary} />
          <View style={styles.advancedToggleText}>
            <Text style={styles.advancedToggleTitle}>
              {isTurkish ? 'Gelişmiş seçenekler' : 'Advanced options'}
            </Text>
            <Text style={styles.advancedToggleDescription}>
              {isTurkish ? 'Hatırlatma, deneme, sözleşme ve paylaşım' : 'Reminders, trials, contracts and sharing'}
            </Text>
          </View>
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {isOpen ? (
        <View>
          <PaymentCardField
            label={isTurkish ? 'Ödeme kartı (isteğe bağlı)' : 'Payment card (optional)'}
            placeholder={t.global.selectACard}
            modalTitle={t.global.selectPaymentMethod}
            closeLabel={t.global.close}
            noCardLabel={isTurkish ? 'Kart bağlama' : 'No card linked'}
          />

          <OptionPickerField
            name="reminderOffset"
            label={t.global.reminderOffset}
            modalTitle={isTurkish ? 'Hatırlatma zamanı seç' : 'Select reminder timing'}
            closeLabel={t.global.close}
            options={isTurkish ? [
              { value: 'none', label: 'Yok' },
              { value: '1_day', label: '1 gün' },
              { value: '3_days', label: '3 gün' },
              { value: '1_week', label: '1 hafta' },
            ] : REMINDER_OPTIONS}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field, fieldState }) => (
              <Input
                accessibilityLabel={t.subs.notes}
                label={t.subs.notes}
                placeholder={t.global.egSharedWithFamily}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={typeof field.value === 'string' ? field.value : ''}
                error={fieldState.error?.message}
                multiline
                containerStyle={{ minHeight: 100 }}
              />
            )}
          />

          <View style={styles.switchContainer}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchTitle}>{t.form.trialTitle || 'Trial Version'}</Text>
              <Text style={styles.switchDescription}>{t.form.trialSubtitle || 'Track expiration and avoid sudden charges'}</Text>
            </View>
            <Controller
              control={control}
              name="isTrial"
              render={({ field }) => (
                <Switch
                  accessibilityLabel={isTurkish ? 'Deneme sürümü' : 'Trial subscription'}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={field.value ? '#FFFFFF' : colors.textSecondary}
                  ios_backgroundColor={colors.border}
                  onValueChange={(value) => {
                    triggerHaptic('medium');
                    field.onChange(value);
                  }}
                  value={Boolean(field.value)}
                />
              )}
            />
          </View>

          {isTrial ? (
            <SubscriptionDateField
              name="trialEndDate"
              label={isTurkish ? 'İlk para çekilme tarihi' : 'First payment date'}
              doneLabel={t.global.done}
              formatDate={formatDate}
            />
          ) : null}

          <View style={styles.switchContainer}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchTitle}>
                {isTurkish ? 'Yıllık Taahhüt Sözleşmesi Var' : 'Annual Commitment Agreement Available'}
              </Text>
              <Text style={styles.switchDescription}>
                {isTurkish ? 'Bitiş tarihinden 7 gün önce hatırlat' : 'Remind me 7 days before the due date'}
              </Text>
            </View>
            <Controller
              control={control}
              name="hasContract"
              render={({ field }) => (
                <Switch
                  accessibilityLabel={isTurkish ? 'Yıllık sözleşme' : 'Annual contract'}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={field.value ? '#FFFFFF' : colors.textSecondary}
                  ios_backgroundColor={colors.border}
                  onValueChange={(value) => {
                    triggerHaptic('medium');
                    field.onChange(value);
                  }}
                  value={Boolean(field.value)}
                />
              )}
            />
          </View>

          {hasContract ? (
            <SubscriptionDateField
              name="contractEndDate"
              label={isTurkish ? 'Sözleşme bitiş tarihi' : 'Contract end date'}
              doneLabel={t.global.done}
              formatDate={formatDate}
              fallbackDate={new Date(Date.now() + 365 * 86400000)}
            />
          ) : null}

          <SplitMembersSection />
        </View>
      ) : null}
    </>
  );
}
