import { t } from '@/locales/i18n';
import React, { useEffect, useRef } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Animated, Easing, Image } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(rotation, {
      toValue: 1,
      duration: 9000,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  const logoRotation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={dynamicStyles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={dynamicStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={dynamicStyles.innerWrapper}>
          <View style={dynamicStyles.headerContainer}>
            <Animated.View style={[dynamicStyles.logoGlowRing, { transform: [{ rotate: logoRotation }] }]}>
              <Image source={require('../../../assets/images/logo.png')} style={dynamicStyles.logoImage} />
            </Animated.View>
            <Text style={dynamicStyles.eyebrow}>SUBMATE</Text>
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
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardArea: {
    flex: 1,
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
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    backgroundColor: '#111827',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 14,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.2,
    fontWeight: '800',
    color: '#A78BFA',
    marginBottom: 10,
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
