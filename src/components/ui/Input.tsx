import React, { forwardRef, useState } from 'react';
import { TextInput, View, Text, TextInputProps, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
}

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
        placeholderTextColor={colors.textSecondary + 'A0'}
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
    marginBottom: 18,
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    fontWeight: '600',
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  }
});
