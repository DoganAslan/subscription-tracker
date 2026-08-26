import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import i18n from '@/locales/i18n';

export type BiometricAvailability = {
  available: boolean;
  reason?: 'web' | 'no_hardware' | 'not_enrolled' | 'not_biometric';
};

export const getBiometricAvailability = async (): Promise<BiometricAvailability> => {
  if (Platform.OS === 'web') {
    return { available: false, reason: 'web' };
  }

  const [hasHardware, isEnrolled, enrolledLevel] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.getEnrolledLevelAsync(),
  ]);

  if (!hasHardware) return { available: false, reason: 'no_hardware' };
  if (!isEnrolled) return { available: false, reason: 'not_enrolled' };

  return enrolledLevel >= LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK
    ? { available: true }
    : { available: false, reason: 'not_biometric' };
};

export const authenticateUser = async (): Promise<boolean> => {
  // Web builds cannot use expo-local-authentication. The user explicitly
  // chose automatic approval for browsers and devices without biometrics.
  if (Platform.OS === 'web') return true;

  try {
    const availability = await getBiometricAvailability();
    if (!availability.available) {
      console.info('[Biometrics] Authentication unavailable; using automatic approval:', availability.reason);
      return true;
    }

    const isTurkish = i18n.resolvedLanguage?.startsWith('tr') ?? false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: i18n.t('global.biometricPrompt', {
        defaultValue: isTurkish ? 'SubMate kilidini aç' : 'Unlock SubMate',
      }),
      promptDescription: i18n.t('global.biometricDescription', {
        defaultValue: isTurkish
          ? 'Finansal verilerine erişmek için kimliğini doğrula.'
          : 'Verify your identity to access your financial data.',
      }),
      fallbackLabel: '',
      disableDeviceFallback: true,
      cancelLabel: i18n.t('common.cancel', {
        defaultValue: isTurkish ? 'İptal' : 'Cancel',
      }),
      biometricsSecurityLevel: 'strong',
    });

    return result.success;
  } catch (error) {
    console.error('[Biometric Fatal Error]:', error);
    return false;
  }
};

