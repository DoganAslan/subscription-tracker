/**
 * WARNING: Android Keystore Size Limit (2048 bytes / 2KB)
 * 
 * Do NOT use this secureStorage adapter to persist entire Zustand state objects 
 * or large JSON payloads. Storing data exceeding the 2KB limit will cause 
 * the application to hard crash natively on boot.
 * 
 * Intended Use Case:
 * Use strictly for tiny, highly sensitive string values such as:
 * - auth_token
 * - pin_code
 * - encryption_keys
 */
import * as SecureStore from 'expo-secure-store';
import { StateStorage } from 'zustand/middleware';

export const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};
