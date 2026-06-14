import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Modal, Pressable, Image, Platform } from 'react-native';
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
import { exportSubscriptionsToCSV } from '@/utils/ExportService';
import { useTranslation } from 'react-i18next';

const PROFILE_NAME_KEY = '@profile_name';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
];

const getMenuOptions = (t: any) => [
  { id: 'account', label: t('settings.accountSettings') },
  { id: 'theme', label: t('settings.theme') },
  { id: 'export', label: t('settings.exportData') },
  { id: 'currency', label: t('settings.currencyPref') },
  { id: 'security', label: t('settings.security') },
  { id: 'about', label: t('settings.about') },
];

export default function SettingsScreen() {
  const [userName, setUserName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');
  const [isLoadingName, setIsLoadingName] = useState<boolean>(true);
  
  const [isCurrencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [isThemeModalVisible, setThemeModalVisible] = useState(false);
  
  const { baseCurrency, setBaseCurrency } = useCurrencyStore();
  const { profileImage, setProfileImage } = useProfileStore();
  const { isBiometricsEnabled, setBiometricsEnabled } = useSecurityStore();
  const { data: subscriptions } = useSubscriptions();
  const { themeMode, setThemeMode, colors } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

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
      Alert.alert('Permission Required', 'We need access to your camera roll to update your profile picture.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Failed to pick image', e);
      Alert.alert('Error', 'An error occurred while selecting the image.');
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
      Alert.alert('Unavailable', 'Your device does not support or has not set up biometric authentication. Passcode fallback will be used.');
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: isBiometricsEnabled ? 'Authenticate to disable App Lock' : 'Authenticate to enable App Lock',
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      triggerHaptic('medium');
      setBiometricsEnabled(!isBiometricsEnabled);
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
      router.push('/(tabs)/settings/account');
    } else if (id === 'theme') {
      setThemeModalVisible(true);
    } else if (id === 'export') {
      exportSubscriptionsToCSV(subscriptions || []);
    } else if (id === 'security') {
      toggleBiometrics();
    } else if (id === 'currency') {
      setCurrencyModalVisible(true);
    } else if (id === 'about') {
      router.push('/(tabs)/settings/about');
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
      Alert.alert('Error', 'Failed to sign out securely.');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  return (
    <ScrollView style={dynamicStyles.container} contentContainerStyle={dynamicStyles.contentContainer}>
      
      <View style={dynamicStyles.profileHeader}>
        <TouchableOpacity style={dynamicStyles.avatarWrapper} activeOpacity={0.8} onPress={handleAvatarPress}>
          {(profileImage || auth.currentUser?.photoURL) ? (
            <Image source={{ uri: profileImage || auth.currentUser?.photoURL || '' }} style={dynamicStyles.avatarImage} />
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
          <Text style={dynamicStyles.currencyBadgeText}>{t('settings.homeBaseCurrency')}: {baseCurrency}</Text>
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

      <TouchableOpacity style={dynamicStyles.signOutRow} activeOpacity={0.8} onPress={handleSignOut}>
        <Text style={dynamicStyles.signOutText}>{t('settings.logout')}</Text>
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
              <Text style={dynamicStyles.modalTitle}>Select Base Currency</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  dynamicStyles.currencyRow,
                  baseCurrency === currency.code && dynamicStyles.currencyRowActive
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  setBaseCurrency(currency.code);
                  setCurrencyModalVisible(false);
                }}
              >
                <Text style={[
                  dynamicStyles.currencyName,
                  baseCurrency === currency.code && dynamicStyles.currencyNameActive
                ]}>
                  {currency.name} ({currency.symbol})
                </Text>
                {baseCurrency === currency.code && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
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
              <Text style={dynamicStyles.modalTitle}>Select Theme</Text>
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
});
