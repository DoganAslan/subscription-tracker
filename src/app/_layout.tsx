import { Stack } from 'expo-router';
import { LogBox, Platform, AppState, View, Image, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '@/providers/ErrorBoundary';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { LanguageProvider } from '@/context/LanguageContext';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/common/ToastConfig';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticateUser } from '@/utils/biometrics';
import { BiometricOverlay } from '@/components/BiometricOverlay';
import { registerForPushNotificationsAsync } from '@/services/notificationService';
import { ThemeProvider } from '@/context/ThemeContext';
import { getMarketRatesWithDynamicCache } from '@/utils/currency';
import { neutralizeProductionLogs } from '@/utils/security';
import '../../global.css';
import '../locales/i18n';

import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Fire immediately upon JS Engine boot:
neutralizeProductionLogs();
// Suppress third-party web-only SVG touch warnings
LogBox.ignoreLogs([
  'Unknown event handler property',
  'Unknown event handler property `onPressIn`',
  'Unknown event handler property `onResponder`',
  'Unknown event handler property `onStartShouldSetResponder`',
  'Unknown event handler property `onResponderTerminate`',
]);

// Prevent splash screen from auto-hiding until we manually hide it
SplashScreen.preventAutoHideAsync().catch(() => {
  // Gracefully handle error if splash screen is already hidden (e.g., fast refresh)
});

function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const appState = useRef(AppState.currentState);
  const [currentAppState, setCurrentAppState] = useState(AppState.currentState);

  const hasRequestedToken = useRef(false);

  useEffect(() => {
    // Preload Ionicons font for Web & Native
    Font.loadAsync(Ionicons.font).catch(console.warn);

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
  const isPromptingBiometric = useRef(false);

  const unlockWithBiometrics = async () => {
    if (isPromptingBiometric.current) return;

    isPromptingBiometric.current = true;
    try {
      const success = await authenticateUser();
      if (success) setIsLocked(false);
    } finally {
      isPromptingBiometric.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem('@submate_biometric_enabled').then((enabled) => {
      if (!isMounted || enabled !== 'true') return;
      setIsLocked(true);
      void unlockWithBiometrics();
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextAppState => {
      const previousAppState = appState.current;

      if (nextAppState.match(/inactive|background/)) {
        const enabled = await AsyncStorage.getItem('@submate_biometric_enabled');
        if (enabled === 'true') {
          setIsLocked(true);
        }
      }

      if (previousAppState.match(/inactive|background/) && nextAppState === 'active') {
        const enabled = await AsyncStorage.getItem('@submate_biometric_enabled');
        if (enabled === 'true') {
          setIsLocked(true);
          void unlockWithBiometrics();
        }
      }

      appState.current = nextAppState;
      setCurrentAppState(nextAppState);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const triggerAuth = () => void unlockWithBiometrics();

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
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
        {currentAppState !== 'active' && (
          <View style={styles.privacyShield}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.shieldLogo} 
            />
          </View>
        )}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default RootLayout;

const styles = StyleSheet.create({
  privacyShield: {
    ...StyleSheet.absoluteFill,
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
