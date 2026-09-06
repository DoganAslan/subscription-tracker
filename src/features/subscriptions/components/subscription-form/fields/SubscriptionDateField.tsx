import React, { useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useController, useFormContext } from 'react-hook-form';
import type {
  SubscriptionFormData,
  SubscriptionFormInput,
} from '../../../schemas/subscription.schema';
import { useTheme } from '@/context/ThemeContext';

export type SubscriptionDateFieldName = 'renewalDate' | 'trialEndDate' | 'contractEndDate';

interface SubscriptionDateFieldProps {
  name: SubscriptionDateFieldName;
  label: string;
  doneLabel: string;
  formatDate: (date: Date) => string;
  fallbackDate?: Date;
}

type WebDateInput = HTMLInputElement & { showPicker?: () => void };

const normalizeCalendarDate = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseLocalCalendarDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
};

const localCalendarInputValue = (date: Date): string => {
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function SubscriptionDateField({ name, label, doneLabel, formatDate, fallbackDate = new Date() }: SubscriptionDateFieldProps) {
  const { colors } = useTheme();
  const { control } = useFormContext<SubscriptionFormInput, undefined, SubscriptionFormData>();
  const { field, fieldState } = useController<SubscriptionFormInput, SubscriptionDateFieldName, SubscriptionFormData>({ control, name });
  const [pickerVisible, setPickerVisible] = useState(false);
  const webInputRef = useRef<WebDateInput | null>(null);
  const fieldValue = field.value;
  const selectedDate = fieldValue instanceof Date && !Number.isNaN(fieldValue.getTime())
    ? normalizeCalendarDate(fieldValue)
    : normalizeCalendarDate(fallbackDate);

  const openPicker = () => {
    if (Platform.OS !== 'web') {
      setPickerVisible(true);
      return;
    }

    try {
      webInputRef.current?.showPicker?.();
    } catch {
      webInputRef.current?.click();
    }
  };

  const handleNativeChange = (_event: unknown, nextDate?: Date) => {
    if (Platform.OS === 'android') setPickerVisible(false);
    if (nextDate) field.onChange(normalizeCalendarDate(nextDate));
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        activeOpacity={0.7}
        onPress={openPicker}
        style={[styles.trigger, { backgroundColor: colors.surface, borderColor: fieldState.error ? colors.danger : colors.border }]}
      >
        <Text style={[styles.triggerText, { color: colors.text }]}>{formatDate(selectedDate)}</Text>
      </TouchableOpacity>
      {fieldState.error?.message ? <Text style={[styles.error, { color: colors.danger }]}>{fieldState.error.message}</Text> : null}

      {Platform.OS === 'web'
        ? React.createElement('input', {
          ref: webInputRef,
          'data-testid': `${name}-web-input`,
          type: 'date',
          value: localCalendarInputValue(selectedDate),
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
            const nextDate = parseLocalCalendarDate(event.target.value);
            if (nextDate) field.onChange(nextDate);
          },
          style: styles.webInput,
        })
        : null}

      {Platform.OS === 'ios' && pickerVisible ? (
        <Modal transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
          <View style={styles.overlay}>
            <View style={[styles.iosSheet, { backgroundColor: colors.surface }]}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={doneLabel} onPress={() => setPickerVisible(false)}>
                <Text style={[styles.done, { color: colors.primary }]}>{doneLabel}</Text>
              </TouchableOpacity>
              <DateTimePicker
                testID={`${name}-native-picker`}
                value={selectedDate}
                mode="date"
                display="spinner"
                textColor={colors.text}
                onChange={handleNativeChange}
              />
            </View>
          </View>
        </Modal>
      ) : null}

      {Platform.OS === 'android' && pickerVisible ? (
        <DateTimePicker
          testID={`${name}-native-picker`}
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleNativeChange}
        />
      ) : null}
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  triggerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  webInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
    pointerEvents: 'none',
    borderWidth: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  iosSheet: {
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  done: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '700',
  },
});
