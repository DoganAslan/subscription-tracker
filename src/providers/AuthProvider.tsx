import React, { useEffect } from 'react';
import { AuthService } from '@/services/firebase/auth';
import { useAuthStore } from '@/store/useAuthStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    // This observer will fire immediately with null or the user, and then whenever auth state changes.
    const unsubscribe = AuthService.observeAuthState((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup observer on unmount
    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
