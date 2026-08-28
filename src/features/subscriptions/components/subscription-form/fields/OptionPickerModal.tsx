import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export interface OptionPickerOption<Value extends string> {
  value: Value;
  label: string;
  hint?: string;
}

interface OptionPickerModalProps<Value extends string> {
  visible: boolean;
  title: string;
  closeLabel: string;
  options: readonly OptionPickerOption<Value>[];
  selectedValue?: Value;
  onSelect: (value: Value) => void;
  onClose: () => void;
  formatOption?: (option: OptionPickerOption<Value>) => React.ReactNode;
}

export function OptionPickerModal<Value extends string>({
  visible,
  title,
  closeLabel,
  options,
  selectedValue,
  onSelect,
  onClose,
  formatOption,
}: OptionPickerModalProps<Value>) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose}>
              <Text style={[styles.close, { color: colors.primary }]}>{closeLabel}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.options}>
            {options.map((option) => {
              const selected = option.value === selectedValue;
              return (
                <TouchableOpacity
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected }}
                  onPress={() => onSelect(option.value)}
                  style={[
                    styles.option,
                    { borderColor: colors.border },
                    selected && { backgroundColor: colors.primary + '22', borderColor: colors.primary },
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {formatOption ? formatOption(option) : option.label}
                    </Text>
                    {option.hint ? <Text style={[styles.optionHint, { color: colors.textSecondary }]}>{option.hint}</Text> : null}
                  </View>
                  {selected ? <Text accessibilityLabel="Selected" style={[styles.check, { color: colors.primary }]}>✓</Text> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    maxHeight: '70%',
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  close: {
    marginLeft: 16,
    fontSize: 15,
    fontWeight: '700',
  },
  options: {
    gap: 8,
    paddingBottom: 24,
  },
  option: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  optionCopy: {
    flex: 1,
    flexShrink: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionHint: {
    marginTop: 4,
    fontSize: 13,
  },
  check: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: '700',
  },
});
