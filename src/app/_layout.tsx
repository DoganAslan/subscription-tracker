import { Stack, useRouter } from 'expo-router';
import { LogBox, Platform, AppState, View, Image, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '@/providers/ErrorBoundary';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { LanguageProvider } from '@/context/LanguageContext';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/common/ToastConfig';
import { AppLockGuard } from '@/components/common/AppLockGuard';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomSplashScreen } from '@/components/SplashScreen';
import { authenticateUser } from '@/utils/biometrics';
import { BiometricOverlay } from '@/components/BiometricOverlay';
import { registerForPushNotificationsAsync } from '@/services/notifications/notificationService';
import { ThemeProvider } from '@/context/ThemeContext';
import { getMarketRatesWithDynamicCache } from '@/utils/currency';
import { neutralizeProductionLogs } from '@/utils/security';
import '../../global.css';
import '../locales/i18n';
import { t } from '@/locales/i18n';

// Fire immediately upon JS Engine boot:
neutralizeProductionLogs();
// Suppress third-party web-only SVG touch warnings
LogBox.ignoreLogs([
  'Unknown event handler property `onPressIn`',
  'Unknown event handler property `onResponder`',
  'Unknown event handler property `onStartShouldSetResponder`',
]);

// Prevent splash screen from auto-hiding until we manually hide it
SplashScreen.preventAutoHideAsync().catch(() => {
  // Gracefully handle error if splash screen is already hidden (e.g., fast refresh)
});

function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const router = useRouter();

  const hasRequestedToken = useRef(false);

  useEffect(() => {
    // Fire and forget: syncs rates silently in the background
    getMarketRatesWithDynamicCache();
    
    if (Platform.OS !== 'web') {
      if (hasRequestedToken.current) return;
      hasRequestedToken.current = true;
      registerForPushNotificationsAsync().catch(console.warn);
    }
    
    setIsReady(true);
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const [isLocked, setIsLocked] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    // Check initial setting
    AsyncStorage.getItem('@submate_biometric_enabled').then(val => {
      setBiometricEnabled(val === 'true');
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextAppState => {
      // Transition from background to active
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        const enabled = await AsyncStorage.getItem('@submate_biometric_enabled');
        if (enabled === 'true') {
          setIsLocked(true);
          const success = await authenticateUser();
          if (success) {
            setIsLocked(false);
          }
        }
      }
      setAppState(nextAppState);
    });
    return () => {
      subscription.remove();
    };
  }, [appState]);

  const triggerAuth = async () => {
    const success = await authenticateUser();
    if (success) {
      setIsLocked(false);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <LanguageProvider>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                <ProtectedRoute>
                  <>
                    {isLocked && <BiometricOverlay onUnlockRetry={triggerAuth} />}
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="onboarding" />
                      <Stack.Screen name="(tabs)" />
                    </Stack>
                    <Toast config={toastConfig} />
                  </>
                </ProtectedRoute>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </LanguageProvider>
      </ErrorBoundary>
      {appState !== 'active' && (
        <View style={styles.privacyShield}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.shieldLogo} 
          />
        </View>
      )}
    </GestureHandlerRootView>
  );
}

export default RootLayout;

const styles = StyleSheet.create({
  privacyShield: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  shieldLogo: {
    width: 100,
    height: 100,
    borderRadius: 24,
  }
});
