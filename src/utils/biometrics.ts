// src/utils/biometrics.ts
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export const authenticateBiometric = async (): Promise<boolean> => {
  // DEV & WEB BYPASS: Browsers do not possess native Secure Enclaves. Auto-unlock.
  if (Platform.OS === 'web') {
    console.log("Web environment detected. Bypassing Biometric Gate.");
    return true;
  }

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    // If the user's phone has no passcode or fingerprint set up at OS level, don't lock them out
    if (!hasHardware || !isEnrolled) {
      console.warn("️ Biometrics not enrolled on this device. Bypassing.");
      return true; 
    }

    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage: 'SubMate Kasasını Açın',
      fallbackLabel: 'Cihaz Şifresini Kullan',
      cancelLabel: 'İptal',
      disableDeviceFallback: false, // Allows PIN/Pattern fallback if FaceID fails
    });

    return authResult.success;
  } catch (error) {
    console.error("Biometric Gate Handshake Failed:", error);
    return false;
  }
};
