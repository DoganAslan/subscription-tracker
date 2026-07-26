import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { triggerHaptic } from '@/utils/haptics';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { AuthService } from '@/services/firebase/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/context/LanguageContext';
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
  const { t, currentLanguage } = useTranslation();

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
      Alert.alert(t.global?.error || 'Error', error.message || 'An unexpected error occurred.');
    }
  };

  const executePendingAction = async () => {
    if (!pendingAction) return;

    if (pendingAction === 'email') {
      await AuthService.updateEmailAddress(newEmail);
      Alert.alert(t.global?.success || 'Success', 'Email address updated successfully.');
      setEmailModalVisible(false);
    } else if (pendingAction === 'password') {
      await AuthService.updateUserPassword(newPassword);
      Alert.alert(t.global?.success || 'Success', 'Password updated successfully.');
      setPasswordModalVisible(false);
    } else if (pendingAction === 'delete') {
      await AuthService.deleteAccount();
    }
    setPendingAction(null);
    setReauthModalVisible(false);
  };

  const handleReauthSubmit = async () => {
    if (!reauthPassword) {
      Alert.alert(t.global?.error || 'Error', 'Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.reauthenticate(reauthPassword);
      await executePendingAction();
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert(t.global?.error || 'Error', 'The password you entered is incorrect.');
      } else {
        Alert.alert(t.global?.error || 'Error', error.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      Alert.alert(t.global?.invalidEmail || 'Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.updateEmailAddress(newEmail);
      Alert.alert(t.global?.success || 'Success', 'Email updated successfully.');
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
      Alert.alert(t.global?.error || 'Error', 'Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert(t.global?.invalidPassword || 'Invalid Password', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t.global?.error || 'Error', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.reauthenticate(currentPassword);
      await AuthService.updateUserPassword(newPassword);

      Alert.alert(t.global?.success || 'Success', 'Password updated successfully.');
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert(t.global?.error || 'Error', 'Current password is incorrect.');
      } else {
        Alert.alert(t.global?.error || 'Error', error.message || 'Failed to update password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;

    if (!currentUser || !currentUser.email) {
      Alert.alert(t.global?.error || 'Error', 'No authenticated user email found.');
      return;
    }

    const executeReset = async () => {
      try {
        setIsLoading(true);
        await sendPasswordResetEmail(authInstance, currentUser.email!);
        Alert.alert(t.global?.success || 'Success', 'Password reset email sent. Please check your inbox.');
      } catch (error: any) {
        Alert.alert(t.global?.error || 'Error', error.message || 'Failed to send reset email.');
      } finally {
        setIsLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Send a password reset link to ${currentUser.email}?`)) {
        await executeReset();
      }
    } else {
      Alert.alert('Reset Password', `Send password reset link to ${currentUser.email}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: executeReset },
      ]);
    }
  };

  const handleDeleteAccount = () => {
    setDeletePassword('');
    setDeleteModalVisible(true);
  };

  const confirmAndDelete = async () => {
    if (!deletePassword) {
      Alert.alert(t.global?.error || 'Error', 'Password is required to delete account.');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.reauthenticate(deletePassword);
      await AuthService.deleteAccount();
    } catch (error: any) {
      Alert.alert(t.global?.error || 'Error', error.message || 'Failed to delete account.');
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
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header Bar */}
      <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => router.replace('/(tabs)/settings')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>{t.accountSettings?.title || 'Account Settings'}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={dynamicStyles.content} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Personal Info */}
        <Text style={[dynamicStyles.sectionTitle, { color: colors.textSecondary }]}>{(t.accountSettings?.personalInfo || 'PERSONAL INFORMATION').toUpperCase()}</Text>
        <View style={[dynamicStyles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Email Row */}
          <View style={dynamicStyles.menuRow}>
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Ionicons name="mail-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>{t.accountSettings?.emailLabel || 'Email Address'}</Text>
            </View>
            <Text style={[dynamicStyles.menuValue, { color: colors.textSecondary }]} numberOfLines={1}>
              {user?.email || 'N/A'}
            </Text>
          </View>

          <View style={[dynamicStyles.divider, { backgroundColor: colors.border }]} />

          {/* Account ID Row */}
          <View style={dynamicStyles.menuRow}>
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="key-outline" size={18} color="#10B981" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>{(t.accountSettings as any)?.accountId || 'Account ID'}</Text>
            </View>

            {isIdVisible ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={dynamicStyles.copyContainer} onPress={handleCopyId} activeOpacity={0.7}>
                  <Text style={[dynamicStyles.menuValue, { color: colors.text, maxWidth: 110 }]} numberOfLines={1} ellipsizeMode="middle">
                    {user?.uid}
                  </Text>
                  <Ionicons name="copy-outline" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsIdVisible(false)} style={{ marginLeft: 8 }}>
                  <Ionicons name="eye-off-outline" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  setIsIdVisible(true);
                }}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="eye-outline" size={16} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>Reveal ID</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[dynamicStyles.divider, { backgroundColor: colors.border }]} />

          {/* Language Row */}
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.7}
            onPress={() => router.replace('/(tabs)/settings')}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                <Ionicons name="language-outline" size={18} color="#8B5CF6" />
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
        </View>

        {/* Security Section */}
        <Text style={[dynamicStyles.sectionTitle, { color: colors.textSecondary }]}>GÜVENLİK</Text>
        <View style={[dynamicStyles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Change Email */}
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('medium');
              setNewEmail('');
              setEmailModalVisible(true);
            }}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Ionicons name="at-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>{(t.accountSettings as any)?.changeEmail || 'Change Email'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[dynamicStyles.divider, { backgroundColor: colors.border }]} />

          {/* Change Password */}
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('medium');
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setPasswordModalVisible(true);
            }}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>{(t.accountSettings as any)?.changePassword || 'Change Password'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[dynamicStyles.divider, { backgroundColor: colors.border }]} />

          {/* Send Password Reset Email */}
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('medium');
              handleSendResetEmail();
            }}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="paper-plane-outline" size={18} color="#10B981" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>{(t.accountSettings as any)?.sendResetEmail || 'Send Password Reset Email'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <Text style={[dynamicStyles.sectionTitle, { color: '#EF4444', marginTop: 16 }]}>{(t.accountSettings as any)?.dangerZone || 'DANGER ZONE'}</Text>
        <View style={[dynamicStyles.cardGroup, { backgroundColor: colors.surface, borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
          <TouchableOpacity
            style={dynamicStyles.menuRow}
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic('heavy');
              handleDeleteAccount();
            }}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: '#EF4444', fontWeight: '800' }]}>{(t.accountSettings as any)?.deleteAccount || 'Delete Account'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Email Modal */}
      <Modal visible={emailModalVisible} animationType="fade" transparent>
        <View style={dynamicStyles.modalOverlay}>
          <Pressable style={dynamicStyles.modalDismissArea} onPress={() => setEmailModalVisible(false)} />
          <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>{(t.accountSettings as any)?.changeEmail || 'Change Email'}</Text>
            <Text style={[dynamicStyles.modalSubtitle, { color: colors.textSecondary }]}>{(t.accountSettings as any)?.enterNewEmail || 'Enter your new email address.'}</Text>

            <TextInput
              style={[dynamicStyles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder={(t.accountSettings as any)?.newEmailPlaceholder || 'New Email Address'}
              placeholderTextColor={colors.textSecondary}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={dynamicStyles.modalButtons}>
              <Button title={t.common?.cancel || 'Cancel'} variant="secondary" onPress={() => setEmailModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title={(t.global as any)?.saveChanges || 'Save'} onPress={handleChangeEmail} style={{ flex: 1, marginLeft: 8 }} isLoading={isLoading} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} animationType="fade" transparent>
        <View style={dynamicStyles.modalOverlay}>
          <Pressable style={dynamicStyles.modalDismissArea} onPress={() => setPasswordModalVisible(false)} />
          <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>{(t.accountSettings as any)?.changePassword || 'Change Password'}</Text>
            <Text style={[dynamicStyles.modalSubtitle, { color: colors.textSecondary }]}>{(t.accountSettings as any)?.enterCurrentAndNewPassword || 'Enter your current and new password.'}</Text>

            <TextInput
              style={[dynamicStyles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder={(t.accountSettings as any)?.currentPasswordPlaceholder || 'Current Password'}
              placeholderTextColor={colors.textSecondary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <TextInput
              style={[dynamicStyles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder={(t.accountSettings as any)?.newPasswordPlaceholder || 'New Password'}
              placeholderTextColor={colors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <TextInput
              style={[dynamicStyles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder={(t.accountSettings as any)?.confirmPasswordPlaceholder || 'Confirm New Password'}
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <View style={dynamicStyles.modalButtons}>
              <Button title={t.common?.cancel || 'Cancel'} variant="secondary" onPress={() => setPasswordModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title={(t.global as any)?.update || 'Update'} onPress={handleChangePassword} style={{ flex: 1, marginLeft: 8 }} isLoading={isLoading} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={isDeleteModalVisible} animationType="fade" transparent>
        <View style={dynamicStyles.modalOverlay}>
          <Pressable style={dynamicStyles.modalDismissArea} onPress={() => setDeleteModalVisible(false)} />
          <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: '#EF4444' }]}>
            <Text style={[dynamicStyles.modalTitle, { color: '#EF4444' }]}>{(t.accountSettings as any)?.deleteAccountPermanently || 'Permanently Delete Account'}</Text>
            <Text style={[dynamicStyles.modalSubtitle, { color: colors.textSecondary }]}>
              {(t.accountSettings as any)?.deleteAccountWarning || 'This action cannot be undone. Enter current password to confirm.'}
            </Text>

            <TextInput
              style={[dynamicStyles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder={(t.accountSettings as any)?.currentPasswordPlaceholder || 'Current Password'}
              placeholderTextColor={colors.textSecondary}
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
            />

            <View style={dynamicStyles.modalButtons}>
              <Button title={t.common?.cancel || 'Cancel'} variant="secondary" onPress={() => setDeleteModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title={(t.accountSettings as any)?.permanentlyDelete || 'Permanently Delete'} onPress={confirmAndDelete} style={{ flex: 1, marginLeft: 8, backgroundColor: '#EF4444' }} isLoading={isLoading} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginBottom: 8,
      marginLeft: 4,
      marginTop: 12,
    },
    cardGroup: {
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
    copyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
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
      borderWidth: 1,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 6,
    },
    modalSubtitle: {
      fontSize: 13,
      marginBottom: 16,
    },
    input: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 14,
      fontSize: 15,
      marginBottom: 16,
    },
    modalButtons: {
      flexDirection: 'row',
      marginTop: 8,
    },
  });

