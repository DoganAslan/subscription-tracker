import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Modal, Pressable, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { exportVaultBackup, importVaultBackup } from '@/utils/vault';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from '@/context/LanguageContext';

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

const getMenuOptions = (t: any) => [
  { id: 'account', label: t.settingsPage?.profile || t.settings?.accountSettings || 'Profile' },
  { id: 'theme', label: t.settingsPage?.theme || t.settings?.theme || 'Theme' },
  { id: 'currency', label: t.settingsPage?.currencyPref || t.settings?.currencyPref || 'Currency' },
  { id: 'security', label: t.settingsPage?.security || t.settings?.security || 'Security' },
  { id: 'about', label: t.settingsPage?.about || t.settings?.about || 'About SubMate' },
];

export default function SettingsScreen() {
  const [userName, setUserName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');
  const [isLoadingName, setIsLoadingName] = useState<boolean>(true);
  
  const [isCurrencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [isThemeModalVisible, setThemeModalVisible] = useState(false);
  const [isAboutModalVisible, setAboutModalVisible] = useState(false);
  const [isPrivacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [isTermsModalVisible, setTermsModalVisible] = useState(false);
  
  const { baseCurrency, setBaseCurrency } = useCurrencyStore();
  const { profileImage, setProfileImage } = useProfileStore();
  const { user } = useAuthStore();
  const { isBiometricsEnabled, setBiometricsEnabled } = useSecurityStore();
  const { data: subscriptions } = useSubscriptions();
  const { themeMode, setThemeMode, colors } = useTheme();
  const router = useRouter();
  const { currentLanguage, t, changeLanguage } = useTranslation();

  const dynamicStyles = useMemo(() => getStyles(colors), [colors]);

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
      Alert.alert(t.global.permissionRequired, t.global.weNeedAccessToYourCa);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]?.base64) {
        const microAvatarString = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setProfileImage(microAvatarString);
        
        if (auth.currentUser) {
          try {
            // NOTE: We do NOT use updateProfile({ photoURL: microAvatarString }) here 
            // because Firebase restricts photoURL length and base64 strings are too long,
            // resulting in 'auth/invalid-profile-attribute'. 
            // We rely entirely on useProfileStore for local persistence.
          } catch (e) {
            console.error('Failed to update avatar in auth profile', e);
          }
        }
      }
    } catch (e) {
      console.error('Failed to pick image', e);
      Alert.alert(t.global.error, t.global.anErrorOccurredWhile);
    }
  };

  const toggleBiometrics = async () => {
    if (Platform.OS === 'web') {
      alert('Biometric authentication is not supported on the web platform. Please use a physical mobile device.');
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      Alert.alert(t.global.unavailable, t.global.yourDeviceDoesNotSup);
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

  const handleMenuPress = (id: string) => {
    triggerHaptic('medium');
    if (id === 'account') {
      try {
        router.push('/(tabs)/settings/account');
      } catch {
        Alert.alert(t.settingsPage?.profile || 'Profile', `User: dogan aslan\nBase Currency: ${baseCurrency}`);
      }
    } else if (id === 'theme') {
      setThemeModalVisible(true);
    } else if (id === 'security') {
      toggleBiometrics();
    } else if (id === 'currency') {
      setCurrencyModalVisible(true);
    } else if (id === 'about') {
      setAboutModalVisible(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem(PROFILE_NAME_KEY);
      useAuthStore.getState().setUser(null);
      router.replace('/(auth)');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert(t.global.error, t.global.failedToSignOutSecur);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={dynamicStyles.container} contentContainerStyle={[dynamicStyles.contentContainer, { paddingTop: Math.max(32, insets.top + 16) }]}>
      
      <View style={dynamicStyles.profileHeader}>
        <TouchableOpacity style={dynamicStyles.avatarWrapper} activeOpacity={0.8} onPress={handleAvatarPress}>
          {profileImage || user?.photoURL || auth.currentUser?.photoURL ? (
            <Image source={{ uri: profileImage || user?.photoURL || auth.currentUser?.photoURL || '' }} style={dynamicStyles.avatarImage} />
          ) : (
            <Text style={dynamicStyles.avatarInitials}>{getInitials(userName)}</Text>
          )}
          <View style={dynamicStyles.addPhotoButton}>
            <Ionicons name="add" size={16} color={colors.text} />
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
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={dynamicStyles.nameDisplayRow} 
              onPress={handleEditPress}
              activeOpacity={0.7}
            >
              <Text style={dynamicStyles.userName}>{userName}</Text>
              <Ionicons name="pencil" size={16} color={colors.textSecondary} style={dynamicStyles.editIcon} />
            </TouchableOpacity>
          )}
        </View>

        <View style={dynamicStyles.currencyBadge}>
          <Text style={dynamicStyles.currencyBadgeText}>{t.settingsPage?.homeBaseCurrency || t.settings?.homeBaseCurrency || 'Base Currency'}: {baseCurrency}</Text>
        </View>
      </View>

      <View style={dynamicStyles.menuStack}>
        {getMenuOptions(t).map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={dynamicStyles.menuCard}
            activeOpacity={0.7}
            onPress={() => handleMenuPress(item.id)} 
          >
            <Text style={dynamicStyles.menuLabel}>{item.label}</Text>
            <View style={dynamicStyles.menuRight}>
              {item.id === 'currency' && <Text style={dynamicStyles.menuValue}>{baseCurrency}</Text>}
              {item.id === 'theme' && <Text style={dynamicStyles.menuValue}>{themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}</Text>}
              {item.id === 'security' && (
                <Text style={[dynamicStyles.menuValue, { color: isBiometricsEnabled ? colors.primary : colors.textSecondary }]}>
                  {isBiometricsEnabled ? 'On' : 'Off'}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ marginBottom: 24 }}>
        {/* SOVEREIGN VAULT CARD SECTION */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, marginLeft: 8, textTransform: 'uppercase', marginTop: 24 }}>
          {t.vault?.title || 'DATA SOVEREIGNTY (SOVEREIGN VAULT)'}
        </Text>

        <View style={{ flexDirection: 'column', gap: 16, backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginVertical: 8 }}>
          {/* Left Action: Download */}
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            onPress={() => exportVaultBackup()}
          >
            <Ionicons name="cloud-download-outline" size={20} color="#3B82F6" />
            <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '500' }}>
              {t.vault?.download || 'Download Vault Backup (.json)'}
            </Text>
          </TouchableOpacity>

          {/* Right Action: Restore */}
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            onPress={() => importVaultBackup(() => router.replace('/(tabs)'))}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#10B981" />
            <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '500' }}>
              {t.vault?.restore || 'Restore Backup'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={dynamicStyles.signOutRow} activeOpacity={0.8} onPress={handleSignOut}>
        <Text style={dynamicStyles.signOutText}>{t.settingsPage?.logout || t.settings?.logout || 'Log Out'}</Text>
      </TouchableOpacity>

      <Modal
        visible={isCurrencyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <Pressable style={dynamicStyles.modalDismissArea} onPress={() => setCurrencyModalVisible(false)} />
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>{t.global.selectBaseCurrency}</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={true}>
              {GLOBAL_CURRENCY_LIST.map((item) => {
                const isSelected = baseCurrency === item.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    onPress={() => {
                      setBaseCurrency(item.code);
                      setCurrencyModalVisible(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? '#1E3A8A' : '#1E293B',
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      marginBottom: 10,
                    }}
                  >
                    {/* Left Side: Symbol & Details aligned horizontally */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ color: '#10B981', fontSize: 18, fontWeight: '700', width: 30 }}>
                        {item.symbol}
                      </Text>
                      <View style={{ flexDirection: 'column' }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                          {item.name}
                        </Text>
                        <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500', textTransform: 'uppercase' }}>
                          {item.code}
                        </Text>
                      </View>
                    </View>

                    {/* Right Side: Checkmark selection indicator */}
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* THEME MODAL */}
      <Modal
        visible={isThemeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <Pressable style={dynamicStyles.modalDismissArea} onPress={() => setThemeModalVisible(false)} />
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>{t.global.selectTheme}</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  dynamicStyles.currencyRow,
                  themeMode === mode && dynamicStyles.currencyRowActive
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  setThemeMode(mode);
                  setThemeModalVisible(false);
                }}
              >
                <Text style={[
                  dynamicStyles.currencyName,
                  themeMode === mode && dynamicStyles.currencyNameActive
                ]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
                {themeMode === mode && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ABOUT MODAL */}
      <Modal
        visible={isAboutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <Pressable style={dynamicStyles.modalDismissArea} onPress={() => setAboutModalVisible(false)} />
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>{t.settingsPage?.about || t.settings?.about || 'About SubMate'}</Text>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={{ paddingVertical: 16 }}>
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>SubMate v1.0.0</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 16 }}>
                  Your ultimate, secure dynamic subscription architecture shield.
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[dynamicStyles.menuCard, { marginBottom: 12, borderWidth: 0, backgroundColor: 'rgba(59, 130, 246, 0.05)' }]} 
                activeOpacity={0.7}
                onPress={() => setPrivacyModalVisible(true)}
              >
                <Text style={dynamicStyles.menuLabel}>{t.settingsPage?.privacyPolicy || 'Privacy Policy'}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[dynamicStyles.menuCard, { marginBottom: 12, borderWidth: 0, backgroundColor: 'rgba(59, 130, 246, 0.05)' }]} 
                activeOpacity={0.7}
                onPress={() => setTermsModalVisible(true)}
              >
                <Text style={dynamicStyles.menuLabel}>{t.settingsPage?.termsOfUse || 'Terms of Use'}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PRIVACY POLICY MODAL */}
      <Modal
        visible={isPrivacyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <Pressable style={dynamicStyles.modalDismissArea} onPress={() => setPrivacyModalVisible(false)} />
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>{t.legal?.privacyPolicy || t.settingsPage?.privacyPolicy || 'Privacy Policy'}</Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ paddingVertical: 16, maxHeight: 400 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
                {t.legal?.privacyPolicyContent || 'Privacy policy content is loading...'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* TERMS OF USE MODAL */}
      <Modal
        visible={isTermsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <Pressable style={dynamicStyles.modalDismissArea} onPress={() => setTermsModalVisible(false)} />
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>{t.legal?.termsOfUse || t.settingsPage?.termsOfUse || 'Terms of Use'}</Text>
              <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ paddingVertical: 16, maxHeight: 400 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
                {t.legal?.termsOfUseContent || 'Terms of use content is loading...'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
  },
  addPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  nameRow: {
    minHeight: 40,
    justifyContent: 'center',
    marginBottom: 8,
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  editIcon: {
    marginTop: 2,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    minWidth: 200,
    paddingVertical: 6,
  },
  saveIcon: {
    marginLeft: 8,
  },
  currencyBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  menuStack: {
    gap: 12,
    marginBottom: 40,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signOutRow: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252, 165, 165, 0.2)',
    backgroundColor: 'rgba(252, 165, 165, 0.04)',
  },
  signOutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyRowActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  currencyName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  currencyNameActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  langBtn: { flex: 1, padding: 14, backgroundColor: colors.surface, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  activeBtn: { backgroundColor: '#1E3A8A', borderColor: '#3B82F6' },
  btnText: { color: colors.textSecondary, fontWeight: '600' },
  activeBtnText: { color: '#FFFFFF' },
});


