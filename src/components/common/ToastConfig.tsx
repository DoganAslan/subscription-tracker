import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ToastConfig } from 'react-native-toast-message';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const CustomSuccessToast = (props: any) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  return (
    <View style={styles.container}>
      <Ionicons name="checkmark-circle" size={24} color={isDark ? '#FFFFFF' : '#0B0F19'} style={styles.icon} />
      <Text style={styles.text}>{props.text1}</Text>
    </View>
  );
};

const CustomErrorToast = (props: any) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  return (
    <View style={[styles.container, isDark && { borderColor: '#ef4444' }]}>
      <Ionicons name="alert-circle" size={24} color={isDark ? '#ef4444' : '#ef4444'} style={styles.icon} />
      <Text style={styles.text}>{props.text1}</Text>
    </View>
  );
};

export const toastConfig: ToastConfig = {
  success: (props) => <CustomSuccessToast {...props} />,
  error: (props) => <CustomErrorToast {...props} />,
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: isDark ? '#000' : '#64748b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.5 : 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? '#374151' : 'transparent',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    color: isDark ? '#FFFFFF' : '#0B0F19',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Hanken Grotesk',
  }
});
