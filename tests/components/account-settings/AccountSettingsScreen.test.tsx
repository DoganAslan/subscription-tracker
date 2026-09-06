import React from 'react';
import { Dimensions, Platform, StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import AccountRoute from '@/app/(tabs)/settings/account';
import { ChangeEmailModal } from '@/features/settings/account/components/ChangeEmailModal';
import { ChangePasswordModal } from '@/features/settings/account/components/ChangePasswordModal';
import AccountSettingsScreen from '@/features/settings/account/screens/AccountSettingsScreen';

jest.mock('react-native/Libraries/Components/Keyboard/KeyboardAvoidingView', () => ({
  __esModule: true,
  default: ({ children, testID, ...props }: import('react-native').KeyboardAvoidingViewProps) => {
    const ReactModule = require('react') as typeof import('react');
    const NativeView = require('react-native/Libraries/Components/View/View').default;
    return ReactModule.createElement(
      NativeView,
      { ...props, testID: testID ?? 'keyboard-avoiding-view' },
      children,
    );
  },
}));

jest.setTimeout(15000);
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => {
    const ReactModule = require('react') as typeof import('react');
    const { View } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(View, null, children);
  },
  useSafeAreaInsets: () => ({ top: 59, right: 0, bottom: 34, left: 0 }),
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: ({ children }: { children: React.ReactNode }) => { const ReactModule = require('react') as typeof import('react'); const { View } = require('react-native') as typeof import('react-native'); return ReactModule.createElement(View, null, children); } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/services/firebase/config', () => ({ auth: { currentUser: { email: 'google@test.com', displayName: 'Google User', providerData: [{ providerId: 'google.com' }] } } }));
jest.mock('@/services/firebase/auth', () => ({ AuthService: { reauthenticate: jest.fn(), updateEmailAddress: jest.fn(), updateUserPassword: jest.fn(), sendPasswordResetEmail: jest.fn(), deleteAccount: jest.fn() } }));
jest.mock('@/store/useAuthStore', () => ({ useAuthStore: (selector: (state: { user: { email: string; displayName: string } }) => unknown) => selector({ user: { email: 'google@test.com', displayName: 'Google User' } }) }));
jest.mock('@/context/ThemeContext', () => ({ useTheme: () => ({ colors: { background: '#000', surface: '#111', border: '#333', primary: '#3B82F6', text: '#FFF', textSecondary: '#AAA' } }) }));
jest.mock('@/context/LanguageContext', () => ({ useTranslation: () => ({ currentLanguage: 'en' }) }));
jest.mock('@/store/useProfileStore', () => ({
  useProfileStore: (selector: (state: { displayName: string }) => unknown) => selector({ displayName: 'Cloud Profile' }),
}));

const colors = {
  background: '#000',
  surface: '#111',
  border: '#333',
  primary: '#3B82F6',
  text: '#FFF',
  textSecondary: '#AAA',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  surfaceSubtle: '#181818',
  primaryDark: '#2563EB',
  heroGradient: ['#3B82F6', '#2563EB', '#1D4ED8'] as const,
  cardBg: '#111',
};

describe('Account settings screen', () => {
  const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');

  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  });

  afterAll(() => {
    if (platformDescriptor) Object.defineProperty(Platform, 'OS', platformDescriptor);
  });

  it('keeps the route facade', () => expect(AccountRoute).toBe(AccountSettingsScreen));

  it('uses the same cloud profile name as settings and the dashboard', async () => {
    const result = await render(<AccountSettingsScreen />);
    expect(result.getByText('Cloud Profile')).toBeTruthy();
  });

  it('shows provider-aware Google guidance instead of password forms', async () => {
    const result = await render(<AccountSettingsScreen />);
    expect(result.getByText(/managed by Google/i)).toBeTruthy();
    expect(result.queryByText('Change password')).toBeNull();
    expect(result.queryByText('Forgot password')).toBeNull();
  });

  it('keeps account actions reachable above the iOS keyboard and safe bottom inset', async () => {
    const emailModal = await render(
      <ChangeEmailModal
        visible
        colors={colors}
        isTurkish={false}
        pending={false}
        onClose={jest.fn()}
        onSubmit={jest.fn(async () => ({ ok: false, message: 'Keep open' }))}
      />,
    );

    expect(emailModal.getByTestId('keyboard-avoiding-view').props).toEqual(expect.objectContaining({
      behavior: 'padding',
      keyboardVerticalOffset: 111,
    }));
    expect(StyleSheet.flatten(emailModal.getByTestId('account-form-card').props.style)).toEqual(
      expect.objectContaining({
        maxHeight: Math.max(Dimensions.get('window').height - 59 - 34, 0),
      }),
    );
    expect(emailModal.getByTestId('account-form-scroll').props.keyboardShouldPersistTaps).toBe('handled');
    expect(StyleSheet.flatten(emailModal.getByTestId('account-form-scroll').props.contentContainerStyle)).toEqual(
      expect.objectContaining({ paddingBottom: 54 }),
    );
    expect(emailModal.getByText('Send link').parent?.props.accessibilityState).toEqual({ disabled: false });

    await fireEvent(emailModal.getByTestId('account-form-header'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 350, height: 66 } },
    });

    expect(emailModal.getByTestId('keyboard-avoiding-view').props.keyboardVerticalOffset).toBe(125);

    await emailModal.unmount();

    const passwordModal = await render(
      <ChangePasswordModal
        visible
        colors={colors}
        isTurkish={false}
        pending={false}
        onClose={jest.fn()}
        onSubmit={jest.fn(async () => ({ ok: false, message: 'Keep open' }))}
      />,
    );

    expect(passwordModal.getByText('Update').parent?.props.accessibilityState).toEqual({ disabled: false });
  });
});
