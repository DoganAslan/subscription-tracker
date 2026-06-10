import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Modal, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/services/firebase/config';
import { updateProfile, signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useSecurityStore } from '@/store/useSecurityStore';
import { CATEGORIES } from '@/features/subscriptions/components/SubscriptionForm';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';

const PROFILE_NAME_KEY = '@profile_name';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
];

const MENU_OPTIONS = [
  { id: 'account', label: 'Account Settings' },
  { id: 'currency', label: 'Currency Preferences' },
  { id: 'budgets', label: 'Budget Limits' },
  { id: 'security', label: 'Security & Biometrics' },
];

export default function SettingsScreen() {
  const [userName, setUserName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');
  const [isLoadingName, setIsLoadingName] = useState<boolean>(true);
  
  const [isCurrencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [isBudgetModalVisible, setBudgetModalVisible] = useState(false);
  
  const { baseCurrency, setBaseCurrency } = useCurrencyStore();
  const { budgetCaps, setBudgetCap } = useBudgetStore();
  const { profileImage, setProfileImage } = useProfileStore();
  const { isBiometricsEnabled, setBiometricsEnabled } = useSecurityStore();
  const router = useRouter();

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (id === 'account') {
      Alert.alert('Account Settings', 'Navigation to Account Details coming soon.');
    } else if (id === 'security') {
      toggleBiometrics();
    } else if (id === 'currency') {
      setCurrencyModalVisible(true);
    } else if (id === 'budgets') {
      setBudgetModalVisible(true);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await signOut(auth);
              await AsyncStorage.removeItem(PROFILE_NAME_KEY);
              useAuthStore.getState().setUser(null);
              router.replace('/(auth)');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out securely.');
            }
          } 
        }
      ]
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      <View style={styles.profileHeader}>
        <TouchableOpacity style={styles.avatarWrapper} activeOpacity={0.8} onPress={handleAvatarPress}>
          {(profileImage || auth.currentUser?.photoURL) ? (
            <Image source={{ uri: profileImage || auth.currentUser?.photoURL || '' }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitials}>{getInitials(userName)}</Text>
          )}
          <View style={styles.addPhotoButton}>
            <Ionicons name="add" size={16} color={COLORS.textPrimary} />
          </View>
        </TouchableOpacity>

        <View style={styles.nameRow}>
          {isLoadingName ? (
            <ActivityIndicator color={COLORS.accent} size="small" />
          ) : isEditingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.nameInput}
                value={tempName}
                onChangeText={setTempName}
                autoFocus
                onSubmitEditing={handleSaveName}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={handleSaveName} style={styles.saveIcon}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.nameDisplayRow} 
              onPress={handleEditPress}
              activeOpacity={0.7}
            >
              <Text style={styles.userName}>{userName}</Text>
              <Ionicons name="pencil" size={16} color={COLORS.textSecondary} style={styles.editIcon} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.currencyBadge}>
          <Text style={styles.currencyBadgeText}>Home Base Currency: {baseCurrency}</Text>
        </View>
      </View>

      <View style={styles.menuStack}>
        {MENU_OPTIONS.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.menuCard}
            activeOpacity={0.7}
            onPress={() => handleMenuPress(item.id)} 
          >
            <Text style={styles.menuLabel}>{item.label}</Text>
            <View style={styles.menuRight}>
              {item.id === 'currency' && <Text style={styles.menuValue}>{baseCurrency}</Text>}
              {item.id === 'security' && (
                <Text style={[styles.menuValue, { color: isBiometricsEnabled ? COLORS.accent : COLORS.textSecondary }]}>
                  {isBiometricsEnabled ? 'On' : 'Off'}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutRow} activeOpacity={0.8} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out Securely</Text>
      </TouchableOpacity>

      {/* CURRENCY MODAL */}
      <Modal
        visible={isCurrencyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setCurrencyModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Base Currency</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyRow,
                  baseCurrency === currency.code && styles.currencyRowActive
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  setBaseCurrency(currency.code);
                  setCurrencyModalVisible(false);
                }}
              >
                <Text style={[
                  styles.currencyName,
                  baseCurrency === currency.code && styles.currencyNameActive
                ]}>
                  {currency.name} ({currency.symbol})
                </Text>
                {baseCurrency === currency.code && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* BUDGET LIMITS MODAL */}
      <Modal
        visible={isBudgetModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setBudgetModalVisible(false)} />
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Budget Limits</Text>
              <TouchableOpacity onPress={() => setBudgetModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {CATEGORIES.map((category) => (
                <View key={category.name} style={styles.budgetRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.budgetName}>{category.name}</Text>
                  </View>
                  <View style={styles.budgetInputContainer}>
                    <Text style={styles.budgetCurrencyLabel}>{baseCurrency}</Text>
                    <TextInput
                      style={styles.budgetInput}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={COLORS.textSecondary}
                      value={budgetCaps[category.name] ? budgetCaps[category.name].toString() : ''}
                      onChangeText={(val) => {
                        const parsed = parseFloat(val);
                        if (!isNaN(parsed) && parsed >= 0) {
                          setBudgetCap(category.name, parsed);
                        } else if (val === '') {
                          // Allow clearing the budget cap by treating it as 0
                          setBudgetCap(category.name, 0);
                        }
                      }}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 2,
    borderColor: COLORS.border,
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
    color: COLORS.textPrimary,
  },
  addPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
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
    color: COLORS.textPrimary,
  },
  editIcon: {
    marginTop: 2,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: 12,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 200,
    paddingVertical: 6,
  },
  saveIcon: {
    marginLeft: 8,
  },
  currencyBadge: {
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  menuStack: {
    gap: 12,
    marginBottom: 40,
  },
  menuCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    color: COLORS.dangerPastel,
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
    backgroundColor: '#1F2937',
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
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencyRowActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  currencyName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  currencyNameActive: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  budgetName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  budgetCurrencyLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  budgetInput: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 80,
    paddingVertical: 8,
    textAlign: 'right',
  }
});
