import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { t } from '@/locales/i18n';

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
  if (Platform.OS === 'web') return false;

  try {
    const availability = await getBiometricAvailability();
    if (!availability.available) {
      console.warn('[Biometrics] Authentication unavailable:', availability.reason);
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: (t.global as any)?.biometricPrompt || 'SubMate kilidini aç',
      promptDescription: (t.global as any)?.biometricDescription || 'Finansal verilerini güvenle aç',
      fallbackLabel: '',
      disableDeviceFallback: true,
      cancelLabel: t.common?.cancel || 'İptal',
      biometricsSecurityLevel: 'strong',
    });

    return result.success;
  } catch (error) {
    console.error('[Biometric Fatal Error]:', error);
    return false;
  }
};


