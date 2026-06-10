import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthState {
  user: FirebaseUser | null;
  isLoading: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // App starts in a loading state until Firebase determines auth status
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));
