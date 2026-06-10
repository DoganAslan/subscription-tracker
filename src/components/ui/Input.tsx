import React, { forwardRef } from 'react';
import { TextInput, View, Text, TextInputProps, StyleSheet } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: object;
}

const DESIGN_TOKENS = {
  colors: {
    surfaceContainer: '#1c1f2a',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#9CA3AF',
    outline: '#374151',
    error: '#ffb4ab',
    primary: '#adc6ff',
  }
};

export const Input = forwardRef<TextInput, InputProps>(({ label, error, containerStyle, ...props }, ref) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          error ? styles.inputError : null
        ]}
        placeholderTextColor={DESIGN_TOKENS.colors.onSurfaceVariant}
        {...props}
      />
      {!!error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.onSurfaceVariant,
    marginBottom: 8,
    letterSpacing: 0.6,
    fontFamily: 'Geist',
  },
  input: {
    width: '100%',
    backgroundColor: DESIGN_TOKENS.colors.surfaceContainer,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: DESIGN_TOKENS.colors.onSurface,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.outline,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  inputError: {
    borderColor: DESIGN_TOKENS.colors.error,
  },
  errorText: {
    color: DESIGN_TOKENS.colors.error,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  }
});
