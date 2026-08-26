import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SENSITIVE_WEB_KEY_PATTERN = /(?:api[-_]?key|secret|password|credential|auth[-_]?token|access[-_]?token|refresh[-_]?token|session)/i;

const canUseWebStorageForKey = (key: string): boolean => !SENSITIVE_WEB_KEY_PATTERN.test(key);

export const saveSecureData = async (key: string, value: string): Promise<boolean> => {
  if (!key || value === undefined) return false;

  // Browsers do not provide an equivalent to iOS Keychain / Android Keystore.
  // localStorage is therefore limited to non-sensitive preferences only.
  if (Platform.OS === 'web') {
    if (!canUseWebStorageForKey(key) || typeof localStorage === 'undefined') {
      console.warn('Sensitive data was not persisted in browser storage.');
      return false;
    }
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Browser storage write failed.', error);
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
    console.error('SecureStore write failed.', error);
    return false;
  }
};

export const getSecureData = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    if (!canUseWebStorageForKey(key) || typeof localStorage === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch { return null; }
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('SecureStore read failed.', error);
    return null;
  }
};

export const deleteSecureData = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(key); } catch {}
    return;
  }

  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('SecureStore deletion failed.', error);
  }
};

export const secureStorageAdapter = {
  getItem: getSecureData,
  setItem: async (key: string, value: string): Promise<void> => {
    await saveSecureData(key, value);
  },
  removeItem: deleteSecureData,
};

