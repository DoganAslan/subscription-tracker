import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { loginSchema, LoginFormData } from '../schemas/auth.schema';
import { useAuthMutations } from '../hooks/useAuthMutations';
import { AuthService } from '@/services/firebase/auth';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

export function LoginForm() {
  const { loginMutation } = useAuthMutations();
  const { colors } = useTheme();
  
  const [isResetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const { t } = useTranslation();

  const handleForgotPassword = async () => {
    // 1. Pre-flight input sanitization
    const cleanEmail = resetEmail?.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert('Hata', t('auth.invalidEmailFormat', 'Geçerli bir e-posta girin.')); // Use i18n
      return;
    }

    try {
      // 2. Execute SDK call
      await AuthService.sendPasswordResetEmail(cleanEmail);

      Alert.alert('Başarılı', t('auth.resetEmailSentSuccess', 'Sıfırlama bağlantısı gönderildi.'));
      setResetModalVisible(false);
      setResetEmail('');
    } catch (error: any) {
      // 3. Senior Defensive Error Mapping (NEVER let raw objects reach the user)
      const rawCode = error?.code || error?.message || 'unknown_error';
      console.log('[auth_reset_error]:', rawCode);

      let userFriendlyMsg = t('auth.genericError', 'Bir hata oluştu.');
      if (rawCode.includes('user-not-found')) userFriendlyMsg = t('auth.userNotFound', 'Kullanıcı bulunamadı.');
      else if (rawCode.includes('invalid-email')) userFriendlyMsg = t('auth.invalidEmailFormat', 'Geçersiz e-posta formatı.');
      else if (rawCode.includes('too-many-requests')) userFriendlyMsg = t('auth.tooManyRequests', 'Çok fazla deneme yaptınız, bekleyin.');
      else if (rawCode.includes('network')) userFriendlyMsg = 'Ağ bağlantısı hatası.';

      // Fallback display showing the exact code if unmapped, so QA can debug physical APKs!
      Alert.alert('İşlem Başarısız', `${userFriendlyMsg}\n(Kod: ${rawCode})`);
    }
  };
  
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email Address"
            placeholder="you@example.com"
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
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
          />
        )}
      />
      <TouchableOpacity 
        style={styles.forgotPasswordContainer} 
        onPress={() => {
          setResetEmail('');
          setResetModalVisible(true);
        }}
      >
        <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
      </TouchableOpacity>

      <Button 
        title="Log In" 
        onPress={handleSubmit(onSubmit)} 
        isLoading={loginMutation.isPending}
        style={styles.button}
      />

      <Modal visible={isResetModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#0B0F19', borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: '#FFFFFF' }]}>Reset Password</Text>
            <Text style={[styles.modalSubtitle, { color: '#9CA3AF' }]}>
              Enter your registered email address and we will send you a link to reset your password.
            </Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: '#111827', borderColor: colors.border, color: '#FFFFFF' }]}
              placeholder="Email Address"
              placeholderTextColor="#6B7280"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <Button 
                title="Cancel" 
                variant="secondary" 
                onPress={() => setResetModalVisible(false)} 
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button 
                title="Send Link" 
                onPress={handleForgotPassword} 
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
