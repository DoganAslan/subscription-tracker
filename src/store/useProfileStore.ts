import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { auth } from '@/services/firebase/config';
import { UserService } from '@/services/firebase/firestore';
import { updateProfile } from 'firebase/auth';

const AVATAR_STORAGE_PREFIX = '@submate_profile_avatar_';
const NAME_STORAGE_PREFIX = '@submate_profile_name_';
const MAX_AVATAR_DATA_URL_LENGTH = 500_000;

interface ProfileState {
  profileImage: string | null;
  displayName: string | null;
  isProfileLoading: boolean;
  setProfileImage: (uri: string | null) => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  loadProfileFromCloud: (userId?: string) => Promise<void>;
  resetProfile: () => void;
}

const avatarStorageKey = (userId: string): string => `${AVATAR_STORAGE_PREFIX}${userId}`;
export const getProfileNameStorageKey = (userId: string): string => `${NAME_STORAGE_PREFIX}${userId}`;

export const resolveProfileDisplayName = ({ cloud, cached, auth: authName, fallback }: {
  cloud?: string | null;
  cached?: string | null;
  auth?: string | null;
  fallback: string;
}): string => [cloud, cached, authName, fallback].find(value => typeof value === 'string' && value.trim().length > 0)?.trim() || fallback;

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
  displayName: null,
  isProfileLoading: true,
  resetProfile: () => set({ profileImage: null, displayName: null, isProfileLoading: false }),

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

  setDisplayName: async (rawName: string) => {
    const currentUser = auth.currentUser;
    const uid = currentUser?.uid;
    const displayName = rawName.trim();
    if (!uid || !displayName) throw new Error('A signed-in user and a non-empty display name are required.');
    await Promise.all([
      AsyncStorage.setItem(getProfileNameStorageKey(uid), displayName),
      UserService.updateUserProfile(uid, { displayName }),
      updateProfile(currentUser, { displayName }),
    ]);
    set({ displayName });
  },

  loadProfileFromCloud: async (userId?: string) => {
    const uid = userId || auth.currentUser?.uid;
    set({ profileImage: null, displayName: null, isProfileLoading: true });
    if (!uid) {
      set({ isProfileLoading: false });
      return;
    }

    const storageKey = avatarStorageKey(uid);
    const [cachedAvatar, cachedName] = await Promise.all([
      AsyncStorage.getItem(storageKey).catch(() => null),
      AsyncStorage.getItem(getProfileNameStorageKey(uid)).catch(() => null),
    ]);
    if (cachedAvatar) set({ profileImage: cachedAvatar });

    const dbProfile = await UserService.getUserProfile(uid);
    const remoteName = typeof dbProfile?.displayName === 'string' ? dbProfile.displayName : null;
    const displayName = resolveProfileDisplayName({ cloud: remoteName, cached: cachedName, auth: auth.currentUser?.displayName, fallback: 'Account Owner' });
    set({ displayName });
    if (displayName !== cachedName) await AsyncStorage.setItem(getProfileNameStorageKey(uid), displayName).catch(() => {});
    const remoteAvatar = typeof dbProfile?.photoURL === 'string' ? dbProfile.photoURL : null;
    if (remoteAvatar && remoteAvatar.length <= MAX_AVATAR_DATA_URL_LENGTH) {
      set({ profileImage: remoteAvatar, isProfileLoading: false });
      if (remoteAvatar !== cachedAvatar) {
        await AsyncStorage.setItem(storageKey, remoteAvatar).catch(() => {});
      }
      return;
    }

    const authPhoto = auth.currentUser?.photoURL;
    if (authPhoto?.startsWith('https://')) {
      set({ profileImage: authPhoto, isProfileLoading: false });
      return;
    }

    set({ profileImage: cachedAvatar || null, isProfileLoading: false });
  },
}));
