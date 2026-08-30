import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import SettingsRoute from '@/app/(tabs)/settings';
import SettingsScreen from '@/features/settings/screens/SettingsScreen';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSetBiometrics = jest.fn();
const mockSignOut = jest.fn(() => Promise.resolve());

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }: { children: React.ReactNode }) => { const ReactModule = require('react') as typeof import('react'); const { View } = require('react-native') as typeof import('react-native'); return ReactModule.createElement(View, null, children); }, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }: { children: React.ReactNode }) => { const ReactModule = require('react') as typeof import('react'); const { View } = require('react-native') as typeof import('react-native'); return ReactModule.createElement(View, null, children); } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
jest.mock('@/services/firebase/config', () => ({ auth: { currentUser: { uid: 'user', email: 'user@test.com', displayName: 'User', photoURL: null } } }));
jest.mock('firebase/auth', () => ({ signOut: mockSignOut, updateProfile: jest.fn() }));
jest.mock('@/features/subscriptions/hooks/useSubscriptions', () => ({ useSubscriptions: () => ({ data: [] }) }));
jest.mock('@/context/ThemeContext', () => ({ useTheme: () => ({ themeMode: 'dark', setThemeMode: jest.fn(), isDark: true, colors: { background: '#000', surface: '#111', surfaceSubtle: '#171717', border: '#333', primary: '#3B82F6', text: '#FFF', textSecondary: '#AAA' } }) }));
jest.mock('@/context/LanguageContext', () => ({ useTranslation: () => ({ currentLanguage: 'en', changeLanguage: jest.fn(), t: { global: {}, walletPage: {}, common: {} } }) }));
jest.mock('@/store/useAuthStore', () => { const hook = () => ({ user: { uid: 'user', email: 'user@test.com', displayName: 'User', photoURL: null } }); hook.getState = () => ({ setUser: jest.fn() }); return { useAuthStore: hook }; });
jest.mock('@/store/useProfileStore', () => ({ useProfileStore: () => ({ profileImage: null, displayName: 'User', isProfileLoading: false, setProfileImage: jest.fn(), setDisplayName: jest.fn() }) }));
jest.mock('@/store/useCurrencyStore', () => ({ useCurrencyStore: () => ({ baseCurrency: 'TRY', setBaseCurrency: jest.fn() }) }));
jest.mock('@/store/useSecurityStore', () => ({ useSecurityStore: () => ({ isBiometricsEnabled: false, setBiometricsEnabled: mockSetBiometrics }) }));
jest.mock('@/utils/biometrics', () => ({ getBiometricAvailability: () => Promise.resolve({ available: false }), authenticateUser: jest.fn() }));
jest.mock('@/utils/vault', () => ({ exportVaultBackup: jest.fn(), importVaultBackup: jest.fn() }));
jest.mock('@/utils/reportExporter', () => ({ exportCsvReport: jest.fn() }));
jest.mock('@/utils/haptics', () => ({ triggerHaptic: jest.fn() }));

describe('Settings screen boundary', () => {
  beforeEach(() => { mockPush.mockReset(); mockReplace.mockReset(); mockSetBiometrics.mockReset(); mockSignOut.mockClear(); });
  it('keeps the Expo route as the feature-screen facade', () => expect(SettingsRoute).toBe(SettingsScreen));
  it('renders the main content inside the shared responsive shell', async () => { const result = await render(<SettingsScreen />); expect(result.getByTestId('settings-responsive-content')).toBeTruthy(); });
  it.each([
    ['Account & password', '/(tabs)/settings/account'],
    ['About SubMate', '/(tabs)/settings/about'],
    ['Privacy policy', '/(tabs)/settings/privacy'],
    ['Terms of use', '/(tabs)/settings/terms'],
  ])('routes %s to its dedicated screen', async (label, path) => { const result = await render(<SettingsScreen />); fireEvent.press(result.getByText(label)); expect(mockPush).toHaveBeenCalledWith(path); });
  it('enables the biometric preference without prompting on unsupported devices', async () => { const result = await render(<SettingsScreen />); fireEvent.press(result.getByText('Biometric lock')); await Promise.resolve(); expect(mockSetBiometrics).toHaveBeenCalledWith(true); });
});
