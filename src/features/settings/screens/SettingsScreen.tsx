import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ThemeMode } from '@/theme/colors';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { useSettingsProfile } from '@/features/settings/hooks/useSettingsProfile';
import { useSettingsActions } from '@/features/settings/hooks/useSettingsActions';
import { SettingsProfileCard } from '@/features/settings/components/SettingsProfileCard';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { DataVaultCard } from '@/features/settings/components/DataVaultCard';
import { SettingsPickerModal, type PickerOption } from '@/features/settings/components/SettingsPickerModal';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useSecurityStore } from '@/store/useSecurityStore';
import { triggerHaptic } from '@/utils/haptics';
import { ResponsiveContent } from '@/components/layout/ResponsiveContent';

export const GLOBAL_CURRENCY_LIST = [
  ['USD', 'US Dollar', '$'], ['EUR', 'Euro', '€'], ['GBP', 'British Pound', '£'], ['TRY', 'Turkish Lira', '₺'], ['CAD', 'Canadian Dollar', '$'], ['AUD', 'Australian Dollar', '$'], ['CHF', 'Swiss Franc', 'Fr'], ['CNY', 'Chinese Yuan', '¥'], ['SEK', 'Swedish Krona', 'kr'], ['KRW', 'South Korean Won', '₩'], ['SAR', 'Saudi Riyal', 'ر.س'], ['AED', 'UAE Dirham', 'د.إ'], ['INR', 'Indian Rupee', '₹'], ['RUB', 'Russian Ruble', '₽'], ['BRL', 'Brazilian Real', 'R$'],
].map(([value, label, symbol]) => ({ value, label, detail: value, symbol })) satisfies PickerOption[];

type Picker = 'language' | 'currency' | 'theme' | null;

export default function SettingsScreen() {
  const [picker, setPicker] = useState<Picker>(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const { colors, themeMode, setThemeMode } = useTheme();
  const { currentLanguage, changeLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const { baseCurrency, setBaseCurrency } = useCurrencyStore();
  const { isBiometricsEnabled, setBiometricsEnabled } = useSecurityStore();
  const { data: subscriptions = [] } = useSubscriptions();
  const profile = useSettingsProfile(isTurkish);
  const actions = useSettingsActions({ isTurkish, subscriptions, baseCurrency, biometricsEnabled: isBiometricsEnabled, setBiometricsEnabled, setProfileImage: profile.setProfileImage });
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(32, insets.bottom + 20);

  const openPicker = (value: Picker) => { triggerHaptic('selection'); setPicker(value); };
  const saveName = async () => { try { await profile.setDisplayName(draftName); setEditingName(false); } catch { Alert.alert(isTurkish ? 'Hata' : 'Error', isTurkish ? 'Ad kaydedilemedi.' : 'Could not save the name.'); } };
  const startEdit = () => { setDraftName(profile.displayName); setEditingName(true); };
  const go = (path: '/(tabs)/settings/account' | '/(tabs)/settings/about' | '/(tabs)/settings/privacy' | '/(tabs)/settings/terms') => { triggerHaptic('selection'); router.push(path); };
  const themeLabel = isTurkish ? ({ light: 'Açık', dark: 'Koyu', system: 'Sistem' }[themeMode]) : themeMode.charAt(0).toUpperCase() + themeMode.slice(1);
  const languageOptions: PickerOption[] = [{ value: 'tr', label: 'Türkçe' }, { value: 'en', label: 'English' }];
  const themeOptions: PickerOption[] = [
    { value: 'light', label: isTurkish ? 'Açık tema' : 'Light theme' },
    { value: 'dark', label: isTurkish ? 'Koyu tema' : 'Dark theme' },
    { value: 'system', label: isTurkish ? 'Sistem ayarı' : 'System setting' },
  ];

  return <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : 8 }]} edges={['top', 'left', 'right']}>
    <ScrollView showsVerticalScrollIndicator={false}>
      <ResponsiveContent testID="settings-responsive-content" style={styles.content}>
        <View style={styles.header}><View style={styles.headerCopy}><Text style={[styles.title, { color: colors.text }]}>{isTurkish ? 'Ayarlar' : 'Settings'}</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>{isTurkish ? 'Hesabını ve uygulama tercihlerini yönet.' : 'Manage your account and app preferences.'}</Text></View><View style={[styles.status, { backgroundColor: isBiometricsEnabled ? 'rgba(16,185,129,.13)' : 'rgba(59,130,246,.13)' }]}><Ionicons name={isBiometricsEnabled ? 'shield-checkmark' : 'settings-outline'} size={14} color={isBiometricsEnabled ? '#10B981' : colors.primary} /><Text style={{ color: isBiometricsEnabled ? '#10B981' : colors.primary, fontSize: 11, fontWeight: '900' }}>{isBiometricsEnabled ? (isTurkish ? 'Koruma açık' : 'Protected') : (isTurkish ? 'Hazır' : 'Ready')}</Text></View></View>
        <SettingsProfileCard name={profile.displayName} email={profile.email || (isTurkish ? 'E-posta yok' : 'No email')} image={profile.photo} baseCurrency={baseCurrency} isLoading={profile.isProfileLoading} editing={editingName} draftName={draftName} isTurkish={isTurkish} onAvatar={() => void actions.pickAvatar()} onStartEdit={startEdit} onChangeDraft={setDraftName} onSave={() => void saveName()} />
        <SettingsSection colors={colors} title={isTurkish ? 'TERCİHLER' : 'PREFERENCES'}>
          <SettingsRow colors={colors} icon="language-outline" iconColor="#3B82F6" label={isTurkish ? 'Dil' : 'Language'} value={currentLanguage === 'tr' ? 'Türkçe' : 'English'} onPress={() => openPicker('language')} showDivider />
          <SettingsRow colors={colors} icon="wallet-outline" iconColor="#10B981" label={isTurkish ? 'Ana para birimi' : 'Base currency'} value={baseCurrency} onPress={() => openPicker('currency')} showDivider />
          <SettingsRow colors={colors} icon="color-palette-outline" iconColor="#8B5CF6" label={isTurkish ? 'Görünüm teması' : 'Appearance theme'} value={themeLabel} onPress={() => openPicker('theme')} />
        </SettingsSection>
        <SettingsSection colors={colors} title={isTurkish ? 'GÜVENLİK' : 'SECURITY'}><SettingsRow colors={colors} icon="finger-print-outline" iconColor="#F59E0B" label={isTurkish ? 'Biyometrik kilit' : 'Biometric lock'} value={isBiometricsEnabled ? (isTurkish ? 'Açık' : 'Enabled') : (isTurkish ? 'Kapalı' : 'Disabled')} onPress={() => void actions.toggleBiometrics()} /></SettingsSection>
        <DataVaultCard colors={colors} isTurkish={isTurkish} onBackup={actions.backup} onRestore={actions.restore} onExportCsv={actions.exportCsv} />
        <SettingsSection colors={colors} title={isTurkish ? 'HESAP VE BİLGİ' : 'ACCOUNT & INFO'}>
          <SettingsRow colors={colors} icon="person-outline" iconColor="#6366F1" label={isTurkish ? 'Hesap ve şifre' : 'Account & password'} onPress={() => go('/(tabs)/settings/account')} showDivider />
          <SettingsRow colors={colors} icon="information-circle-outline" iconColor="#EC4899" label={isTurkish ? 'SubMate hakkında' : 'About SubMate'} onPress={() => go('/(tabs)/settings/about')} showDivider />
          <SettingsRow colors={colors} icon="shield-checkmark-outline" iconColor="#10B981" label={isTurkish ? 'Gizlilik politikası' : 'Privacy policy'} onPress={() => go('/(tabs)/settings/privacy')} showDivider />
          <SettingsRow colors={colors} icon="document-text-outline" iconColor="#6366F1" label={isTurkish ? 'Kullanım koşulları' : 'Terms of use'} onPress={() => go('/(tabs)/settings/terms')} />
        </SettingsSection>
        <TouchableOpacity style={styles.logout} onPress={() => void actions.logOut()}><Ionicons name="log-out-outline" size={20} color="#EF4444" /><Text style={styles.logoutText}>{isTurkish ? 'Hesaptan çık' : 'Log out'}</Text></TouchableOpacity>
      </ResponsiveContent>
    </ScrollView>
    <SettingsPickerModal visible={picker === 'language'} title={isTurkish ? 'Dil seçimi' : 'Select language'} options={languageOptions} selected={currentLanguage} colors={colors} bottomPadding={bottomPadding} accent="#3B82F6" onClose={() => setPicker(null)} onSelect={value => { triggerHaptic('selection'); changeLanguage(value as 'tr' | 'en'); setPicker(null); }} />
    <SettingsPickerModal visible={picker === 'currency'} title={isTurkish ? 'Ana para birimini seç' : 'Select base currency'} options={GLOBAL_CURRENCY_LIST} selected={baseCurrency} colors={colors} bottomPadding={bottomPadding} accent="#10B981" onClose={() => setPicker(null)} onSelect={value => { triggerHaptic('selection'); setBaseCurrency(value); setPicker(null); }} />
    <SettingsPickerModal visible={picker === 'theme'} title={isTurkish ? 'Tema seç' : 'Select theme'} options={themeOptions} selected={themeMode} colors={colors} bottomPadding={bottomPadding} accent="#8B5CF6" onClose={() => setPicker(null)} onSelect={value => { triggerHaptic('selection'); setThemeMode(value as ThemeMode); setPicker(null); }} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1 }, content: { paddingBottom: 140, gap: 18 }, header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, headerCopy: { flex: 1 }, title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.6 }, subtitle: { fontSize: 12, lineHeight: 18, marginTop: 3 }, status: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 }, logout: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,.25)', backgroundColor: 'rgba(239,68,68,.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, logoutText: { color: '#EF4444', fontSize: 14, fontWeight: '900' } });
