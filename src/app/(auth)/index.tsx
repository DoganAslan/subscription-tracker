import i18n, { t } from '@/locales/i18n';
import React, { useEffect, useRef } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { Link } from 'expo-router';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useTheme } from '@/context/ThemeContext';

export default function LoginScreen() {
  const { colors } = useTheme();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    spinAnim.setValue(0);
    const animation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 10000, // 10 seconds for a smooth, elegant 360 degree spin
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    animation.start();

    return () => animation.stop();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
            {/* Spinning Logo Container with Glow */}
            <View style={dynamicStyles.logoGlowRing}>
              <Animated.Image
                source={require('../../../assets/images/logo.png')}
                style={[
                  dynamicStyles.logo,
                  { transform: [{ rotate: spin }] },
                ]}
                resizeMode="cover"
              />
            </View>
            <Text style={dynamicStyles.title}>{t.global.welcomeBack}</Text>
            <Text style={dynamicStyles.subtitle}>{t.global.signInToManageYourSu}</Text>
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
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 50,
    marginBottom: 20,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#0F172A',
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
