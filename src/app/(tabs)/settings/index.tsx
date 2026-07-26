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
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
import * as LocalAuthentication from 'expo-local-authentication';
import { triggerHaptic } from '@/utils/haptics';
import { exportVaultBackup, importVaultBackup } from '@/utils/vault';
import { useTranslation } from '@/context/LanguageContext';
import { testNotification } from '@/services/notificationService';

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
  const { isBiometricsEnabled, setBiometricsEnabled } = useSecurityStore();
  const { themeMode, setThemeMode, colors } = useTheme();
  const router = useRouter();
  const { currentLanguage, t, changeLanguage } = useTranslation();

  const dynamicStyles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, Platform.OS === 'web' ? 16 : 12);

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
    if (Platform.OS === 'web') {
      triggerHaptic('impactLight');
      const newValue = !isBiometricsEnabled;
      setBiometricsEnabled(newValue);
      await AsyncStorage.setItem('@submate_biometric_enabled', newValue ? 'true' : 'false');
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      Alert.alert('Biometrics Unavailable', 'Your device does not support hardware biometric authentication.');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: isBiometricsEnabled ? 'Authenticate to disable App Lock' : 'Authenticate to enable App Lock',
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      triggerHaptic('medium');
      const newValue = !isBiometricsEnabled;
      setBiometricsEnabled(newValue);
      await AsyncStorage.setItem('@submate_biometric_enabled', newValue ? 'true' : 'false');
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
    <SafeAreaView style={[dynamicStyles.container, { paddingTop }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={dynamicStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Header */}
        <View style={[dynamicStyles.profileHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
              <View style={[dynamicStyles.editNameContainer, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                <TextInput
                  style={[dynamicStyles.nameInput, { color: colors.text }]}
                  value={tempName}
                  onChangeText={setTempName}
                  autoFocus
                  onSubmitEditing={handleSaveName}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={handleSaveName} style={dynamicStyles.saveIcon}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={dynamicStyles.nameDisplayRow} onPress={handleEditPress} activeOpacity={0.7}>
                <Text style={[dynamicStyles.userName, { color: colors.text }]}>{userName}</Text>
                <Ionicons name="pencil" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[dynamicStyles.currencyBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="cash-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[dynamicStyles.currencyBadgeText, { color: colors.textSecondary }]}>
              Base Currency: <Text style={{ color: colors.text, fontWeight: '800' }}>{baseCurrency}</Text>
            </Text>
          </View>
        </View>

        {/* SECTION 1: PREFERENCES */}
        <Text style={[dynamicStyles.sectionHeader, { color: colors.textSecondary }]}>PREFERENCES</Text>
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
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>Language / Dil</Text>
            </View>

            <View style={dynamicStyles.menuRowRight}>
              <Text style={[dynamicStyles.menuValue, { color: colors.textSecondary }]}>
                {currentLanguage === 'tr' ? 'Türkçe 🇹🇷' : 'English 🇬🇧'}
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
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>Base Currency</Text>
            </View>

            <View style={dynamicStyles.menuRowRight}>
              <Text style={[dynamicStyles.menuValue, { color: colors.textSecondary }]}>{baseCurrency}</Text>
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
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>Appearance Theme</Text>
            </View>

            <View style={dynamicStyles.menuRowRight}>
              <Text style={[dynamicStyles.menuValue, { color: colors.textSecondary }]}>
                {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* SECTION 2: SECURITY & SYSTEM */}
        <Text style={[dynamicStyles.sectionHeader, { color: colors.textSecondary }]}>SECURITY & DATA</Text>
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
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>Biometric Lock</Text>
            </View>

            <View style={dynamicStyles.menuRowRight}>
              <Text style={[dynamicStyles.menuValue, { color: isBiometricsEnabled ? '#10B981' : colors.textSecondary, fontWeight: '800' }]}>
                {isBiometricsEnabled ? 'Enabled' : 'Disabled'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={[dynamicStyles.divider, { backgroundColor: colors.border }]} />

          {/* Test Notification */}
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('impactLight');
              testNotification();
            }}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Ionicons name="notifications-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>Test Renewal Notification</Text>
            </View>

            <View style={dynamicStyles.menuRowRight}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Send Test</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* VAULT BACKUP CARD */}
        <View style={[dynamicStyles.vaultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={dynamicStyles.vaultHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={[dynamicStyles.vaultTitle, { color: colors.text }]}>Sovereign Data Vault</Text>
          </View>
          <Text style={[dynamicStyles.vaultDesc, { color: colors.textSecondary }]}>
            Export your entire subscription history & wallet cards to an encrypted .json file for safe offline backups.
          </Text>

          <View style={dynamicStyles.vaultButtonsRow}>
            <TouchableOpacity
              style={[dynamicStyles.vaultBtn, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}
              onPress={() => {
                triggerHaptic('impactLight');
                exportVaultBackup();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={16} color="#3B82F6" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#3B82F6' }}>Backup JSON</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[dynamicStyles.vaultBtn, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}
              onPress={() => {
                triggerHaptic('impactLight');
                importVaultBackup(() => router.replace('/(tabs)'));
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={16} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>Restore</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 3: ACCOUNT & INFO */}
        <Text style={[dynamicStyles.sectionHeader, { color: colors.textSecondary }]}>ACCOUNT & INFO</Text>
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
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>Account & Password</Text>
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
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>About SubMate</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[dynamicStyles.divider, { backgroundColor: colors.border }]} />

          {/* Privacy Policy */}
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('selection');
              setPrivacyModalVisible(true);
            }}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(148, 163, 184, 0.12)' }]}>
                <Ionicons name="document-text-outline" size={18} color="#94A3B8" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[dynamicStyles.divider, { backgroundColor: colors.border }]} />

          {/* Terms of Use */}
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('selection');
              setTermsModalVisible(true);
            }}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(148, 163, 184, 0.12)' }]}>
                <Ionicons name="newspaper-outline" size={18} color="#94A3B8" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>Terms of Use</Text>
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
          <Text style={dynamicStyles.signOutText}>Log Out Account</Text>
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
            <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={dynamicStyles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="language" size={20} color="#3B82F6" />
                  <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>Select Language / Dil Seçimi</Text>
                </View>
                <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                  <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {[
                { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
                { code: 'en', label: 'English', flag: '🇬🇧' },
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 20 }}>{lang.flag}</Text>
                      <Text style={[dynamicStyles.optionText, { color: colors.text, fontWeight: isSelected ? '800' : '600' }]}>
                        {lang.label}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
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
            <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={dynamicStyles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="wallet" size={20} color="#10B981" />
                  <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>Select Base Currency</Text>
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '800' }}>
                            {item.symbol}
                          </Text>
                        </View>
                        <View>
                          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>
                            {item.name}
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                            {item.code}
                          </Text>
                        </View>
                      </View>

                      {isSelected && <Ionicons name="checkmark-circle" size={22} color="#10B981" />}
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
            <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={dynamicStyles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="color-palette" size={20} color="#8B5CF6" />
                  <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>Select Theme</Text>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                      <Text style={[dynamicStyles.optionText, { color: colors.text, fontWeight: isSelected ? '800' : '600' }]}>
                        {item.label}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color="#8B5CF6" />}
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
            <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={dynamicStyles.modalHeader}>
                <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>Privacy Policy</Text>
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
            <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={dynamicStyles.modalHeader}>
                <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>Terms of Use</Text>
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

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingBottom: 140,
    },
    profileHeader: {
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      marginBottom: 20,
    },
    avatarWrapper: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      marginBottom: 12,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 40,
    },
    avatarInitials: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
    },
    addPhotoButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nameRow: {
      marginBottom: 6,
    },
    nameDisplayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    userName: {
      fontSize: 20,
      fontWeight: '800',
    },
    editNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
    },
    nameInput: {
      fontSize: 18,
      fontWeight: '700',
      minWidth: 180,
      paddingVertical: 4,
    },
    saveIcon: {
      marginLeft: 6,
    },
    currencyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
    },
    currencyBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginBottom: 8,
      marginLeft: 4,
      marginTop: 8,
    },
    menuGroup: {
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
      marginBottom: 16,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    menuRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    menuIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuLabel: {
      fontSize: 14,
      fontWeight: '700',
    },
    menuRowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    menuValue: {
      fontSize: 13,
      fontWeight: '600',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 62,
    },
    vaultCard: {
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      marginBottom: 16,
    },
    vaultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    vaultTitle: {
      fontSize: 15,
      fontWeight: '800',
    },
    vaultDesc: {
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 14,
    },
    vaultButtonsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    vaultBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 12,
    },
    signOutRow: {
      borderRadius: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      marginTop: 8,
      marginBottom: 20,
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
    },
    optionText: {
      fontSize: 15,
    },
  });

