import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  StyleSheet
} from 'react-native';

import { useTheme } from '@/context/ThemeContext';

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
  const { colors } = useTheme();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);
  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return dynamicStyles.secondaryContainer;
      case 'destructive':
        return dynamicStyles.destructiveContainer;
      case 'primary':
      default:
        return dynamicStyles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return dynamicStyles.secondaryText;
      case 'destructive':
        return dynamicStyles.destructiveText;
      case 'primary':
      default:
        return dynamicStyles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      disabled={isLoading || disabled}
      style={[
        dynamicStyles.container,
        getContainerStyle(),
        (isLoading || disabled) && dynamicStyles.disabled,
        style
      ]}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.background : colors.text} />
      ) : (
        <Text style={[dynamicStyles.text, getTextStyle()]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
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
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: '#FFFFFF', // keep white on primary blue
  },
  secondaryContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.text,
  },
  destructiveContainer: {
    backgroundColor: colors.surface,
  },
  destructiveText: {
    color: colors.danger,
  }
});
