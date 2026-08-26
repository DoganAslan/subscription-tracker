import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Toast from 'react-native-toast-message';
import { AuthService } from '@/services/firebase/auth';
import { useTranslation } from '@/context/LanguageContext';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

// Google blocks browser OAuth redirects that use custom URI schemes on Android.
// Standalone builds therefore use the native Google Sign-In SDK. The web client
// ID is intentionally used here because Firebase Auth consumes its ID token.
if (Platform.OS !== 'web' && webClientId) {
  GoogleSignin.configure({
    webClientId,
    ...(Platform.OS === 'ios' && iosClientId ? { iosClientId } : {}),
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });
}

export function useGoogleSignIn() {
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const [isSigningIn, setIsSigningIn] = useState(false);

  const startGoogleSignIn = useCallback(async () => {
    if (Platform.OS === 'web') {
      setIsSigningIn(true);
      try {
        await AuthService.signInWithGoogle();
        Toast.show({
          type: 'success',
          text1: isTurkish ? 'Google ile giriş yapıldı' : 'Signed in with Google',
          position: 'top',
        });
      } catch {
        // AuthService already presents the specific Firebase web error.
      } finally {
        setIsSigningIn(false);
      }
      return;
    }

    if (!webClientId) {
      Alert.alert(
        isTurkish ? 'Google girişi yapılandırılmalı' : 'Google sign-in needs configuration',
        isTurkish
          ? 'Google Web OAuth istemci kimliği bu sürüme eklenmemiş. Uygulama yöneticisi yapılandırmayı tamamlayıp yeniden build etmelidir.'
          : 'The Google Web OAuth client ID is missing from this build. The app administrator must complete the configuration and rebuild.'
      );
      return;
    }

    setIsSigningIn(true);
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return;

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error('Google Sign-In returned no ID token.');
      }

      await AuthService.signInWithGoogleIdToken(idToken);
      Toast.show({
        type: 'success',
        text1: isTurkish ? 'Google ile giriş yapıldı' : 'Signed in with Google',
        position: 'top',
      });
    } catch (error: unknown) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) return;

        if (error.code === statusCodes.IN_PROGRESS) {
          Toast.show({
            type: 'info',
            text1: isTurkish ? 'Google girişi zaten açık.' : 'Google sign-in is already in progress.',
            position: 'top',
          });
          return;
        }

        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert(
            isTurkish ? 'Google Play Hizmetleri gerekli' : 'Google Play Services required',
            isTurkish
              ? 'Google Play Hizmetlerini güncelledikten sonra tekrar deneyin.'
              : 'Update Google Play Services and try again.'
          );
          return;
        }

        console.error('[Google native sign-in]:', error.code, error.message);
      } else {
        console.error('[Google native sign-in]:', error);
      }

      Toast.show({
        type: 'error',
        text1: isTurkish
          ? 'Google ile giriş tamamlanamadı. Lütfen tekrar deneyin.'
          : 'Could not complete Google sign-in. Please try again.',
        position: 'top',
      });
    } finally {
      setIsSigningIn(false);
    }
  }, [isTurkish]);

  return { startGoogleSignIn, isSigningIn };
}
