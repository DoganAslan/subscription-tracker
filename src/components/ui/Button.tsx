import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  StyleSheet,
  View
} from 'react-native';

import { useTheme } from '@/context/ThemeContext';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
  icon?: React.ReactNode;
}

export function Button({
  title,
  isLoading = false,
  variant = 'primary',
  disabled,
  style,
  icon,
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
        <View style={dynamicStyles.contentRow}>
          {icon && <View style={dynamicStyles.iconWrapper}>{icon}</View>}
          <Text style={[dynamicStyles.text, getTextStyle()]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  iconWrapper: {
    flexShrink: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    flexShrink: 1,
    textAlign: 'center',
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
