import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const saveSecureData = async (key: string, value: string): Promise<boolean> => {
  if (!key || value === undefined) return false;

  // WEB FALLBACK: Browsers lack Hardware Secure Enclaves. Route to standard localStorage safely.
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
      console.log(`️ Web Storage Bridge: Saved [${key}] safely.`);
      return true;
    } catch (e) {
      console.error("Web Storage Exception:", e);
      return false;
    }
  }

  // NATIVE MOBILE: Encrypt directly into iOS Keychain / Android Keystore
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY // Highest iOS security tier
    });
    return true;
  } catch (error) {
    console.error(`SecureStore Hardware Encryption Failed for [${key}]:`, error);
    return false;
  }
};

export const getSecureData = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) { return null; }
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`SecureStore Retrieval Failed for [${key}]:`, error);
    return null;
  }
};

export const deleteSecureData = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(key); } catch (e) {}
    return;
  }

  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`SecureStore Deletion Failed for [${key}]:`, error);
  }
};

export const secureStorageAdapter = {
  getItem: getSecureData,
  setItem: saveSecureData,
  removeItem: deleteSecureData,
};
