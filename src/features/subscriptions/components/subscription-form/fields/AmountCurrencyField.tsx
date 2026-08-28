import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useController, useFormContext } from 'react-hook-form';
import type {
  SubscriptionFormData,
  SubscriptionFormInput,
} from '../../../schemas/subscription.schema';
import { KEYBOARD_ACCESSORY_ID } from '@/components/ui/KeyboardAccessory';
import { useTheme } from '@/context/ThemeContext';
import { sanitizePriceInput } from '@/utils/sanitizers';
import { OptionPickerModal, type OptionPickerOption } from './OptionPickerModal';

interface AmountCurrencyFieldProps<CurrencyCode extends string> {
  amountLabel: string;
  currencyLabel: string;
  currencyModalTitle: string;
  closeLabel: string;
  amountPlaceholder: string;
  currencyOptions: readonly OptionPickerOption<CurrencyCode>[];
}

export function AmountCurrencyField<CurrencyCode extends string>({
  amountLabel,
  currencyLabel,
  currencyModalTitle,
  closeLabel,
  amountPlaceholder,
  currencyOptions,
}: AmountCurrencyFieldProps<CurrencyCode>) {
  const { colors } = useTheme();
  const { control } = useFormContext<SubscriptionFormInput, undefined, SubscriptionFormData>();
  const amount = useController<SubscriptionFormInput, 'amount', SubscriptionFormData>({ control, name: 'amount' });
  const currency = useController<SubscriptionFormInput, 'currency', SubscriptionFormData>({ control, name: 'currency' });
  const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);
  const amountValue = amount.field.value;
  const displayAmount = typeof amountValue === 'number' || typeof amountValue === 'string' ? String(amountValue) : '';
  const selectedCurrency = typeof currency.field.value === 'string' ? currency.field.value : 'USD';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{amountLabel}</Text>
      <View testID="amount-currency-row" style={styles.row}>
        <View testID="amount-input-container" style={styles.amountContainer}>
          <TextInput
            accessibilityLabel={amountLabel}
            keyboardType="numeric"
            returnKeyType="done"
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
            onBlur={amount.field.onBlur}
            onChangeText={(text) => amount.field.onChange(sanitizePriceInput(text))}
            value={displayAmount}
            placeholder={amountPlaceholder}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.amountInput,
              { backgroundColor: colors.surface, borderColor: amount.fieldState.error ? colors.danger : colors.border, color: colors.text },
            ]}
          />
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${currencyLabel}: ${selectedCurrency}`}
          accessibilityState={{ expanded: currencyPickerVisible }}
          activeOpacity={0.8}
          onPress={() => setCurrencyPickerVisible(true)}
          style={[styles.currencyTrigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.currencyText, { color: colors.text }]}>{selectedCurrency}</Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>▼</Text>
        </TouchableOpacity>
      </View>
      {amount.fieldState.error?.message ? <Text style={[styles.error, { color: colors.danger }]}>{amount.fieldState.error.message}</Text> : null}

      <OptionPickerModal
        visible={currencyPickerVisible}
        title={currencyModalTitle}
        closeLabel={closeLabel}
        options={currencyOptions}
        selectedValue={selectedCurrency}
        onClose={() => setCurrencyPickerVisible(false)}
        onSelect={(value) => {
          currency.field.onChange(value);
          setCurrencyPickerVisible(false);
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
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountContainer: {
    flex: 1,
    flexShrink: 1,
  },
  amountInput: {
    width: '100%',
    minHeight: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 28,
    fontWeight: '700',
  },
  currencyTrigger: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 8,
    fontSize: 11,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
});
