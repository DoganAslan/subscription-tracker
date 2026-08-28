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
import { useCallback, useEffect, useState, useRef } from 'react';
import { authenticateUser } from '@/utils/biometrics';
import { BiometricOverlay } from '@/components/BiometricOverlay';
import { registerForPushNotificationsAsync, registerNotificationHistoryListeners } from '@/services/notificationService';
import { ThemeProvider } from '@/context/ThemeContext';
import { getMarketRatesWithDynamicCache } from '@/utils/currency';
import { neutralizeProductionLogs } from '@/utils/security';
import { useSecurityStore } from '@/store/useSecurityStore';
import { initializeMonitoring } from '@/services/monitoring/sentry';
import * as Sentry from '@sentry/react-native';
import '../../global.css';
import '../locales/i18n';

import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SessionLifecycleCoordinator } from '@/features/auth/application/SessionLifecycleCoordinator';

// Fire immediately upon JS Engine boot:
initializeMonitoring();
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
  const isBiometricsEnabled = useSecurityStore(state => state.isBiometricsEnabled);
  const appState = useRef(AppState.currentState);
  const [currentAppState, setCurrentAppState] = useState(AppState.currentState);

  const hasRequestedToken = useRef(false);

  useEffect(() => {
    // Preload Ionicons font for Web & Native
    Font.loadAsync(Ionicons.font).catch(console.warn);

    // Fire and forget: syncs rates silently in the background
    getMarketRatesWithDynamicCache();
    
    let removeNotificationHistoryListeners: () => void = () => {};
    if (Platform.OS !== 'web') {
      removeNotificationHistoryListeners = registerNotificationHistoryListeners();
      if (!hasRequestedToken.current) {
        hasRequestedToken.current = true;
        registerForPushNotificationsAsync().catch(console.warn);
      }
    }
    
    setIsReady(true);
    SplashScreen.hideAsync().catch(() => {});

    return () => removeNotificationHistoryListeners();
  }, []);

  const [isLocked, setIsLocked] = useState(false);
  const isPromptingBiometric = useRef(false);

  const unlockWithBiometrics = useCallback(async () => {
    if (isPromptingBiometric.current) return;

    isPromptingBiometric.current = true;
    try {
      const success = await authenticateUser();
      if (success) setIsLocked(false);
    } finally {
      isPromptingBiometric.current = false;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !isBiometricsEnabled) {
      setIsLocked(false);
      return;
    }

    setIsLocked(true);
    void unlockWithBiometrics();
  }, [isBiometricsEnabled, unlockWithBiometrics]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextAppState => {
      const previousAppState = appState.current;

      if (isBiometricsEnabled && nextAppState.match(/inactive|background/)) {
        setIsLocked(true);
      }

      if (
        isBiometricsEnabled
        && previousAppState.match(/inactive|background/)
        && nextAppState === 'active'
      ) {
        await unlockWithBiometrics();
      }

      appState.current = nextAppState;
      setCurrentAppState(nextAppState);
    });
    return () => {
      subscription.remove();
    };
  }, [isBiometricsEnabled, unlockWithBiometrics]);

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
                  <SessionLifecycleCoordinator />
                  <ProtectedRoute>
                    <>
                      {isLocked && Platform.OS !== 'web' && <BiometricOverlay onUnlockRetry={triggerAuth} />}
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

export default Sentry.wrap(RootLayout);

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
