import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { triggerHaptic } from '@/utils/haptics';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { AuthService } from '@/services/firebase/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVAILABLE_LANGUAGES } from '@/locales/i18n';
import * as Notifications from 'expo-notifications';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  const [isLoading, setIsLoading] = useState(false);

  // Modal States
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [reauthModalVisible, setReauthModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const { t, i18n } = useTranslation();

  const changeLanguage = async (code: string) => {
    await AsyncStorage.setItem('user-language', code);
    await i18n.changeLanguage(code);
    setLanguageModalVisible(false);
  };

  // Form States
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reauthPassword, setReauthPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // Password Visibility States
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  // Track what action to retry after re-auth
  const [pendingAction, setPendingAction] = useState<'email' | 'password' | 'delete' | null>(null);

  // Privacy State
  const [isIdVisible, setIsIdVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsIdVisible(false);
      };
    }, [])
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isIdVisible) {
      timer = setTimeout(() => {
        setIsIdVisible(false);
      }, 30000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isIdVisible]);

  const handleAuthError = (error: any, actionType: 'email' | 'password' | 'delete') => {
    if (error.code === 'auth/requires-recent-login') {
      setPendingAction(actionType);
      setReauthPassword('');
      setReauthModalVisible(true);
    } else {
      Alert.alert(t('global.error'), error.message || 'An unexpected error occurred.');
    }
  };

  const executePendingAction = async () => {
    if (!pendingAction) return;
    
    if (pendingAction === 'email') {
      await AuthService.updateEmailAddress(newEmail);
      Alert.alert(t('global.success'), t('global.emailUpdatedSuccessf'));
      setEmailModalVisible(false);
    } else if (pendingAction === 'password') {
      await AuthService.updateUserPassword(newPassword);
      Alert.alert(t('global.success'), t('global.passwordUpdatedSucce'));
      setPasswordModalVisible(false);
    } else if (pendingAction === 'delete') {
      await AuthService.deleteAccount();
    }
    setPendingAction(null);
    setReauthModalVisible(false);
  };

  const handleReauthSubmit = async () => {
    if (!reauthPassword) {
      Alert.alert(t('global.deleteError'), t('global.pleaseEnterYourPassw'));
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.reauthenticate(reauthPassword);
      await executePendingAction();
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert(t('global.deleteError'), t('global.thePasswordYouEntere'));
      } else if (error.code === 'auth/requires-recent-login') {
        Alert.alert(t('global.deleteError'), t('global.sessionExpiredPlease'));
      } else {
        Alert.alert(t('global.deleteError'), error.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      Alert.alert(t('global.invalidEmail'), t('global.pleaseEnterAValidEma'));
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.updateEmailAddress(newEmail);
      Alert.alert(t('global.success'), t('global.emailUpdatedSuccessf'));
      setEmailModalVisible(false);
      setNewEmail('');
    } catch (error: any) {
      handleAuthError(error, 'email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert(t('global.error'), t('global.pleaseEnterYourCurre'));
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert(t('global.invalidPassword'), t('global.passwordMustBeAtLeas'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('global.error'), t('global.passwordsDoNotMatch'));
      return;
    }

    setIsLoading(true);
    try {
      // 1. Re-authenticate user explicitly
      await AuthService.reauthenticate(currentPassword);
      
      // 2. Update password
      await AuthService.updateUserPassword(newPassword);
      
      Alert.alert(t('global.success'), t('global.passwordUpdatedSucce'));
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert(t('global.authenticationFailed'), t('global.currentPasswordIsInc'));
      } else {
        Alert.alert(t('global.error'), error.message || 'Failed to update password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    console.log("Reset button clicked!");
    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;

    if (!currentUser || !currentUser.email) {
      if (Platform.OS === 'web') {
        window.alert("No authenticated user found.");
      } else {
        Alert.alert(t('global.error'), t('global.noAuthenticatedUserF'));
      }
      return;
    }

    const executeReset = async () => {
      try {
        setIsLoading(true);
        await sendPasswordResetEmail(authInstance, currentUser.email!);
        if (Platform.OS === 'web') {
          window.alert("Password reset email sent. Please check your inbox.");
        } else {
          Alert.alert(t('global.success'), t('global.passwordResetEmailSe'));
        }
      } catch (error: any) {
        console.error("Reset Email Error:", error);
        if (Platform.OS === 'web') {
          window.alert(error.message || "Failed to send reset email.");
        } else {
          Alert.alert(t('global.error'), error.message || "Failed to send reset email.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Send a password reset link to ${currentUser.email}?`);
      if (confirmed) await executeReset();
    } else {
      Alert.alert(t('global.resetPassword'), t('global.sendAPasswordResetLi'),
        [
          { text: "Cancel", style: "cancel" },
          { text: "Send", onPress: executeReset }
        ]
      );
    }
  };

  const handleDeleteAccount = () => {
    setDeletePassword('');
    setDeleteModalVisible(true);
  };

  const confirmAndDelete = async () => {
    if (!deletePassword) {
      Alert.alert(t('global.error'), t('global.passwordIsRequiredTo'));
      return;
    }
    
    setIsLoading(true);
    try {
      await AuthService.reauthenticate(deletePassword);
      await AuthService.deleteAccount();
    } catch (error: any) {
      console.error("Deletion Error:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert(t('global.deletionFailed'), t('global.thePasswordYouEntere'));
      } else if (error.code === 'auth/requires-recent-login') {
        Alert.alert(t('global.deletionFailed'), t('global.sessionExpiredPlease'));
      } else {
        Alert.alert(t('global.deletionFailed'), error.message || 'Please check your password and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = async () => {
    if (user?.uid) {
      triggerHaptic('light');
      await Clipboard.setStringAsync(user.uid);
      Toast.show({ type: 'success', text1: 'Copied to clipboard!', position: 'top' });
    }
  };

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity 
          style={dynamicStyles.backButton} 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/settings');
            }
          }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>{t('settings.accountSettings')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={dynamicStyles.content}>
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t('settings.profileInfo')}</Text>
          <View style={dynamicStyles.card}>
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>{t('settings.email')}</Text>
              <Text style={dynamicStyles.infoValue}>{user?.email || 'N/A'}</Text>
            </View>
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>{t('settings.accountId')}</Text>
              {isIdVisible ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    style={dynamicStyles.copyContainer} 
                    onPress={handleCopyId}
                    activeOpacity={0.7}
                  >
                    <Text style={[dynamicStyles.infoValue, { maxWidth: 120 }]} numberOfLines={1} ellipsizeMode="middle">
                      {user?.uid}
                    </Text>
                    <Ionicons name="copy-outline" size={16} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      triggerHaptic('light');
                      setIsIdVisible(false);
                    }} 
                    style={{ padding: 4, marginLeft: 8 }}
                  >
                    <Ionicons name="eye-off-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={() => { 
                    triggerHaptic('medium'); 
                    setIsIdVisible(true); 
                  }} 
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}
                >
                  <Ionicons name="eye-outline" size={16} color={colors.primary} />
                  <Text style={[dynamicStyles.infoValue, { color: colors.primary, marginLeft: 6, fontWeight: '500' }]}>{t('global.revealId')}</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={dynamicStyles.infoRow}
              onPress={() => {
                triggerHaptic('medium');
                setLanguageModalVisible(true);
              }}
            >
              <Text style={dynamicStyles.infoLabel}>{t('settings.language')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={dynamicStyles.infoValue}>
                  {AVAILABLE_LANGUAGES.find(l => l.code === i18n.language)?.label || 'English'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: 6 }} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t('global.security')}</Text>
          <View style={dynamicStyles.card}>
            <TouchableOpacity 
              style={dynamicStyles.menuItem} 
              onPress={() => {
                triggerHaptic('medium');
                setNewEmail('');
                setEmailModalVisible(true);
              }}
            >
              <View style={dynamicStyles.menuItemLeft}>
                <Ionicons name="mail-outline" size={22} color={colors.text} />
                <Text style={dynamicStyles.menuItemText}>{t('global.changeEmail')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={dynamicStyles.divider} />

            <TouchableOpacity 
              style={dynamicStyles.menuItem} 
              onPress={() => {
                triggerHaptic('medium');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowCurrentPass(false);
                setShowNewPass(false);
                setShowConfirmPass(false);
                setPasswordModalVisible(true);
              }}
            >
              <View style={dynamicStyles.menuItemLeft}>
                <Ionicons name="lock-closed-outline" size={22} color={colors.text} />
                <Text style={dynamicStyles.menuItemText}>{t('global.changePassword')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={dynamicStyles.divider} />

            <TouchableOpacity 
              style={dynamicStyles.menuItem} 
              onPress={() => {
                triggerHaptic('medium');
                handleSendResetEmail();
              }}
            >
              <View style={dynamicStyles.menuItemLeft}>
                <Ionicons name="mail-unread-outline" size={22} color={colors.text} />
                <Text style={dynamicStyles.menuItemText}>{t('global.sendPasswordResetEma')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={dynamicStyles.divider} />

            <TouchableOpacity 
              style={dynamicStyles.menuItem} 
              onPress={() => {
                triggerHaptic('medium');
                Notifications.scheduleNotificationAsync({
                  content: { 
                    title: "SubMate Alert", 
                    body: "Notifications are working perfectly!" 
                  }, 
                  trigger: { 
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: 3 
                  } 
                });
                Toast.show({ type: 'success', text1: 'Notification scheduled for 3 seconds', position: 'top' });
              }}
            >
              <View style={dynamicStyles.menuItemLeft}>
                <Ionicons name="notifications-outline" size={22} color={colors.text} />
                <Text style={dynamicStyles.menuItemText}>{t('global.testNotification')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[dynamicStyles.section, { marginTop: 40 }]}>
          <Text style={[dynamicStyles.sectionTitle, { color: colors.danger }]}>{t('global.dangerZone')}</Text>
          <View style={[dynamicStyles.card, { borderColor: colors.danger, borderWidth: 1 }]}>
            <TouchableOpacity 
              style={dynamicStyles.menuItem} 
              onPress={() => {
                triggerHaptic('heavy');
                handleDeleteAccount();
              }}
            >
              <View style={dynamicStyles.menuItemLeft}>
                <Ionicons name="warning-outline" size={22} color={colors.danger} />
                <Text style={[dynamicStyles.menuItemText, { color: colors.danger, fontWeight: '600' }]}>{t('global.deleteAccount')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Change Email Modal */}
      <Modal visible={emailModalVisible} animationType="slide" transparent>
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>{t('global.changeEmail')}</Text>
            <Text style={dynamicStyles.modalSubtitle}>{t('global.enterYourNewEmailAdd')}</Text>
            
            <TextInput
              style={dynamicStyles.input}
              placeholder={t('global.newEmail')}
              placeholderTextColor={colors.textSecondary}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={dynamicStyles.modalButtons}>
              <Button 
                title="Cancel" 
                variant="secondary" 
                onPress={() => setEmailModalVisible(false)} 
                style={{ flex: 1, marginRight: 8 }}
                disabled={isLoading}
              />
              <Button 
                title="Save" 
                onPress={handleChangeEmail} 
                style={{ flex: 1, marginLeft: 8 }}
                isLoading={isLoading}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent>
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>{t('global.changePassword')}</Text>
            <Text style={dynamicStyles.modalSubtitle}>{t('global.createANewSecurePass')}</Text>
            
            <View style={dynamicStyles.passwordInputContainer}>
              <TextInput
                style={dynamicStyles.passwordInput}
                placeholder={t('global.currentPassword')}
                placeholderTextColor={colors.textSecondary}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPass}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowCurrentPass(!showCurrentPass)} style={dynamicStyles.eyeIcon}>
                <Ionicons name={showCurrentPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.passwordInputContainer}>
              <TextInput
                style={dynamicStyles.passwordInput}
                placeholder={t('global.newPassword')}
                placeholderTextColor={colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPass}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)} style={dynamicStyles.eyeIcon}>
                <Ionicons name={showNewPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[
              dynamicStyles.passwordInputContainer, 
              confirmPassword.length > 0 && newPassword !== confirmPassword ? { borderColor: colors.danger } : {}
            ]}>
              <TextInput
                style={dynamicStyles.passwordInput}
                placeholder={t('global.confirmNewPassword')}
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPass}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)} style={dynamicStyles.eyeIcon}>
                <Ionicons name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {confirmPassword.length > 0 && newPassword !== confirmPassword ? (
              <Text style={dynamicStyles.errorText}>{t('global.passwordsDoNotMatch')}</Text>
            ) : null}

            <View style={[dynamicStyles.modalButtons, { marginTop: 8 }]}>
              <Button 
                title="Cancel" 
                variant="secondary" 
                onPress={() => setPasswordModalVisible(false)} 
                style={{ flex: 1, marginRight: 8 }}
                disabled={isLoading}
              />
              <Button 
                title="Save" 
                onPress={handleChangePassword} 
                style={{ flex: 1, marginLeft: 8 }}
                isLoading={isLoading}
                disabled={isLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Re-Authentication Modal */}
      <Modal visible={reauthModalVisible} animationType="fade" transparent>
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>{t('global.verifyIdentity')}</Text>
            <Text style={dynamicStyles.modalSubtitle}>{t('global.thisIsASensitiveActi')}</Text>
            
            <TextInput
              style={dynamicStyles.input}
              placeholder={t('global.currentPassword')}
              placeholderTextColor={colors.textSecondary}
              value={reauthPassword}
              onChangeText={setReauthPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={dynamicStyles.modalButtons}>
              <Button 
                title="Cancel" 
                variant="secondary" 
                onPress={() => {
                  setReauthModalVisible(false);
                  setPendingAction(null);
                }} 
                style={{ flex: 1, marginRight: 8 }}
                disabled={isLoading}
              />
              <Button 
                title="Verify & Continue" 
                onPress={handleReauthSubmit} 
                style={{ flex: 1, marginLeft: 8 }}
                isLoading={isLoading}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={isDeleteModalVisible} animationType="fade" transparent>
        <View style={dynamicStyles.modalOverlay}>
          <View style={[dynamicStyles.modalContent, { borderColor: colors.danger, borderWidth: 1 }]}>
            <Text style={[dynamicStyles.modalTitle, { color: colors.danger }]}>{t('settings.deleteAccount')}</Text>
            <Text style={dynamicStyles.modalSubtitle}>
              {t('settings.deleteWarning')}
            </Text>
            
            <TextInput
              style={dynamicStyles.input}
              placeholder={t('global.enterYourPassword')}
              placeholderTextColor={colors.textSecondary}
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={dynamicStyles.modalButtons}>
              <Button 
                title={t('settings.cancel')} 
                variant="secondary" 
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeletePassword('');
                }} 
                style={{ flex: 1, marginRight: 8 }}
                disabled={isLoading}
              />
              <Button 
                title={t('settings.permanentlyDelete')} 
                onPress={confirmAndDelete} 
                style={{ flex: 1, marginLeft: 8, backgroundColor: colors.danger }}
                isLoading={isLoading}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Picker Modal */}
      <Modal visible={languageModalVisible} animationType="slide" transparent>
        <View style={dynamicStyles.modalOverlay}>
          <View style={[dynamicStyles.modalContent, { paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={dynamicStyles.modalTitle}>{t('settings.language')}</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {AVAILABLE_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[dynamicStyles.menuItem, { paddingHorizontal: 0, borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  onPress={() => changeLanguage(lang.code)}
                >
                  <Text style={[dynamicStyles.menuItemText, { marginLeft: 0, color: i18n.language === lang.code ? colors.primary : colors.text }]}>
                    {lang.label}
                  </Text>
                  {i18n.language === lang.code && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  copyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 24,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  eyeIcon: {
    padding: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
