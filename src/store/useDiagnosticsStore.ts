import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorageAdapter } from '@/utils/secureStorage';

interface DiagnosticsState {
  isDiagnosticsEnabled: boolean;
  hasHydrated: boolean;
  setDiagnosticsEnabled: (enabled: boolean) => void;
  setHasHydrated: (value: boolean) => void;
}

/**
 * A separate, opt-in preference for anonymous technical diagnostics.
 * It deliberately does not share state with biometric or account security settings.
 */
export const useDiagnosticsStore = create<DiagnosticsState>()(
  persist(
    set => ({
      isDiagnosticsEnabled: false,
      hasHydrated: false,
      setDiagnosticsEnabled: enabled => set({ isDiagnosticsEnabled: enabled }),
      setHasHydrated: value => set({ hasHydrated: value }),
    }),
    {
      name: 'diagnostics-preference',
      storage: createJSONStorage(() => secureStorageAdapter),
      partialize: state => ({ isDiagnosticsEnabled: state.isDiagnosticsEnabled }),
      onRehydrateStorage: () => () => {
        useDiagnosticsStore.getState().setHasHydrated(true);
      },
    },
  ),
);
