import i18n from '@/locales/i18n';
import React from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useTheme } from '@/context/ThemeContext';
import Animated, { useSharedValue, withRepeat, withTiming, Easing, useAnimatedStyle } from 'react-native-reanimated';

export default function LoginScreen() {
  const { colors } = useTheme();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  return (
    <KeyboardAvoidingView 
      style={dynamicStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={dynamicStyles.scrollContent}>
        <View style={dynamicStyles.headerContainer}>
          <Animated.Image 
            source={require('../../../assets/images/logo.png')} 
            style={[dynamicStyles.logo, animatedLogoStyle]}
            resizeMode="cover"
          />
          <Text style={dynamicStyles.title}>{i18n.t('global.welcomeBack')}</Text>
          <Text style={dynamicStyles.subtitle}>{i18n.t('global.signInToManageYourSu')}</Text>
        </View>

        <LoginForm />

        <View style={dynamicStyles.footerContainer}>
          <Text style={dynamicStyles.footerText}>{i18n.t('global.dontHaveAnAccount')}</Text>
          <Link href="/(auth)/register" style={dynamicStyles.footerLink}>
            Sign up
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
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
