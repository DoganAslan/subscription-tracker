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
    // Safety fallback timer to prevent infinite loading or 12s timeout hangs on network drop
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const unsubscribe = AuthService.observeAuthState((firebaseUser) => {
      clearTimeout(safetyTimer);
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser?.uid) {
        loadProfileFromCloud(firebaseUser.uid);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [setUser, setLoading, loadProfileFromCloud]);

  return <>{children}</>;
}

