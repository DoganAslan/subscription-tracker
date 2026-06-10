import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { AppLoader } from './AppLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore();
  const { hasCompletedOnboarding, _hasHydrated } = useOnboardingStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !_hasHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (user) {
      if (!hasCompletedOnboarding && !inOnboardingGroup) {
        router.replace('/(onboarding)');
      } else if (hasCompletedOnboarding && (inAuthGroup || inOnboardingGroup)) {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, _hasHydrated, hasCompletedOnboarding, segments, router]);

  if (isLoading || !_hasHydrated) {
    return <AppLoader />;
  }

  return <>{children}</>;
}
