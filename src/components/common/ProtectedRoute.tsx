import React, { useEffect, useState } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { AppLoader } from './AppLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { hasCompletedOnboarding, _hasHydrated } = useOnboardingStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (authLoading || !_hasHydrated || !navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!hasCompletedOnboarding) {
      if (!inOnboardingGroup) {
        router.replace('/onboarding');
      }
    } else if (user) {
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    } else {
      if (!inAuthGroup && !inOnboardingGroup) {
        router.replace('/(auth)');
      }
    }
    setIsReady(true);
  }, [user, authLoading, _hasHydrated, hasCompletedOnboarding, segments, navigationState?.key]);

  if (authLoading || !_hasHydrated || !isReady) {
    return <AppLoader />;
  }

  return <>{children}</>;
}
