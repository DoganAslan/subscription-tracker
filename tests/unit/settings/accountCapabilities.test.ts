import { getAccountCapabilities } from '@/features/settings/account/hooks/useAccountCapabilities';

jest.mock('@/services/firebase/config', () => ({ auth: { currentUser: null } }));

describe('account provider capabilities', () => {
  it('enables password actions for password-only accounts', () => {
    expect(getAccountCapabilities(['password'], true)).toEqual({ hasPasswordProvider: true, hasGoogleProvider: false, canChangeEmail: true, canChangePassword: true, canResetPassword: true, requiresPasswordForDelete: true });
  });
  it('hides password forms for Google-only accounts', () => {
    expect(getAccountCapabilities(['google.com'], true)).toEqual({ hasPasswordProvider: false, hasGoogleProvider: true, canChangeEmail: false, canChangePassword: false, canResetPassword: false, requiresPasswordForDelete: false });
  });
  it('supports both credential paths for linked accounts', () => {
    expect(getAccountCapabilities(['google.com', 'password'], true)).toMatchObject({ hasPasswordProvider: true, hasGoogleProvider: true, canChangeEmail: true, canChangePassword: true, canResetPassword: true, requiresPasswordForDelete: true });
  });
});
