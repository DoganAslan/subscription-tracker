import { getProfileNameStorageKey, resolveProfileDisplayName } from '@/store/useProfileStore';

jest.mock('@/services/firebase/config', () => ({ auth: { currentUser: null } }));
jest.mock('@/services/firebase/firestore', () => ({ UserService: { getUserProfile: jest.fn(), updateUserProfile: jest.fn() } }));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: { manipulate: jest.fn() }, SaveFormat: { JPEG: 'jpeg' } }));
jest.mock('firebase/auth', () => ({ updateProfile: jest.fn() }));

describe('settings profile ownership', () => {
  it('scopes cached display names to the authenticated user', () => {
    expect(getProfileNameStorageKey('user-a')).not.toBe(getProfileNameStorageKey('user-b'));
    expect(getProfileNameStorageKey('user-a')).toContain('user-a');
  });

  it('prefers cloud, cache, auth, then localized fallback display names', () => {
    expect(resolveProfileDisplayName({ cloud: 'Cloud Name', cached: 'Cached Name', auth: 'Auth Name', fallback: 'Owner' })).toBe('Cloud Name');
    expect(resolveProfileDisplayName({ cloud: ' ', cached: 'Cached Name', auth: 'Auth Name', fallback: 'Owner' })).toBe('Cached Name');
    expect(resolveProfileDisplayName({ cloud: null, cached: '', auth: 'Auth Name', fallback: 'Owner' })).toBe('Auth Name');
    expect(resolveProfileDisplayName({ cloud: undefined, cached: null, auth: ' ', fallback: 'Owner' })).toBe('Owner');
  });
});
