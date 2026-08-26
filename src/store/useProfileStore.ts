import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { auth } from '@/services/firebase/config';
import { UserService } from '@/services/firebase/firestore';

const AVATAR_STORAGE_PREFIX = '@submate_profile_avatar_';
const MAX_AVATAR_DATA_URL_LENGTH = 500_000;

interface ProfileState {
  profileImage: string | null;
  setProfileImage: (uri: string | null) => Promise<void>;
  loadProfileFromCloud: (userId?: string) => Promise<void>;
}

const avatarStorageKey = (userId: string): string => `${AVATAR_STORAGE_PREFIX}${userId}`;

export const compressAvatarImage = async (uri: string | null): Promise<string | null> => {
  if (!uri) return null;

  try {
    const context = ImageManipulator.manipulate(uri);
    context.resize({ width: 160, height: 160 });
    const renderedImage = await context.renderAsync();
    const result = await renderedImage.saveAsync({
      base64: true,
      compress: 0.55,
      format: SaveFormat.JPEG,
    });
    if (!result.base64) return null;

    const dataUrl = `data:image/jpeg;base64,${result.base64}`;
    return dataUrl.length <= MAX_AVATAR_DATA_URL_LENGTH ? dataUrl : null;
  } catch (error) {
    console.warn('[ProfileStore] Avatar compression failed.', error);
    return null;
  }
};

export const useProfileStore = create<ProfileState>((set) => ({
  profileImage: null,

  setProfileImage: async (rawUri: string | null) => {
    const currentUser = auth.currentUser;
    const uid = currentUser?.uid;
    if (!uid) {
      set({ profileImage: null });
      return;
    }

    const storageKey = avatarStorageKey(uid);
    if (!rawUri) {
      await UserService.updateUserProfile(uid, { photoURL: null });
      await AsyncStorage.removeItem(storageKey).catch(() => {});
      set({ profileImage: null });
      return;
    }

    const compressedDataUrl = await compressAvatarImage(rawUri);
    if (!compressedDataUrl) {
      throw new Error('The selected profile image could not be processed.');
    }

    await Promise.all([
      AsyncStorage.setItem(storageKey, compressedDataUrl),
      UserService.updateUserProfile(uid, { photoURL: compressedDataUrl }),
    ]);
    set({ profileImage: compressedDataUrl });
  },

  loadProfileFromCloud: async (userId?: string) => {
    const uid = userId || auth.currentUser?.uid;
    set({ profileImage: null });
    if (!uid) {
      return;
    }

    const storageKey = avatarStorageKey(uid);
    const cachedAvatar = await AsyncStorage.getItem(storageKey).catch(() => null);
    if (cachedAvatar) set({ profileImage: cachedAvatar });

    const dbProfile = await UserService.getUserProfile(uid);
    const remoteAvatar = typeof dbProfile?.photoURL === 'string' ? dbProfile.photoURL : null;
    if (remoteAvatar && remoteAvatar.length <= MAX_AVATAR_DATA_URL_LENGTH) {
      set({ profileImage: remoteAvatar });
      if (remoteAvatar !== cachedAvatar) {
        await AsyncStorage.setItem(storageKey, remoteAvatar).catch(() => {});
      }
      return;
    }

    const authPhoto = auth.currentUser?.photoURL;
    if (authPhoto?.startsWith('https://')) {
      set({ profileImage: authPhoto });
      return;
    }

    if (!cachedAvatar) set({ profileImage: null });
  },
}));
