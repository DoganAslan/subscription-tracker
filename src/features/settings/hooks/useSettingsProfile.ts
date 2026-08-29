import { useAuthStore } from '@/store/useAuthStore';
import { useProfileStore } from '@/store/useProfileStore';

export function useSettingsProfile(isTurkish: boolean) {
  const user = useAuthStore(state => state.user);
  const profile = useProfileStore();
  const displayName = profile.displayName || user?.displayName || (isTurkish ? 'Hesap sahibi' : 'Account Owner');
  return { ...profile, user, displayName, email: user?.email || '' , photo: profile.profileImage || user?.photoURL || null };
}
