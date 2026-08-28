import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useController, useFormContext } from 'react-hook-form';
import type {
  SubscriptionFormData,
  SubscriptionFormInput,
} from '../../../schemas/subscription.schema';
import { useTheme } from '@/context/ThemeContext';
import { OptionPickerModal, type OptionPickerOption } from './OptionPickerModal';

export type SubscriptionOptionFieldName = 'category' | 'currency' | 'billingCycle' | 'reminderOffset';

type SubscriptionOptionValue = Extract<SubscriptionFormInput[SubscriptionOptionFieldName], string>;

interface OptionPickerFieldProps<Name extends SubscriptionOptionFieldName> {
  name: Name;
  label: string;
  modalTitle: string;
  closeLabel: string;
  options: readonly OptionPickerOption<SubscriptionOptionValue>[];
  placeholder?: string;
  formatSelected?: (value: SubscriptionOptionValue) => string;
  formatOption?: (option: OptionPickerOption<SubscriptionOptionValue>) => React.ReactNode;
}

export function OptionPickerField<Name extends SubscriptionOptionFieldName>({
  name,
  label,
  modalTitle,
  closeLabel,
  options,
  placeholder,
  formatSelected,
  formatOption,
}: OptionPickerFieldProps<Name>) {
  const { colors } = useTheme();
  const { control } = useFormContext<SubscriptionFormInput, undefined, SubscriptionFormData>();
  const { field, fieldState } = useController<SubscriptionFormInput, Name, SubscriptionFormData>({ control, name });
  const [visible, setVisible] = useState(false);
  const selectedValue = typeof field.value === 'string' ? field.value : undefined;
  const selectedOption = options.find((option) => option.value === selectedValue);
  const selectedLabel = selectedOption
    ? (formatSelected ? formatSelected(selectedOption.value) : selectedOption.label)
    : (placeholder ?? label);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedLabel}`}
        accessibilityState={{ expanded: visible }}
        activeOpacity={0.7}
        onPress={() => setVisible(true)}
        style={[styles.trigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.triggerText, { color: colors.text }]}>{selectedLabel}</Text>
        <Text style={[styles.chevron, { color: colors.textSecondary }]}>▼</Text>
      </TouchableOpacity>
      {fieldState.error?.message ? <Text style={[styles.error, { color: colors.danger }]}>{fieldState.error.message}</Text> : null}

      <OptionPickerModal
        visible={visible}
        title={modalTitle}
        closeLabel={closeLabel}
        options={options}
        selectedValue={selectedValue}
        formatOption={formatOption}
        onClose={() => setVisible(false)}
        onSelect={(value) => {
          field.onChange(value);
          setVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  trigger: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  triggerText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 12,
    fontSize: 12,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
});
