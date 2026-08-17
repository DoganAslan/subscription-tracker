import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';
import { AuthService } from '@/services/firebase/auth';
import { useTranslation } from '@/context/LanguageContext';

WebBrowser.maybeCompleteAuthSession();

const PLACEHOLDER_CLIENT_ID = 'missing-google-client-id.apps.googleusercontent.com';

export function useGoogleSignIn() {
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const activeClientId = Platform.select({
    android: androidClientId,
    ios: iosClientId,
    default: webClientId,
  });
  const [isSigningIn, setIsSigningIn] = useState(false);
  const responseHandled = useRef<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: androidClientId || PLACEHOLDER_CLIENT_ID,
    iosClientId: iosClientId || PLACEHOLDER_CLIENT_ID,
    webClientId: webClientId || PLACEHOLDER_CLIENT_ID,
    selectAccount: true,
  });

  const completeNativeSignIn = useCallback(async (idToken: string) => {
    try {
      await AuthService.signInWithGoogleIdToken(idToken);
      Toast.show({
        type: 'success',
        text1: isTurkish ? 'Google ile giriş yapıldı' : 'Signed in with Google',
        position: 'top',
      });
    } catch (error: any) {
      console.error('[Google native sign-in]:', error?.code, error?.message);
      Toast.show({
        type: 'error',
        text1: isTurkish ? 'Google ile giriş tamamlanamadı.' : 'Could not complete Google sign-in.',
        position: 'top',
      });
    } finally {
      setIsSigningIn(false);
    }
  }, [isTurkish]);

  useEffect(() => {
    if (!response || response.type !== 'success') return;

    const idToken = response.params.id_token;
    if (!idToken || responseHandled.current === idToken) return;

    responseHandled.current = idToken;
    void completeNativeSignIn(idToken);
  }, [response, completeNativeSignIn]);

  const startGoogleSignIn = useCallback(async () => {
    if (Platform.OS === 'web') {
      setIsSigningIn(true);
      try {
        await AuthService.signInWithGoogle();
        Toast.show({ type: 'success', text1: isTurkish ? 'Google ile giriş yapıldı' : 'Signed in with Google', position: 'top' });
      } catch {
        // AuthService shows the specific web error.
      } finally {
        setIsSigningIn(false);
      }
      return;
    }

    if (!activeClientId) {
      Alert.alert(
        isTurkish ? 'Google girişi yapılandırılmalı' : 'Google sign-in needs configuration',
        isTurkish
          ? 'Bu sürüm için Google OAuth istemci kimliği eklenmemiş. Geliştiricinin EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID değerini ekleyip uygulamayı yeniden build etmesi gerekiyor.'
          : 'No Google OAuth client ID has been added for this build. Add EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID and rebuild the app.'
      );
      return;
    }

    if (!request) {
      Toast.show({ type: 'info', text1: isTurkish ? 'Google girişi hazırlanıyor…' : 'Preparing Google sign-in…', position: 'top' });
      return;
    }

    setIsSigningIn(true);
    const result = await promptAsync();
    if (result.type !== 'success') {
      setIsSigningIn(false);
      if (result.type !== 'cancel' && result.type !== 'dismiss') {
        Toast.show({ type: 'error', text1: isTurkish ? 'Google ile giriş başlatılamadı.' : 'Could not start Google sign-in.', position: 'top' });
      }
    }
  }, [activeClientId, isTurkish, promptAsync, request]);

  return { startGoogleSignIn, isSigningIn };
}
