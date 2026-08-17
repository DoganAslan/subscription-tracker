import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, TextInput, Alert, ScrollView, Pressable } from 'react-native';
import Checkbox from 'expo-checkbox';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { loginSchema, LoginFormData } from '../schemas/auth.schema';
import { useAuthMutations } from '../hooks/useAuthMutations';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { AuthService } from '@/services/firebase/auth';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import i18n from '@/locales/i18n';

import { triggerHaptic } from '@/utils/haptics';

export function LoginForm() {
  const { loginMutation } = useAuthMutations();
  const { startGoogleSignIn, isSigningIn } = useGoogleSignIn();
  const { colors } = useTheme();

  const [isResetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isConsentGiven, setIsConsentGiven] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);

  const { t, currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  const handleForgotPassword = async () => {
    const cleanEmail = resetEmail?.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert(
        isTurkish ? 'Hata' : 'Error',
        i18n.t('auth.invalidEmailFormat', isTurkish ? 'Geçerli bir e-posta girin.' : 'Enter a valid email address.')
      );
      return;
    }

    try {
      await AuthService.sendPasswordResetEmail(cleanEmail);
      Alert.alert(
        isTurkish ? 'Başarılı' : 'Success',
        i18n.t('auth.resetEmailSentSuccess', isTurkish ? 'Sıfırlama bağlantısı gönderildi.' : 'A reset link has been sent.')
      );
      setResetModalVisible(false);
      setResetEmail('');
    } catch (error: any) {
      const rawCode = error?.code || error?.message || 'unknown_error';
      let userFriendlyMsg = i18n.t('auth.genericError', isTurkish ? 'Bir hata oluştu.' : 'Something went wrong.');
      if (rawCode.includes('user-not-found')) userFriendlyMsg = i18n.t('auth.userNotFound', isTurkish ? 'Kullanıcı bulunamadı.' : 'User not found.');
      else if (rawCode.includes('invalid-email')) userFriendlyMsg = i18n.t('auth.invalidEmailFormat', isTurkish ? 'Geçersiz e-posta formatı.' : 'Invalid email format.');
      else if (rawCode.includes('too-many-requests')) userFriendlyMsg = i18n.t('auth.tooManyRequests', isTurkish ? 'Çok fazla deneme yaptınız, bekleyin.' : 'Too many attempts. Please wait and try again.');
      else if (rawCode.includes('network')) userFriendlyMsg = isTurkish ? 'Ağ bağlantısı hatası.' : 'Network connection error.';

      Alert.alert(isTurkish ? 'İşlem başarısız' : 'Action failed', `${userFriendlyMsg}\n${isTurkish ? 'Kod' : 'Code'}: ${rawCode}`);
    }
  };

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleAcceptLegalModal = () => {
    setIsConsentGiven(true);
    setActiveLegalModal(null);
  };

  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t.authLeaks?.emailAddress || 'Email Address'}
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

      <View style={{ position: 'relative' }}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t.authLeaks?.password || 'Password'}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.password?.message}
            />
          )}
        />
        <TouchableOpacity
          style={styles.eyeIconButton}
          onPress={() => setShowPassword(!showPassword)}
          activeOpacity={0.7}
        >
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.forgotPasswordContainer}
        onPress={() => {
          setResetEmail('');
          setResetModalVisible(true);
        }}
      >
        <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
          {t.authLeaks?.forgotPasswordLabel || 'Forgot Password?'}
        </Text>
      </TouchableOpacity>

      {/* CONSENT CHECKBOX & INTERACTIVE LEGAL LINKS */}
      <View style={styles.checkboxContainer}>
        <Checkbox
          value={isConsentGiven}
          onValueChange={setIsConsentGiven}
          color={isConsentGiven ? colors.primary : undefined}
          style={styles.checkbox}
        />
        <View style={styles.checkboxLabel}>
          <Text style={[styles.consentText, { color: colors.textSecondary }]}>
            {t.legal?.readAndAgreePrefix || 'I have read, understood and accept the '}
            <Text
              style={[styles.legalLink, { color: colors.primary }]}
              onPress={() => setActiveLegalModal('privacy')}
            >
              {t.legal?.privacyPolicy || 'Privacy Policy'}
            </Text>
            {' '}{t.legal?.andWord || 'and'}{' '}
            <Text
              style={[styles.legalLink, { color: colors.primary }]}
              onPress={() => setActiveLegalModal('terms')}
            >
              {t.legal?.termsOfUse || 'Terms of Use'}
            </Text>.
          </Text>
        </View>
      </View>

      <Button
        title={t.authLeaks?.logInBtn || 'Log In'}
        onPress={handleSubmit(onSubmit)}
        isLoading={loginMutation.isPending}
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
            : (isTurkish ? 'Google ile Devam Et' : 'Continue with Google')}
        </Text>
      </TouchableOpacity>

      {/* RESET PASSWORD MODAL */}
      <Modal visible={isResetModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{isTurkish ? 'Şifreyi sıfırla' : 'Reset password'}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {isTurkish ? 'Kayıtlı e-posta adresini gir; şifreni sıfırlaman için bağlantı gönderelim.' : 'Enter your registered email address and we will send you a reset link.'}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder={t.authLeaks?.emailAddress || 'Email Address'}
              placeholderTextColor={colors.textSecondary}
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <Button
                title={isTurkish ? 'İptal' : 'Cancel'}
                variant="secondary"
                onPress={() => setResetModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={isTurkish ? 'Bağlantı gönder' : 'Send link'}
                onPress={handleForgotPassword}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* INTERACTIVE LEGAL CONTENT MODAL (PRIVACY / TERMS) */}
      <Modal
        visible={activeLegalModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveLegalModal(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setActiveLegalModal(null)} />
          <View style={[styles.legalModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {activeLegalModal === 'privacy'
                  ? (t.legal?.privacyPolicy || 'Privacy Policy')
                  : (t.legal?.termsOfUse || 'Terms of Use')}
              </Text>
              <TouchableOpacity onPress={() => setActiveLegalModal(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.legalScrollView} showsVerticalScrollIndicator={true}>
              <Text style={[styles.legalBodyText, { color: colors.textSecondary }]}>
                {activeLegalModal === 'privacy'
                  ? (t.legal?.privacyPolicyContent || 'Privacy policy content is loading...')
                  : (t.legal?.termsOfUseContent || 'Terms of use content is loading...')}
              </Text>
            </ScrollView>

            <View style={styles.acceptButtonContainer}>
              <Button
                title="✓ Okudum ve Kabul Ediyorum"
                onPress={handleAcceptLegalModal}
                style={{ width: '100%', backgroundColor: colors.primary }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  eyeIconButton: {
    position: 'absolute',
    right: 14,
    top: 38,
    padding: 4,
    zIndex: 10,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    margin: 20,
  },
  legalModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    borderWidth: 1,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
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
  legalScrollView: {
    maxHeight: 380,
    marginBottom: 16,
  },
  legalBodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  acceptButtonContainer: {
    paddingTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    marginBottom: 8,
  },
  checkbox: {
    marginRight: 10,
    marginTop: 2,
    borderRadius: 4,
  },
  checkboxLabel: {
    flex: 1,
  },
  consentText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  legalLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
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
