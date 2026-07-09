import i18n, { t } from '@/locales/i18n';
import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Checkbox from 'expo-checkbox';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { registerSchema, RegisterFormData } from '../schemas/auth.schema';
import { useAuthMutations } from '../hooks/useAuthMutations';

import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';

export function RegisterForm() {
  const { registerMutation } = useAuthMutations();
  const { colors } = useTheme();
  const { t } = useTranslation();
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
});
