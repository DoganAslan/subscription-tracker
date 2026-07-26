import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { t } from '@/locales/i18n';

export const authenticateUser = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    console.log('[Web Mock] Biometric prompt simulated & automatically approved on browser target.');
    return true;
  }

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      console.warn('[Biometrics] Device lacks hardware or enrolled biometrics. Auto-unlocking fallback.');
      return true; // Fallback so user isn't locked out permanently
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: (t.global as any)?.biometricPrompt || 'Unlock SubMate',
      fallbackLabel: (t.global as any)?.usePassword || 'Use Password',
      disableDeviceFallback: false,
      cancelLabel: t.common?.cancel || 'Cancel',
    });

    return result.success;
  } catch (error) {
    console.error('[Biometric Fatal Error]:', error);
    return true; // Safe fail-open principle for app recovery
  }
};



