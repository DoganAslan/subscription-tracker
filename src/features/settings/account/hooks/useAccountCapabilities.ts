import { auth } from '@/services/firebase/config';

export type AccountCapabilities = {
  hasPasswordProvider: boolean;
  hasGoogleProvider: boolean;
  canChangeEmail: boolean;
  canChangePassword: boolean;
  canResetPassword: boolean;
  requiresPasswordForDelete: boolean;
};

export function getAccountCapabilities(providerIds: string[], hasEmail: boolean): AccountCapabilities {
  const hasPasswordProvider = providerIds.includes('password');
  const hasGoogleProvider = providerIds.includes('google.com');
  return {
    hasPasswordProvider,
    hasGoogleProvider,
    canChangeEmail: hasPasswordProvider,
    canChangePassword: hasPasswordProvider,
    canResetPassword: hasPasswordProvider && hasEmail,
    requiresPasswordForDelete: hasPasswordProvider,
  };
}

export function useAccountCapabilities(): AccountCapabilities {
  const currentUser = auth.currentUser;
  return getAccountCapabilities(currentUser?.providerData.map(provider => provider.providerId) || [], Boolean(currentUser?.email));
}
