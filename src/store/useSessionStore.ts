import { create } from 'zustand';

interface SessionState {
  isSessionUnlocked: boolean;
  setSessionUnlocked: (unlocked: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isSessionUnlocked: false,
  setSessionUnlocked: (unlocked) => set({ isSessionUnlocked: unlocked }),
}));
