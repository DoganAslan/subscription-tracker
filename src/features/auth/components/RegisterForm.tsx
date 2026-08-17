import i18n, { t } from '@/locales/i18n';
import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Checkbox from 'expo-checkbox';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { registerSchema, RegisterFormData } from '../schemas/auth.schema';
import { useAuthMutations } from '../hooks/useAuthMutations';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { triggerHaptic } from '@/utils/haptics';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';

export function RegisterForm() {
  const { registerMutation } = useAuthMutations();
  const { startGoogleSignIn, isSigningIn } = useGoogleSignIn();
  const { colors } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const [isConsentGiven, setIsConsentGiven] = React.useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' }
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="displayName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t.authLeaks?.fullName || 'Full Name'}
            placeholder={t.global.johnDoe}
            autoCapitalize="words"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.displayName?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t.authLeaks?.emailAddress || 'Email Address'}
            placeholder={t.global.youexamplecom}
            keyboardType="email-address"
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t.authLeaks?.password || 'Password'}
            placeholder="••••••••"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t.authLeaks?.confirmPassword || 'Confirm Password'}
            placeholder="••••••••"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.confirmPassword?.message}
          />
        )}
      />
      <View style={styles.checkboxContainer}>
        <Checkbox
          value={isConsentGiven}
          onValueChange={setIsConsentGiven}
          color={isConsentGiven ? colors.primary : undefined}
          style={styles.checkbox}
        />
        <TouchableOpacity style={styles.checkboxLabel} onPress={() => setIsConsentGiven(!isConsentGiven)} activeOpacity={0.8}>
          <Text style={[styles.consentText, { color: colors.textSecondary }]}>
            {t.legal?.consentText || 'I have read and agree to the Privacy Policy and Terms of Use.'}
          </Text>
        </TouchableOpacity>
      </View>

      <Button 
        title={t.authLeaks?.createAccountBtn || 'Create Account'} 
        onPress={handleSubmit(onSubmit)} 
        isLoading={registerMutation.isPending}
        disabled={!isConsentGiven}
        style={styles.button}
      />

      {/* OR DIVIDER & GOOGLE SIGN IN BUTTON */}
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <View style={[styles.dividerBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
            {isTurkish ? 'VEYA' : 'OR'}
          </Text>
        </View>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <TouchableOpacity
        style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => {
          triggerHaptic('impactLight');
          void startGoogleSignIn();
        }}
        activeOpacity={0.85}
        disabled={isSigningIn}
      >
        <View style={styles.googleIconCircle}>
          <Ionicons name="logo-google" size={16} color="#EA4335" />
        </View>
        <Text style={[styles.googleButtonText, { color: colors.text }]}>
          {isSigningIn
            ? (isTurkish ? 'Bağlanılıyor...' : 'Connecting...')
            : (isTurkish ? 'Google ile Kayıt Ol' : 'Continue with Google')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    marginTop: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxLabel: {
    flex: 1,
  },
  consentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 8,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA4335',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
