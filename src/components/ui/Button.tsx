import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  StyleSheet
} from 'react-native';

const DESIGN_TOKENS = {
  colors: {
    primary: '#3B82F6',
    onPrimary: '#FFFFFF',
    surfaceContainerHigh: '#262a35',
    onSurface: '#dfe2f1',
    error: '#ffb4ab',
    onError: '#690005',
    outline: '#8c909f',
  }
};

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
}

export function Button({
  title,
  isLoading = false,
  variant = 'primary',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'destructive':
        return styles.destructiveContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'destructive':
        return styles.destructiveText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      disabled={isLoading || disabled}
      style={[
        styles.container,
        getContainerStyle(),
        (isLoading || disabled) && styles.disabled,
        style
      ]}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? DESIGN_TOKENS.colors.onPrimary : DESIGN_TOKENS.colors.onSurface} />
      ) : (
        <Text style={[styles.text, getTextStyle()]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  primaryContainer: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
  },
  primaryText: {
    color: DESIGN_TOKENS.colors.onPrimary,
  },
  secondaryContainer: {
    backgroundColor: DESIGN_TOKENS.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.outline,
  },
  secondaryText: {
    color: DESIGN_TOKENS.colors.onSurface,
  },
  destructiveContainer: {
    backgroundColor: DESIGN_TOKENS.colors.surfaceContainerHigh,
  },
  destructiveText: {
    color: DESIGN_TOKENS.colors.error,
  }
});