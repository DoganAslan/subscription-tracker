import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/services/firebase/config';
import { updateProfile } from 'firebase/auth';
import { UserService } from '@/services/firebase/firestore';
import { Platform } from 'react-native';

const AVATAR_STORAGE_KEY = '@submate_profile_avatar';

interface ProfileState {
  profileImage: string | null;
  setProfileImage: (uri: string | null) => Promise<void>;
  loadProfileFromCloud: (userId?: string) => Promise<void>;
}

// Compress and convert any image URI into a compact, persistent Data URL (~10-15KB)
export const compressAvatarImage = async (uri: string | null): Promise<string | null> => {
  if (!uri) return null;

  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      return new Promise((resolve) => {
        const img = new (window as any).Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 160;
          let w = img.width;
          let h = img.height;
          if (w > h) {
            if (w > maxDim) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            }
          } else {
            if (h > maxDim) {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.4);
            resolve(dataUrl);
          } else {
            resolve(uri);
          }
        };
        img.onerror = () => resolve(uri);
        img.src = uri;
      });
    }

    if (uri.startsWith('data:image/')) return uri;

    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = () => resolve(uri);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('[ProfileStore] Compression fallback:', e);
    return uri;
  }
};

const safeStorage = {
  getItem: async (name: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      await AsyncStorage.setItem(name, value);
    } catch (e) {
      console.warn('[ProfileStore] safeStorage setItem error:', e);
    }
  },
  removeItem: async (name: string) => {
    if (typeof window === 'undefined') return;
    try {
      await AsyncStorage.removeItem(name);
    } catch {}
  },
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profileImage: null,

      setProfileImage: async (rawUri: string | null) => {
        if (typeof window === 'undefined') return;
        const currentUser = auth.currentUser;
        const uid = currentUser?.uid;

        if (!rawUri) {
          set({ profileImage: null });
          await AsyncStorage.removeItem(AVATAR_STORAGE_KEY).catch(() => {});
          if (uid) {
            UserService.updateUserProfile(uid, { photoURL: null }).catch(() => {});
            updateProfile(currentUser, { photoURL: null }).catch(() => {});
          }
          return;
        }

        const compressedDataUrl = await compressAvatarImage(rawUri);
        set({ profileImage: compressedDataUrl });

        if (compressedDataUrl) {
          // 1. Save to local storage
          await AsyncStorage.setItem(AVATAR_STORAGE_KEY, compressedDataUrl).catch(() => {});
          if (uid) {
            await AsyncStorage.setItem(`${AVATAR_STORAGE_KEY}_${uid}`, compressedDataUrl).catch(() => {});
            // 2. Save directly to Firestore database for user's account
            await UserService.updateUserProfile(uid, { photoURL: compressedDataUrl });
            // 3. Save to Firebase Auth
            await updateProfile(currentUser, { photoURL: compressedDataUrl }).catch(() => {});
          }
        }
      },

      loadProfileFromCloud: async (userId?: string) => {
        if (typeof window === 'undefined') return;
        const uid = userId || auth.currentUser?.uid;
        if (!uid) {
          const cached = await AsyncStorage.getItem(AVATAR_STORAGE_KEY);
          if (cached) set({ profileImage: cached });
          return;
        }

        // 1. Try fetching from Firestore database first
        const dbProfile = await UserService.getUserProfile(uid);
        if (dbProfile?.photoURL) {
          set({ profileImage: dbProfile.photoURL });
          await AsyncStorage.setItem(AVATAR_STORAGE_KEY, dbProfile.photoURL).catch(() => {});
          return;
        }

        // 2. Try Firebase Auth currentUser photoURL
        if (auth.currentUser?.photoURL) {
          set({ profileImage: auth.currentUser.photoURL });
          await AsyncStorage.setItem(AVATAR_STORAGE_KEY, auth.currentUser.photoURL).catch(() => {});
          return;
        }

        // 3. Fallback to AsyncStorage
        const userCache = await AsyncStorage.getItem(`${AVATAR_STORAGE_KEY}_${uid}`);
        if (userCache) {
          set({ profileImage: userCache });
        }
      },
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => safeStorage),
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== 'undefined') {
          state.loadProfileFromCloud();
        }
      },
    }
  )
);

