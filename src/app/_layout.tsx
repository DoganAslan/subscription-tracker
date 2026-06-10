import { Slot } from 'expo-router';
import { ErrorBoundary } from '@/providers/ErrorBoundary';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { ToastContainer } from '@/components/common/ToastContainer';
import { AppLockGuard } from '@/components/common/AppLockGuard';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { NotificationService } from '@/features/notifications/services/notificationService';
import '../../global.css';

// Prevent splash screen from auto-hiding until we manually hide it
SplashScreen.preventAutoHideAsync().catch(() => {
  // Gracefully handle error if splash screen is already hidden (e.g., fast refresh)
});

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions gracefully on first launch
    NotificationService.requestPermissionsAsync();
    
    // Hide native splash screen immediately after the layout mounts. 
    // ProtectedRoute will take over and display our React AppLoader until Firebase resolves auth.
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <ProtectedRoute>
            <AppLockGuard>
              <Slot />
              <ToastContainer />
            </AppLockGuard>
          </ProtectedRoute>
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
