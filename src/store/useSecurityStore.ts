import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorageAdapter } from '@/utils/secureStorage';

interface SecurityState {
  isBiometricsEnabled: boolean;
  setBiometricsEnabled: (enabled: boolean) => void;
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set) => ({
      isBiometricsEnabled: false,
      setBiometricsEnabled: (enabled) => set({ isBiometricsEnabled: enabled }),
    }),
    {
      name: 'security-storage',
      storage: createJSONStorage(() => secureStorageAdapter),
    }
  )
);
