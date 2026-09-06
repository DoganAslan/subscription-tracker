import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/firebase/auth';
import type { Subscription } from '@/services/firebase/types';
import { useAuthStore } from '@/store/useAuthStore';
import { authenticateUser, getBiometricAvailability } from '@/utils/biometrics';
import { exportCsvReport } from '@/utils/reportExporter';
import { triggerHaptic } from '@/utils/haptics';
import { exportVaultBackup, importVaultBackup } from '@/utils/vault';

export function useSettingsActions({ isTurkish, subscriptions, baseCurrency, biometricsEnabled, setBiometricsEnabled, setProfileImage }: { isTurkish: boolean; subscriptions: Subscription[]; baseCurrency: string; biometricsEnabled: boolean; setBiometricsEnabled: (value: boolean) => void; setProfileImage: (uri: string | null) => Promise<void> }) {
  const router = useRouter();
  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') { Alert.alert(isTurkish ? 'İzin gerekli' : 'Permission required', isTurkish ? 'Profil fotoğrafı için medya erişimi gerekiyor.' : 'Media access is required to choose a profile photo.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.2 });
    if (!result.canceled && result.assets?.[0]?.uri) await setProfileImage(result.assets[0].uri);
  };
  const toggleBiometrics = async () => {
    const availability = await getBiometricAvailability();
    const authenticated = availability.available ? await authenticateUser() : true;
    if (authenticated) { triggerHaptic('medium'); setBiometricsEnabled(!biometricsEnabled); }
  };
  const backup = () => { triggerHaptic('impactLight'); void exportVaultBackup(); };
  const restore = () => { triggerHaptic('impactLight'); void importVaultBackup(() => router.replace('/(tabs)')); };
  const exportCsv = () => { triggerHaptic('impactLight'); void exportCsvReport(subscriptions.map(subscription => ({ name: subscription.name, category: subscription.category, amount: subscription.amount, currency: subscription.currency, billingCycle: subscription.billingCycle, status: subscription.status ?? 'active', notes: subscription.notes })), baseCurrency); };
  const logOut = async () => { try { triggerHaptic('warning'); await AuthService.logOut(); useAuthStore.getState().setUser(null); router.replace('/(auth)'); } catch (error) { console.error('Sign out error:', error); Alert.alert(isTurkish ? 'Hata' : 'Error', isTurkish ? 'Güvenli çıkış tamamlanamadı.' : 'Failed to sign out safely.'); } };
  return { pickAvatar, toggleBiometrics, backup, restore, exportCsv, logOut };
}
