import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useController, useFormContext } from 'react-hook-form';
import { useCards } from '@/features/cards/hooks/useCards';
import { useTheme } from '@/context/ThemeContext';
import type {
  SubscriptionFormData,
  SubscriptionFormInput,
} from '../../../schemas/subscription.schema';
import { OptionPickerModal, type OptionPickerOption } from '../fields/OptionPickerModal';
import { createSubscriptionFormStyles } from '../subscriptionForm.styles';

const NO_CARD_VALUE = '__no_card__';

interface PaymentCardFieldProps {
  label: string;
  placeholder: string;
  modalTitle: string;
  closeLabel: string;
  noCardLabel: string;
}

export function PaymentCardField({
  label,
  placeholder,
  modalTitle,
  closeLabel,
  noCardLabel,
}: PaymentCardFieldProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createSubscriptionFormStyles(colors), [colors]);
  const { data: cards = [] } = useCards();
  const { control } = useFormContext<SubscriptionFormInput, undefined, SubscriptionFormData>();
  const { field, fieldState } = useController<SubscriptionFormInput, 'cardId', SubscriptionFormData>({
    control,
    name: 'cardId',
  });
  const [visible, setVisible] = useState(false);
  const options: readonly OptionPickerOption<string>[] = [
    { value: NO_CARD_VALUE, label: noCardLabel },
    ...cards.flatMap((card) => card.id ? [{
      value: card.id,
      label: `💳 ${card.type.toUpperCase()} - ${card.name} (•••• ${card.lastFourDigits || '****'})`,
    }] : []),
  ];
  const selectedValue = typeof field.value === 'string' ? field.value : NO_CARD_VALUE;
  const selectedLabel = options.find((option) => option.value === selectedValue)?.label ?? noCardLabel;

  return (
    <View style={styles.fieldSpacing}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedLabel}`}
        accessibilityState={{ expanded: visible }}
        activeOpacity={0.8}
        onPress={() => setVisible(true)}
        style={styles.cardTrigger}
      >
        <Text style={styles.cardTriggerText}>{selectedLabel || placeholder}</Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
      {fieldState.error?.message ? <Text style={{ color: colors.danger }}>{fieldState.error.message}</Text> : null}

      <OptionPickerModal
        visible={visible}
        title={modalTitle}
        closeLabel={closeLabel}
        options={options}
        selectedValue={selectedValue}
        onClose={() => setVisible(false)}
        onSelect={(value) => {
          field.onChange(value === NO_CARD_VALUE ? null : value);
          setVisible(false);
        }}
      />
    </View>
  );
}
