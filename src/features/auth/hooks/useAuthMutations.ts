import { useMutation } from '@tanstack/react-query';
import { AuthService } from '@/services/firebase/auth';
import { LoginFormData, RegisterFormData } from '../schemas/auth.schema';
import Toast from 'react-native-toast-message';

import { router } from 'expo-router';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useTranslation } from '@/context/LanguageContext';
import { getUserFacingError } from '@/utils/userFacingError';

export const useAuthMutations = () => {
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return await AuthService.logIn(data.email, data.password);
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: isTurkish ? 'Tekrar hoş geldin!' : 'Welcome back!', position: 'top' });
    },
    onError: (error: unknown) => {
      console.error('DEBUG [Firebase Auth Error]:', error);
      const message = getUserFacingError(error, isTurkish, {
        tr: 'Giriş yapılamadı.',
        en: 'Could not sign in.',
      });
      Toast.show({ type: 'error', text1: message, position: 'top' });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      return await AuthService.signUp(data.email, data.password, data.displayName);
    },
    onSuccess: async () => {
      Toast.show({ type: 'success', text1: isTurkish ? 'Hesabın oluşturuldu!' : 'Account created successfully!', position: 'top' });
      resetOnboarding();
      router.replace('/onboarding');
    },
    onError: (error: unknown) => {
      const message = getUserFacingError(error, isTurkish, {
        tr: 'Hesap oluşturulamadı.',
        en: 'Could not create the account.',
      });
      Toast.show({ type: 'error', text1: message, position: 'top' });
    }
  });

  return {
    loginMutation,
    registerMutation
  };
};
