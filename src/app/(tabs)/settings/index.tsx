import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { ThemeMode } from '@/theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/services/firebase/config';
import { updateProfile, signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useSecurityStore } from '@/store/useSecurityStore';
import { triggerHaptic } from '@/utils/haptics';
import { authenticateUser, getBiometricAvailability } from '@/utils/biometrics';
import { exportVaultBackup, importVaultBackup } from '@/utils/vault';
import { useTranslation } from '@/context/LanguageContext';
import { exportCsvReport } from '@/utils/reportExporter';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';

const PROFILE_NAME_KEY = '@profile_name';

export const GLOBAL_CURRENCY_LIST = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
];

export default function SettingsScreen() {
  const [userName, setUserName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');
  const [isLoadingName, setIsLoadingName] = useState<boolean>(true);

  const [isCurrencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [isThemeModalVisible, setThemeModalVisible] = useState(false);
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [isPrivacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [isTermsModalVisible, setTermsModalVisible] = useState(false);

  const { baseCurrency, setBaseCurrency } = useCurrencyStore();
  const { profileImage, setProfileImage } = useProfileStore();
  const { user } = useAuthStore();
  const { data: subscriptions } = useSubscriptions();
  const { isBiometricsEnabled, setBiometricsEnabled } = useSecurityStore();
  const { themeMode, setThemeMode, colors } = useTheme();
  const router = useRouter();
  const { currentLanguage, t, changeLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  const dynamicStyles = useMemo(() => getStyles(colors, isCompact), [colors, isCompact]);
  const insets = useSafeAreaInsets();
  const screenTopSpacing = Platform.OS === 'web' ? 16 : 8;
  const modalBottomPadding = Math.max(32, insets.bottom + 20);

  useEffect(() => {
    const loadProfileName = async () => {
      try {
        const savedName = await AsyncStorage.getItem(PROFILE_NAME_KEY);
        if (savedName) {
          setUserName(savedName);
        } else {
          setUserName(auth.currentUser?.displayName || 'Account Owner');
        }
      } catch (e) {
        console.error('Failed to load name from storage', e);
        setUserName(auth.currentUser?.displayName || 'Account Owner');
      } finally {
        setIsLoadingName(false);
      }
    };
    loadProfileName();
  }, []);

  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.global?.permissionRequired || 'Permission Required', 'Media library access is needed to change your avatar.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const imageUri = result.assets[0].uri;
        await setProfileImage(imageUri);
      }
    } catch (e) {
      console.error('Failed to pick image', e);
    }
  };

  const toggleBiometrics = async () => {
    const availability = await getBiometricAvailability();
    const result = availability.available ? await authenticateUser() : true;

    if (result) {
      triggerHaptic('medium');
      const newValue = !isBiometricsEnabled;
      setBiometricsEnabled(newValue);
    }
  };

  const handleEditPress = () => {
    setTempName(userName);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    const newName = tempName.trim();
    if (newName.length > 0) {
      try {
        await AsyncStorage.setItem(PROFILE_NAME_KEY, newName);
        setUserName(newName);
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: newName }).catch(e => console.log('Firebase auth update failed:', e));
        }
      } catch (e) {
        console.error('Failed to save name to storage', e);
      }
    }
    setIsEditingName(false);
  };

  const handleSignOut = async () => {
    try {
      triggerHaptic('warning');
      await signOut(auth);
      await AsyncStorage.removeItem(PROFILE_NAME_KEY);
      useAuthStore.getState().setUser(null);
      router.replace('/(auth)');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert(t.global?.error || 'Error', 'Failed to sign out safely.');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView
      style={[dynamicStyles.container, { paddingTop: screenTopSpacing }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={dynamicStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={dynamicStyles.pageHeader}>
          <View style={dynamicStyles.pageHeaderCopy}>
            <Text style={[dynamicStyles.pageTitle, { color: colors.text }]}>{isTurkish ? 'Ayarlar' : 'Settings'}</Text>
            <Text style={[dynamicStyles.pageSubtitle, { color: colors.textSecondary }]}>
              {isTurkish ? 'Hesabını ve uygulama tercihlerini yönet.' : 'Manage your account and app preferences.'}
            </Text>
          </View>
          <View style={[dynamicStyles.securityPill, { backgroundColor: isBiometricsEnabled ? 'rgba(16, 185, 129, 0.13)' : 'rgba(59, 130, 246, 0.13)' }]}>
            <Ionicons name={isBiometricsEnabled ? 'shield-checkmark' : 'settings-outline'} size={15} color={isBiometricsEnabled ? '#10B981' : colors.primary} />
            <Text style={[dynamicStyles.securityPillText, { color: isBiometricsEnabled ? '#10B981' : colors.primary }]}>
              {isBiometricsEnabled ? (isTurkish ? 'Koruma açık' : 'Protected') : (isTurkish ? 'Hazır' : 'Ready')}
            </Text>
          </View>
        </View>

        <LinearGradient colors={['#5D43E9', '#347BED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dynamicStyles.profileHeader}>
          <TouchableOpacity style={dynamicStyles.avatarWrapper} activeOpacity={0.8} onPress={handleAvatarPress}>
            {profileImage || user?.photoURL || auth.currentUser?.photoURL ? (
              <Image source={{ uri: profileImage || user?.photoURL || auth.currentUser?.photoURL || '' }} style={dynamicStyles.avatarImage} />
            ) : (
              <Text style={dynamicStyles.avatarInitials}>{getInitials(userName)}</Text>
            )}
            <View style={[dynamicStyles.addPhotoButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={dynamicStyles.nameRow}>
            {isLoadingName ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : isEditingName ? (
              <View style={dynamicStyles.editNameContainer}>
                <TextInput
                  style={dynamicStyles.nameInput}
                  value={tempName}
                  onChangeText={setTempName}
                  autoFocus
                  onSubmitEditing={handleSaveName}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={handleSaveName} style={dynamicStyles.saveIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={dynamicStyles.nameDisplayRow} onPress={handleEditPress} activeOpacity={0.7}>
                <Text numberOfLines={1} style={dynamicStyles.userName}>{userName}</Text>
                <Ionicons name="pencil" size={15} color="rgba(255,255,255,0.82)" />
              </TouchableOpacity>
            )}
            <Text numberOfLines={1} style={dynamicStyles.profileEmail}>
              {user?.email || auth.currentUser?.email || (isTurkish ? 'Profilini düzenlemek için dokun' : 'Tap to edit your profile')}
            </Text>
          </View>

          <View style={dynamicStyles.currencyBadge}>
            <Ionicons name="wallet-outline" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
            <Text style={dynamicStyles.currencyBadgeText}>
              {isTurkish ? 'Ana para birimi ' : 'Base currency '}<Text style={dynamicStyles.currencyBadgeValue}>{baseCurrency}</Text>
            </Text>
          </View>
          <Ionicons name="sparkles" size={58} color="rgba(255,255,255,0.12)" style={dynamicStyles.heroSparkles} />
        </LinearGradient>

        {/* SECTION 1: PREFERENCES */}
        <Text style={[dynamicStyles.sectionHeader, { color: colors.textSecondary }]}>{isTurkish ? 'TERCİHLER' : 'PREFERENCES'}</Text>
        <View style={[dynamicStyles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Language */}
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('selection');
              setLanguageModalVisible(true);
            }}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Ionicons name="language-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>{isTurkish ? 'Dil' : 'Language'}</Text>
            </View>

            <View style={dynamicStyles.menuRowRight}>
              <Text numberOfLines={1} style={[dynamicStyles.menuValue, { color: colors.textSecondary }]}>
                {currentLanguage === 'tr' ? 'Türkçe' : 'English'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={[dynamicStyles.divider, { backgroundColor: colors.border }]} />

          {/* Base Currency */}
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('selection');
              setCurrencyModalVisible(true);
            }}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="wallet-outline" size={18} color="#10B981" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>{isTurkish ? 'Ana para birimi' : 'Base currency'}</Text>
            </View>

            <View style={dynamicStyles.menuRowRight}>
              <Text numberOfLines={1} style={[dynamicStyles.menuValue, { color: colors.textSecondary }]}>{baseCurrency}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={[dynamicStyles.divider, { backgroundColor: colors.border }]} />

          {/* Theme */}
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('selection');
              setThemeModalVisible(true);
            }}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                <Ionicons name="color-palette-outline" size={18} color="#8B5CF6" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>{isTurkish ? 'Görünüm teması' : 'Appearance theme'}</Text>
            </View>

            <View style={dynamicStyles.menuRowRight}>
              <Text numberOfLines={1} style={[dynamicStyles.menuValue, { color: colors.textSecondary }]}>
                {isTurkish ? ({ light: 'Açık', dark: 'Koyu', system: 'Sistem' }[themeMode] || themeMode) : themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* SECTION 2: SECURITY & SYSTEM */}
        <Text style={[dynamicStyles.sectionHeader, { color: colors.textSecondary }]}>{isTurkish ? 'GÜVENLİK VE VERİLER' : 'SECURITY & DATA'}</Text>
        <View style={[dynamicStyles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Biometrics */}
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.7}
            onPress={toggleBiometrics}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Ionicons name="finger-print-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>{isTurkish ? 'Biyometrik kilit' : 'Biometric lock'}</Text>
            </View>

            <View style={dynamicStyles.menuRowRight}>
              <Text numberOfLines={1} style={[dynamicStyles.menuValue, { color: isBiometricsEnabled ? '#10B981' : colors.textSecondary, fontWeight: '800' }]}>
                {isBiometricsEnabled ? (isTurkish ? 'Açık' : 'Enabled') : (isTurkish ? 'Kapalı' : 'Disabled')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* VAULT BACKUP CARD */}
        <View style={[dynamicStyles.vaultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={dynamicStyles.vaultHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={[dynamicStyles.vaultTitle, { color: colors.text }]}>{isTurkish ? 'Veri kasası' : 'Sovereign data vault'}</Text>
          </View>
          <Text style={[dynamicStyles.vaultDesc, { color: colors.textSecondary }]}>
            {isTurkish ? 'Abonelik geçmişini ve cüzdan kartlarını güvenli çevrimdışı yedek için şifreli bir .json dosyasına aktar.' : 'Export your subscription history and wallet cards to an encrypted .json file for safe offline backups.'}
          </Text>

          <View style={{ gap: 10 }}>
            {/* Row 1: Backup & Restore */}
            <View style={dynamicStyles.vaultButtonsRow}>
              <TouchableOpacity
                style={[dynamicStyles.vaultBtn, { backgroundColor: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.25)', borderWidth: 1 }]}
                onPress={() => {
                  triggerHaptic('impactLight');
                  exportVaultBackup();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="download-outline" size={18} color="#3B82F6" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#3B82F6' }}>{isTurkish ? 'JSON yedekle' : 'Back up JSON'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[dynamicStyles.vaultBtn, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.25)', borderWidth: 1 }]}
                onPress={() => {
                  triggerHaptic('impactLight');
                  importVaultBackup(() => router.replace('/(tabs)'));
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={18} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#10B981' }}>{isTurkish ? 'Geri yükle' : 'Restore'}</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2: Full-width Export CSV */}
            <TouchableOpacity
              style={[dynamicStyles.vaultBtnFull, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.25)', borderWidth: 1 }]}
              onPress={() => {
                triggerHaptic('impactLight');
                const items = (subscriptions || []).map(s => ({
                  name: s.name,
                  category: s.category,
                  amount: s.amount,
                  currency: s.currency,
                  billingCycle: s.billingCycle,
                  status: s.status ?? 'active',
                  notes: s.notes,
                }));
                exportCsvReport(items, baseCurrency);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={18} color="#F59E0B" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#F59E0B' }}>{isTurkish ? 'CSV raporunu dışa aktar' : 'Export CSV report'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 3: ACCOUNT & INFO */}
        <Text style={[dynamicStyles.sectionHeader, { color: colors.textSecondary }]}>{isTurkish ? 'HESAP VE BİLGİ' : 'ACCOUNT & INFO'}</Text>
        <View style={[dynamicStyles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Account Details */}
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/settings/account');
            }}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                <Ionicons name="person-outline" size={18} color="#6366F1" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>{isTurkish ? 'Hesap ve şifre' : 'Account & password'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[dynamicStyles.divider, { backgroundColor: colors.border }]} />

          {/* About SubMate */}
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/settings/about');
            }}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
                <Ionicons name="information-circle-outline" size={18} color="#EC4899" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>{isTurkish ? 'SubMate hakkında' : 'About SubMate'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[dynamicStyles.signOutRow, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}
          activeOpacity={0.8}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 6 }} />
          <Text style={dynamicStyles.signOutText}>{isTurkish ? 'Hesaptan çık' : 'Log out'}</Text>
        </TouchableOpacity>

        {/* MODAL: LANGUAGE SELECTOR */}
        <Modal
          visible={isLanguageModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <View style={dynamicStyles.modalOverlay}>
            <Pressable style={dynamicStyles.modalDismissArea} onPress={() => setLanguageModalVisible(false)} />
            <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: modalBottomPadding }]}>
              <View style={dynamicStyles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="language" size={20} color="#3B82F6" />
                  <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>{isTurkish ? 'Dil seçimi' : 'Select language'}</Text>
                </View>
                <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                  <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {[
                { code: 'tr', label: 'Türkçe' },
                { code: 'en', label: 'English' },
              ].map(lang => {
                const isSelected = currentLanguage === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => {
                      triggerHaptic('selection');
                      changeLanguage(lang.code as any);
                      setLanguageModalVisible(false);
                    }}
                    style={[
                      dynamicStyles.optionRow,
                      { backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : colors.background, borderColor: isSelected ? colors.primary : colors.border },
                    ]}
                  >
                    <View style={dynamicStyles.optionIdentity}>
                      <Text numberOfLines={1} style={[dynamicStyles.optionText, { color: colors.text, fontWeight: isSelected ? '800' : '600' }]}>
                        {lang.label}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} style={dynamicStyles.selectionIcon} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>

        {/* MODAL: CURRENCY SELECTOR */}
        <Modal
          visible={isCurrencyModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCurrencyModalVisible(false)}
        >
          <View style={dynamicStyles.modalOverlay}>
            <Pressable style={dynamicStyles.modalDismissArea} onPress={() => setCurrencyModalVisible(false)} />
            <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: modalBottomPadding }]}>
              <View style={dynamicStyles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="wallet" size={20} color="#10B981" />
                  <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>{isTurkish ? 'Ana para birimini seç' : 'Select base currency'}</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                  <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={true}>
                {GLOBAL_CURRENCY_LIST.map(item => {
                  const isSelected = baseCurrency === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      onPress={() => {
                        triggerHaptic('selection');
                        setBaseCurrency(item.code);
                        setCurrencyModalVisible(false);
                      }}
                      style={[
                        dynamicStyles.optionRow,
                        { backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.15)' : colors.background, borderColor: isSelected ? '#10B981' : colors.border },
                      ]}
                    >
                      <View style={dynamicStyles.optionIdentity}>
                        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '800' }}>
                            {item.symbol}
                          </Text>
                        </View>
                        <View style={dynamicStyles.optionCopy}>
                          <Text numberOfLines={1} style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>
                            {item.name}
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                            {item.code}
                          </Text>
                        </View>
                      </View>

                      {isSelected && <Ionicons name="checkmark-circle" size={22} color="#10B981" style={dynamicStyles.selectionIcon} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* MODAL: THEME SELECTOR */}
        <Modal
          visible={isThemeModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setThemeModalVisible(false)}
        >
          <View style={dynamicStyles.modalOverlay}>
            <Pressable style={dynamicStyles.modalDismissArea} onPress={() => setThemeModalVisible(false)} />
            <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: modalBottomPadding }]}>
              <View style={dynamicStyles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="color-palette" size={20} color="#8B5CF6" />
                  <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>{isTurkish ? 'Tema seç' : 'Select theme'}</Text>
                </View>
                <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                  <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {[
                { mode: 'light', label: 'Light Mode', icon: 'sunny-outline', color: '#F59E0B' },
                { mode: 'dark', label: 'Dark Mode', icon: 'moon-outline', color: '#8B5CF6' },
                { mode: 'system', label: 'System Automatic', icon: 'desktop-outline', color: '#3B82F6' },
              ].map(item => {
                const isSelected = themeMode === item.mode;
                return (
                  <TouchableOpacity
                    key={item.mode}
                    style={[
                      dynamicStyles.optionRow,
                      { backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : colors.background, borderColor: isSelected ? '#8B5CF6' : colors.border },
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setThemeMode(item.mode as ThemeMode);
                      setThemeModalVisible(false);
                    }}
                  >
                    <View style={dynamicStyles.optionIdentity}>
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                      <Text numberOfLines={1} style={[dynamicStyles.optionText, { color: colors.text, fontWeight: isSelected ? '800' : '600' }]}>
                        {item.label}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color="#8B5CF6" style={dynamicStyles.selectionIcon} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>

        {/* MODAL: PRIVACY POLICY */}
        <Modal
          visible={isPrivacyModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPrivacyModalVisible(false)}
        >
          <View style={dynamicStyles.modalOverlay}>
            <Pressable style={dynamicStyles.modalDismissArea} onPress={() => setPrivacyModalVisible(false)} />
            <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: modalBottomPadding }]}>
              <View style={dynamicStyles.modalHeader}>
                <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>{isTurkish ? 'Gizlilik politikası' : 'Privacy policy'}</Text>
                <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                  <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 380 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
                  {t.legal?.privacyPolicyContent || 'SubMate is committed to protecting your personal information. All subscription details and payment credentials are encrypted locally on your device.'}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* MODAL: TERMS OF USE */}
        <Modal
          visible={isTermsModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setTermsModalVisible(false)}
        >
          <View style={dynamicStyles.modalOverlay}>
            <Pressable style={dynamicStyles.modalDismissArea} onPress={() => setTermsModalVisible(false)} />
            <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: modalBottomPadding }]}>
              <View style={dynamicStyles.modalHeader}>
                <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>{isTurkish ? 'Kullanım koşulları' : 'Terms of use'}</Text>
                <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                  <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 380 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
                  {t.legal?.termsOfUseContent || 'By using SubMate, you agree to track your recurring subscriptions responsibly. Features are provided for budget planning purposes.'}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isCompact: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingHorizontal: isCompact ? 14 : 20,
      paddingBottom: 140,
    },
    pageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      marginBottom: 20,
      gap: 12,
    },
    pageHeaderCopy: {
      flex: 1,
      minWidth: 0,
    },
    pageTitle: {
      fontSize: isCompact ? 28 : 31,
      fontWeight: '800',
      letterSpacing: -1,
    },
    pageSubtitle: {
      fontSize: 13,
      fontWeight: '500',
      marginTop: 4,
    },
    securityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7,
      flexShrink: 0,
    },
    securityPillText: {
      fontSize: 11,
      fontWeight: '800',
    },
    profileHeader: {
      minHeight: 142,
      borderRadius: 26,
      padding: isCompact ? 16 : 20,
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: 24,
    },
    avatarWrapper: {
      width: isCompact ? 66 : 74,
      height: isCompact ? 66 : 74,
      borderRadius: 25,
      backgroundColor: 'rgba(255,255,255,0.20)',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      marginRight: isCompact ? 12 : 15,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.36)',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 24,
    },
    avatarInitials: {
      fontSize: 28,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    addPhotoButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 27,
      height: 27,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      backgroundColor: '#172554',
    },
    nameRow: {
      flex: 1,
      minWidth: 0,
    },
    nameDisplayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minWidth: 0,
    },
    userName: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
      flexShrink: 1,
    },
    editNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      minWidth: 0,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      borderColor: 'rgba(255,255,255,0.6)',
      backgroundColor: 'rgba(11, 20, 51, 0.18)',
    },
    nameInput: {
      fontSize: 18,
      fontWeight: '700',
      flex: 1,
      minWidth: 0,
      paddingVertical: 4,
      color: '#FFFFFF',
    },
    saveIcon: {
      marginLeft: 6,
      flexShrink: 0,
    },
    currencyBadge: {
      position: 'absolute',
      left: isCompact ? 94 : 109,
      bottom: isCompact ? 16 : 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 9,
    },
    currencyBadgeText: {
      color: 'rgba(255,255,255,0.82)',
      fontSize: 11,
      fontWeight: '600',
    },
    currencyBadgeValue: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    profileEmail: {
      maxWidth: '92%',
      color: 'rgba(255,255,255,0.75)',
      fontSize: 12,
      marginTop: 4,
    },
    heroSparkles: {
      position: 'absolute',
      top: -8,
      right: -10,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginBottom: 8,
      marginLeft: 4,
      marginTop: 4,
    },
    menuGroup: {
      borderRadius: 21,
      borderWidth: 1,
      overflow: 'hidden',
      marginBottom: 22,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 70,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    menuRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      minWidth: 0,
      marginRight: 10,
    },
    menuIconBox: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuLabel: {
      fontSize: 15,
      fontWeight: '700',
      flexShrink: 1,
    },
    menuRowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
      minWidth: 0,
    },
    menuValue: {
      fontSize: 13,
      fontWeight: '600',
      flexShrink: 1,
      textAlign: 'right',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 62,
    },
    vaultCard: {
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      marginBottom: 22,
    },
    vaultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    vaultTitle: {
      fontSize: 16,
      fontWeight: '800',
    },
    vaultDesc: {
      fontSize: 12.5,
      lineHeight: 18,
      marginBottom: 16,
    },
    vaultButtonsRow: {
      flexDirection: isCompact ? 'column' : 'row',
      gap: 10,
    },
    vaultBtn: {
      flex: isCompact ? 0 : 1,
      width: isCompact ? '100%' : undefined,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
      paddingHorizontal: 8,
      borderRadius: 15,
    },
    vaultBtnFull: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 8,
      borderRadius: 15,
    },
    signOutRow: {
      borderRadius: 16,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      marginTop: 8,
      marginBottom: 10,
    },
    signOutText: {
      color: '#EF4444',
      fontSize: 14,
      fontWeight: '800',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
      alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: Platform.OS === 'web' ? 20 : 0,
    },
    modalDismissArea: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
    modalContent: {
      width: '100%',
      maxWidth: 520,
      alignSelf: 'center',
      borderRadius: 24,
      padding: 24,
      paddingBottom: 32,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
      maxHeight: '92%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '800',
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 10,
      minWidth: 0,
      gap: 12,
    },
    optionIdentity: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    optionCopy: {
      flex: 1,
      minWidth: 0,
    },
    selectionIcon: {
      flexShrink: 0,
    },
    optionText: {
      fontSize: 15,
      flexShrink: 1,
    },
  });
