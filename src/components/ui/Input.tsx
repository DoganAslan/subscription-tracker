import React, { forwardRef, useState } from 'react';
import { TextInput, View, Text, TextInputProps, StyleSheet } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
}

import { useTheme } from '@/context/ThemeContext';

export const Input = forwardRef<TextInput, InputProps>(({ label, error, containerStyle, onFocus, onBlur, ...props }, ref) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={[dynamicStyles.container, containerStyle]}>
      {label ? (
        <Text style={dynamicStyles.label}>
          {typeof label === 'string' ? label.toUpperCase() : ''}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        returnKeyType="done"
        inputAccessoryViewID="DONE_BAR"
        style={[
          dynamicStyles.input,
          isFocused && dynamicStyles.inputFocused,
          error ? dynamicStyles.inputError : null
        ]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />
      {!!error && (
        <Text style={dynamicStyles.errorText}>{error}</Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.6,
    fontFamily: 'Geist',
  },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  inputFocused: {
    borderColor: '#3B82F6', // Soft blue highlight
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  }
});
