import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { auth } from '@/services/firebase/config';
import { useAuthStore } from '@/store/useAuthStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { useAccountCapabilities } from '../hooks/useAccountCapabilities';
import { useAccountSecurityActions } from '../hooks/useAccountSecurityActions';
import { ChangeEmailModal } from '../components/ChangeEmailModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import type { AccountActionResult } from '../types';

type ModalName = 'email' | 'password' | 'delete' | null;
export default function AccountSettingsScreen() {
  const [modal, setModal] = useState<ModalName>(null);
  const router = useRouter();
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const user = useAuthStore(state => state.user);
  const profileName = useProfileStore(state => state.displayName);
  const capabilities = useAccountCapabilities();
  const actions = useAccountSecurityActions(isTurkish);
  const email = user?.email || auth.currentUser?.email || '';
  const displayName = profileName?.trim() || user?.displayName || auth.currentUser?.displayName || (isTurkish ? 'SubMate kullanıcısı' : 'SubMate user');
  const showResult = (result: AccountActionResult, onSuccess?: () => void) => { Alert.alert(result.ok ? (isTurkish ? 'Tamamlandı' : 'Completed') : (isTurkish ? 'İşlem tamamlanamadı' : 'Could not complete action'), result.message); if (result.ok) onSuccess?.(); return result; };

  return <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
    <View style={[styles.header, { borderBottomColor: colors.border }]}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to settings" onPress={() => router.replace('/(tabs)/settings')}><Ionicons name="chevron-back" size={25} color={colors.primary} /></TouchableOpacity><Text style={[styles.headerTitle, { color: colors.text }]}>{isTurkish ? 'Hesap Ayarları' : 'Account Settings'}</Text><View style={styles.headerSpacer} /></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#5D43E9', '#347BED']} style={styles.hero}><View style={styles.avatar}><Text style={styles.initial}>{displayName.trim().charAt(0).toUpperCase() || 'S'}</Text></View><View style={styles.heroCopy}><Text numberOfLines={1} style={styles.name}>{displayName}</Text><Text numberOfLines={1} style={styles.email}>{email || '—'}</Text><View style={styles.providerRow}>{capabilities.hasGoogleProvider ? <ProviderBadge label="Google" /> : null}{capabilities.hasPasswordProvider ? <ProviderBadge label={isTurkish ? 'E-posta' : 'Email'} /> : null}</View></View></LinearGradient>
      <SettingsSection colors={colors} title={isTurkish ? 'HESAP BİLGİLERİ' : 'ACCOUNT DETAILS'}><SettingsRow colors={colors} icon="mail-outline" iconColor="#3B82F6" label={isTurkish ? 'E-posta adresi' : 'Email address'} value={email || '—'} onPress={() => {}} /></SettingsSection>
      <SettingsSection colors={colors} title={isTurkish ? 'GÜVENLİK' : 'SECURITY'}>
        {capabilities.canChangeEmail ? <SettingsRow colors={colors} icon="at-outline" iconColor="#3B82F6" label={isTurkish ? 'E-postayı değiştir' : 'Change email'} onPress={() => setModal('email')} showDivider /> : null}
        {capabilities.canChangePassword ? <SettingsRow colors={colors} icon="lock-closed-outline" iconColor="#F59E0B" label={isTurkish ? 'Şifreyi değiştir' : 'Change password'} onPress={() => setModal('password')} showDivider={capabilities.canResetPassword} /> : null}
        {capabilities.canResetPassword ? <SettingsRow colors={colors} icon="key-outline" iconColor="#8B5CF6" label={isTurkish ? 'Şifremi unuttum' : 'Forgot password'} onPress={() => void actions.resetPassword(email).then(showResult)} /> : null}
        {!capabilities.hasPasswordProvider ? <View style={styles.providerNote}><Ionicons name="logo-google" size={18} color="#4285F4" /><Text style={[styles.providerNoteText, { color: colors.textSecondary }]}>{isTurkish ? 'Bu hesap Google ile yönetiliyor. Şifre ve e-posta değişikliklerini Google hesabından yapabilirsin.' : 'This account is managed by Google. Change its password or email from your Google account.'}</Text></View> : null}
      </SettingsSection>
      <SettingsSection colors={colors} title={isTurkish ? 'TEHLİKELİ İŞLEMLER' : 'DANGER ZONE'}><SettingsRow colors={colors} icon="trash-outline" iconColor="#EF4444" label={isTurkish ? 'Hesabı sil' : 'Delete account'} onPress={() => setModal('delete')} /></SettingsSection>
    </ScrollView>
    <ChangeEmailModal visible={modal === 'email'} colors={colors} isTurkish={isTurkish} pending={actions.pending} onClose={() => setModal(null)} onSubmit={(nextEmail, password) => actions.changeEmail(nextEmail, password).then(result => showResult(result, () => setModal(null)))} />
    <ChangePasswordModal visible={modal === 'password'} colors={colors} isTurkish={isTurkish} pending={actions.pending} onClose={() => setModal(null)} onSubmit={(current, next, confirmation) => actions.changePassword(current, next, confirmation).then(result => showResult(result, () => setModal(null)))} />
    <DeleteAccountModal visible={modal === 'delete'} colors={colors} isTurkish={isTurkish} pending={actions.pending} requiresPassword={capabilities.requiresPasswordForDelete} onClose={() => setModal(null)} onSubmit={password => actions.deleteAccount(password).then(result => showResult(result, () => setModal(null)))} />
  </SafeAreaView>;
}
function ProviderBadge({ label }: { label: string }) { return <View style={styles.providerBadge}><Text style={styles.providerBadgeText}>{label}</Text></View>; }
const styles = StyleSheet.create({ safeArea: { flex: 1 }, header: { minHeight: 58, borderBottomWidth: 1, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerTitle: { fontSize: 17, fontWeight: '900' }, headerSpacer: { width: 25 }, content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 18, paddingBottom: 140, gap: 18 }, hero: { minHeight: 148, borderRadius: 26, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, overflow: 'hidden' }, avatar: { width: 72, height: 72, borderRadius: 24, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }, initial: { color: '#FFF', fontSize: 30, fontWeight: '900' }, heroCopy: { flex: 1, minWidth: 0 }, name: { color: '#FFF', fontSize: 21, fontWeight: '900' }, email: { color: 'rgba(255,255,255,.75)', fontSize: 12, marginTop: 3 }, providerRow: { flexDirection: 'row', gap: 6, marginTop: 10 }, providerBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,.15)' }, providerBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' }, providerNote: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 15 }, providerNoteText: { flex: 1, fontSize: 12, lineHeight: 18 } });
