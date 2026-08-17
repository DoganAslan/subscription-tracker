import { t } from '@/locales/i18n';
import React from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <KeyboardAvoidingView
      style={dynamicStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={dynamicStyles.innerWrapper}>
          <View style={dynamicStyles.headerContainer}>
            <LinearGradient colors={['#7C3AED', '#3B82F6']} style={dynamicStyles.logoGlowRing}>
              <Ionicons name="sparkles" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={dynamicStyles.eyebrow}>SUBMATE</Text>
            <Text style={dynamicStyles.title}>{t.global.welcomeBack}</Text>
            <Text style={dynamicStyles.subtitle}>{t.global.signInToManageYourSu}</Text>
            <View style={dynamicStyles.valueRow}>
              <Ionicons name="shield-checkmark-outline" size={15} color="#A78BFA" />
              <Text style={dynamicStyles.valueText}>{isTurkish ? 'Verilerin cihazında, kontrol sende.' : 'Your data stays on your device.'}</Text>
            </View>
          </View>

          <LoginForm />

          <View style={dynamicStyles.footerContainer}>
            <Text style={dynamicStyles.footerText}>{t.global.dontHaveAnAccount} </Text>
            <Link href="/(auth)/register" style={dynamicStyles.footerLink}>
              {t.authLeaks?.createAccountBtn || 'Create Account'}
            </Link>
          </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  innerWrapper: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  logoGlowRing: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.2,
    fontWeight: '800',
    color: '#A78BFA',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  valueRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 58, 237, 0.10)',
  },
  valueText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
