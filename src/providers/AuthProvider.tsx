import React, { useEffect } from 'react';
import { AuthService } from '@/services/firebase/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useProfileStore } from '@/store/useProfileStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const loadProfileFromCloud = useProfileStore((state) => state.loadProfileFromCloud);

  useEffect(() => {
    // This observer will fire immediately with null or the user, and then whenever auth state changes.
    const unsubscribe = AuthService.observeAuthState((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser?.uid) {
        loadProfileFromCloud(firebaseUser.uid);
      }
    });

    // Cleanup observer on unmount
    return () => unsubscribe();
  }, [setUser, setLoading, loadProfileFromCloud]);

  return <>{children}</>;
}
