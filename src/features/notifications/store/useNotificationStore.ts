import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPreferences {
  enabled: boolean;
  notify7Days: boolean;
  notify3Days: boolean;
  notify1Day: boolean;
  notifyOnDay: boolean;
}

interface NotificationState {
  preferences: NotificationPreferences;
  setPreferences: (preferences: Partial<NotificationPreferences>) => void;
  toggleEnabled: (enabled: boolean) => void;
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  notify7Days: true,
  notify3Days: true,
  notify1Day: true,
  notifyOnDay: true,
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,
      setPreferences: (newPrefs) => set((state) => ({
        preferences: { ...state.preferences, ...newPrefs }
      })),
      toggleEnabled: (enabled) => set((state) => ({
        preferences: { ...state.preferences, enabled }
      })),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
