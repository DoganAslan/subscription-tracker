import { useMutation } from '@tanstack/react-query';
import { AuthService } from '@/services/firebase/auth';
import { LoginFormData, RegisterFormData } from '../schemas/auth.schema';
import { useToastStore } from '@/store/useToastStore';

export const useAuthMutations = () => {
  const showToast = useToastStore((state) => state.showToast);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return await AuthService.logIn(data.email, data.password);
    },
    onSuccess: () => {
      showToast('Welcome back!', 'success');
    },
    onError: (error: any) => {
      const message = error?.code === 'auth/invalid-credential' 
        ? 'Invalid email or password' 
        : error?.message || 'Failed to log in';
      showToast(message, 'error');
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      return await AuthService.signUp(data.email, data.password, data.displayName);
    },
    onSuccess: () => {
      showToast('Account created successfully!', 'success');
    },
    onError: (error: any) => {
      const message = error?.code === 'auth/email-already-in-use'
        ? 'This email is already in use'
        : error?.message || 'Failed to create account';
      showToast(message, 'error');
    }
  });

  return {
    loginMutation,
    registerMutation
  };
};
