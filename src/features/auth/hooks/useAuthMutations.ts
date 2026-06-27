import i18n from '@/locales/i18n';
import { useMutation } from '@tanstack/react-query';
import { AuthService } from '@/services/firebase/auth';
import { LoginFormData, RegisterFormData } from '../schemas/auth.schema';
import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';

import { router } from 'expo-router';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';

export const useAuthMutations = () => {
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return await AuthService.logIn(data.email, data.password);
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Welcome back!', position: 'top' });
    },
    onError: (error: any) => {
      console.error("DEBUG [Firebase Auth Error]:", error.code, error.message);
      Alert.alert(i18n.t('global.giriHatas'), i18n.t('global.kodErrorcodenmesajEr')
      );
      const message = error?.code === 'auth/invalid-credential' 
        ? 'Invalid email or password' 
        : error?.message || 'Failed to log in';
      Toast.show({ type: 'error', text1: message, position: 'top' });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      return await AuthService.signUp(data.email, data.password, data.displayName);
    },
    onSuccess: async () => {
      Toast.show({ type: 'success', text1: 'Account created successfully!', position: 'top' });
      resetOnboarding();
      router.replace('/onboarding');
    },
    onError: (error: any) => {
      const message = error?.code === 'auth/email-already-in-use'
        ? 'This email is already in use'
        : error?.message || 'Failed to create account';
      Toast.show({ type: 'error', text1: message, position: 'top' });
    }
  });

  return {
    loginMutation,
    registerMutation
  };
};
