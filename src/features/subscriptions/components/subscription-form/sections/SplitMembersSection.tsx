import React, { useMemo } from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';
import { dispatchWhatsAppReminder } from '@/utils/whatsapp';
import type {
  SubscriptionFormData,
  SubscriptionFormInput,
} from '../../../schemas/subscription.schema';
import { createSubscriptionFormStyles } from '../subscriptionForm.styles';

const createEmptyMember = () => ({
  id: `${Date.now()}`,
  name: '',
  phone: '',
  shareAmount: 0,
  isPaid: false,
});

export function SplitMembersSection() {
  const { colors } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const styles = useMemo(() => createSubscriptionFormStyles(colors), [colors]);
  const { control, setValue } = useFormContext<SubscriptionFormInput, undefined, SubscriptionFormData>();
  const { fields, append, remove } = useFieldArray<SubscriptionFormInput, 'splitMembers', 'fieldKey'>({
    control,
    name: 'splitMembers',
    keyName: 'fieldKey',
  });
  const isSplit = Boolean(useWatch({ control, name: 'isSplit' }));
  const amount = useWatch({ control, name: 'amount' });
  const subscriptionName = useWatch({ control, name: 'name' });
  const currency = useWatch({ control, name: 'currency' });
  const splitMembers = useWatch({ control, name: 'splitMembers' });
  const isTurkish = currentLanguage === 'tr';

  const splitEqually = () => {
    triggerHaptic('medium');
    const numericAmount = typeof amount === 'number' ? amount : Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || fields.length === 0) return;

    const equalShare = Number((numericAmount / (fields.length + 1)).toFixed(2));
    fields.forEach((_, index) => {
      setValue(`splitMembers.${index}.shareAmount`, equalShare, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  };

  const sendReminder = (index: number) => {
    const member = splitMembers?.[index];
    if (!member) return;

    void dispatchWhatsAppReminder({
      id: member.id ?? '',
      name: member.name ?? '',
      phone: member.phone ?? '',
      shareAmount: typeof member.shareAmount === 'number' ? member.shareAmount : Number(member.shareAmount) || 0,
      isPaid: member.isPaid ?? false,
    }, typeof subscriptionName === 'string' ? subscriptionName : '', typeof currency === 'string' ? currency : 'USD');
  };

  return (
    <View style={styles.splitSection}>
      <View style={styles.switchContainer}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchTitle}>{t.form.splitTitle}</Text>
          <Text style={styles.switchDescription}>{t.form.splitSubtitle}</Text>
        </View>
        <Controller
          control={control}
          name="isSplit"
          render={({ field }) => (
            <Switch
              accessibilityLabel={isTurkish ? 'Aboneliği paylaş' : 'Split subscription'}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={field.value ? '#FFFFFF' : colors.textSecondary}
              ios_backgroundColor={colors.border}
              onValueChange={(value) => {
                triggerHaptic('selection');
                field.onChange(value);
                if (value && fields.length === 0) append(createEmptyMember());
              }}
              value={Boolean(field.value)}
            />
          )}
        />
      </View>

      {isSplit ? (
        <View style={styles.splitPanel}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isTurkish ? 'Eşit böl' : 'Split equally'}
            onPress={splitEqually}
            style={styles.equalSplitButton}
          >
            <Ionicons name="calculator-outline" size={18} color={colors.primary} />
            <Text style={styles.equalSplitText}>
              {isTurkish ? `⚡ Eşit böl (${fields.length + 1} kişi)` : `⚡ Split equally (${fields.length + 1} people)`}
            </Text>
          </TouchableOpacity>

          {fields.map((field, index) => (
            <View
              key={field.fieldKey}
              style={[styles.splitMember, index === fields.length - 1 && styles.lastSplitMember]}
            >
              <View style={styles.splitMemberHeader}>
                <Text style={styles.splitMemberTitle}>{t.form.partner} {index + 1}</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`${isTurkish ? 'Ortağı kaldır' : 'Remove Partner'} ${index + 1}`}
                  onPress={() => remove(index)}
                  style={styles.iconButton}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>

              <Controller
                control={control}
                name={`splitMembers.${index}.name`}
                render={({ field: memberField }) => (
                  <Input
                    accessibilityLabel={`${t.form.partner} ${index + 1} name`}
                    label={t.form.name}
                    placeholder={t.form.name}
                    value={memberField.value ?? ''}
                    onChangeText={memberField.onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name={`splitMembers.${index}.phone`}
                render={({ field: memberField }) => (
                  <Input
                    accessibilityLabel={`${t.form.partner} ${index + 1} phone`}
                    label={t.form.phone}
                    placeholder="90532..."
                    keyboardType="phone-pad"
                    value={memberField.value ?? ''}
                    onChangeText={memberField.onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name={`splitMembers.${index}.shareAmount`}
                render={({ field: memberField }) => (
                  <Input
                    accessibilityLabel={`${t.form.partner} ${index + 1} amount`}
                    label={t.form.amount}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={memberField.value ? String(memberField.value) : ''}
                    onChangeText={memberField.onChange}
                  />
                )}
              />

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`${t.form.sendReminder}: ${index + 1}`}
                onPress={() => sendReminder(index)}
                style={styles.whatsappButton}
              >
                <Ionicons name="logo-whatsapp" size={20} color={colors.success} />
                <Text style={styles.whatsappText}>{t.form.sendReminder}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t.form.addPartner}
            onPress={() => append(createEmptyMember())}
            style={styles.addMemberButton}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addMemberText}>{t.form.addPartner}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
