import i18n from '@/locales/i18n';
import React from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { useTheme } from '@/context/ThemeContext';

export default function RegisterScreen() {
  const { colors } = useTheme();
  
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <KeyboardAvoidingView 
      style={dynamicStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={dynamicStyles.scrollContent}>
        <View style={dynamicStyles.headerContainer}>
          <Text style={dynamicStyles.title}>{i18n.t('global.createAccount')}</Text>
          <Text style={dynamicStyles.subtitle}>{i18n.t('global.startTrackingYourSub')}</Text>
        </View>

        <RegisterForm />

        <View style={dynamicStyles.footerContainer}>
          <Text style={dynamicStyles.footerText}>{i18n.t('global.alreadyHaveAnAccount')}</Text>
          <Link href="/(auth)" style={dynamicStyles.footerLink}>
            Log in
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});
