import React, { useState } from 'react';
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
  Pressable,
  useWindowDimensions,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { triggerHaptic } from '@/utils/haptics';
import { AuthService } from '@/services/firebase/auth';
import { auth } from '@/services/firebase/config';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/context/LanguageContext';
import { getUserFacingError } from '@/utils/userFacingError';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const dynamicStyles = React.useMemo(() => getStyles(colors, isCompact), [colors, isCompact]);
  const modalBottomPadding = Math.max(28, insets.bottom + 20);

  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Modal States
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const { t, currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const errorTitle = isTurkish ? 'İşlem tamamlanamadı' : 'Could not complete action';

  // Form States
  const [newEmail, setNewEmail] = useState('');
  const [currentEmailPassword, setCurrentEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      Alert.alert(isTurkish ? 'Geçersiz e-posta' : 'Invalid email', isTurkish ? 'Geçerli bir e-posta adresi girin.' : 'Enter a valid email address.');
      return;
    }
    if (!currentEmailPassword) {
      Alert.alert(isTurkish ? 'Şifre gerekli' : 'Password required', isTurkish ? 'E-posta değişikliği için mevcut şifreni gir.' : 'Enter your current password to change your email.');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.reauthenticate(currentEmailPassword);
      await AuthService.updateEmailAddress(newEmail);
      Alert.alert(
        isTurkish ? 'Doğrulama bağlantısı gönderildi' : 'Verification link sent',
        isTurkish
          ? `${newEmail} adresine bir doğrulama bağlantısı gönderdik. Bağlantıyı açtığında e-posta adresin değiştirilecek.`
          : `We sent a verification link to ${newEmail}. Your email address will change after you open the link.`,
      );
      setEmailModalVisible(false);
      setNewEmail('');
      setCurrentEmailPassword('');
    } catch (error: unknown) {
      Alert.alert(errorTitle, getUserFacingError(error, isTurkish, {
        tr: 'E-posta doğrulama bağlantısı gönderilemedi.',
        en: 'The email verification link could not be sent.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert(errorTitle, isTurkish ? 'Mevcut şifreni gir.' : 'Enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert(isTurkish ? 'Geçersiz şifre' : 'Invalid password', isTurkish ? 'Yeni şifre en az 6 karakter olmalıdır.' : 'The new password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(errorTitle, isTurkish ? 'Yeni şifreler birbiriyle eşleşmiyor.' : 'The new passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.reauthenticate(currentPassword);
      await AuthService.updateUserPassword(newPassword);

      Alert.alert(isTurkish ? 'Şifre güncellendi' : 'Password updated', isTurkish ? 'Yeni şifren artık kullanılabilir.' : 'Your new password is ready to use.');
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      Alert.alert(errorTitle, getUserFacingError(error, isTurkish, {
        tr: 'Şifre güncellenemedi.',
        en: 'The password could not be updated.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordResetLink = async () => {
    const email = user?.email || auth.currentUser?.email;
    if (!email) {
      Alert.alert(
        isTurkish ? 'E-posta bulunamadı' : 'Email not found',
        isTurkish ? 'Şifre sıfırlama bağlantısı için hesabına bağlı bir e-posta gerekli.' : 'An email address is required to send a password reset link.',
      );
      return;
    }

    setIsResettingPassword(true);
    try {
      await AuthService.sendPasswordResetEmail(email);
      Alert.alert(
        isTurkish ? 'Bağlantı gönderildi' : 'Link sent',
        isTurkish
          ? `${email} adresine şifre sıfırlama bağlantısı gönderdik. Gelen kutunu ve spam klasörünü kontrol et.`
          : `We sent a password reset link to ${email}. Check your inbox and spam folder.`,
      );
    } catch (error: unknown) {
      Alert.alert(
        errorTitle,
        getUserFacingError(error, isTurkish, {
          tr: 'Şifre sıfırlama bağlantısı gönderilemedi.',
          en: 'The password reset link could not be sent.',
        }),
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleForgotPassword = () => {
    const email = user?.email || auth.currentUser?.email || '';
    const title = isTurkish ? 'Şifreni mi unuttun?' : 'Forgot your password?';
    const message = isTurkish
      ? `${email} adresine şifreni yenileyebileceğin güvenli bir bağlantı göndereceğiz.`
      : `We will send a secure password reset link to ${email}.`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(message)) {
        void sendPasswordResetLink();
      }
      return;
    }

    Alert.alert(
      title,
      message,
      [
        { text: isTurkish ? 'Vazgeç' : 'Cancel', style: 'cancel' },
        {
          text: isTurkish ? 'Bağlantı gönder' : 'Send link',
          onPress: () => void sendPasswordResetLink(),
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    setDeletePassword('');
    setDeleteModalVisible(true);
  };

  const confirmAndDelete = async () => {
    if (!deletePassword) {
      Alert.alert(errorTitle, isTurkish ? 'Hesabı silmek için mevcut şifreni gir.' : 'Enter your current password to delete the account.');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.reauthenticate(deletePassword);
      await AuthService.deleteAccount();
    } catch (error: unknown) {
      Alert.alert(errorTitle, getUserFacingError(error, isTurkish, {
        tr: 'Hesap silinemedi.',
        en: 'The account could not be deleted.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = user?.displayName || auth.currentUser?.displayName || (isTurkish ? 'SubMate kullanıcısı' : 'SubMate user');
  const initials = displayName.trim().charAt(0).toUpperCase() || 'S';

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header Bar */}
      <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => router.replace('/(tabs)/settings')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={[dynamicStyles.headerTitle, { color: colors.text }]}>{t.accountSettings?.title || 'Account Settings'}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={dynamicStyles.content} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#5D43E9', '#347BED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dynamicStyles.accountHero}>
          <View style={dynamicStyles.avatar}>
            <Text style={dynamicStyles.avatarText}>{initials}</Text>
          </View>
          <View style={dynamicStyles.heroCopy}>
            <Text numberOfLines={1} style={dynamicStyles.heroName}>{displayName}</Text>
            <Text numberOfLines={1} style={dynamicStyles.heroEmail}>{user?.email || auth.currentUser?.email || '—'}</Text>
            <View style={dynamicStyles.heroStatus}>
              <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
              <Text style={dynamicStyles.heroStatusText}>{isTurkish ? 'Hesabın güvende' : 'Your account is protected'}</Text>
            </View>
          </View>
          <Ionicons name="sparkles" size={54} color="rgba(255,255,255,0.12)" style={dynamicStyles.heroDecoration} />
        </LinearGradient>

        {/* Personal Info */}
        <Text style={[dynamicStyles.sectionTitle, { color: colors.textSecondary }]}>{isTurkish ? 'HESAP BİLGİLERİ' : 'ACCOUNT DETAILS'}</Text>
        <View style={[dynamicStyles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Email Row */}
          <View style={dynamicStyles.menuRow}>
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Ionicons name="mail-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>{isTurkish ? 'E-posta adresi' : 'Email address'}</Text>
            </View>
            <Text style={[dynamicStyles.menuValue, { color: colors.textSecondary }]} numberOfLines={1}>
              {user?.email || 'N/A'}
            </Text>
          </View>

        </View>

        {/* Security Section */}
        <Text style={[dynamicStyles.sectionTitle, { color: colors.textSecondary }]}>{isTurkish ? 'GÜVENLİK' : 'SECURITY'}</Text>
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

          <TouchableOpacity
            style={[dynamicStyles.menuRow, isResettingPassword && { opacity: 0.55 }]}
            activeOpacity={0.7}
            disabled={isResettingPassword}
            onPress={() => {
              triggerHaptic('medium');
              handleForgotPassword();
            }}
          >
            <View style={dynamicStyles.menuRowLeft}>
              <View style={[dynamicStyles.menuIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.14)' }]}>
                <Ionicons name="key-outline" size={18} color="#8B5CF6" />
              </View>
              <Text style={[dynamicStyles.menuLabel, { color: colors.text }]}>{isTurkish ? 'Şifremi unuttum' : 'Forgot password'}</Text>
            </View>
            {isResettingPassword ? (
              <Ionicons name="hourglass-outline" size={18} color={colors.textSecondary} />
            ) : (
              <Ionicons name="paper-plane-outline" size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

        </View>

        {/* Danger Zone */}
        <Text style={[dynamicStyles.sectionTitle, { color: '#EF4444', marginTop: 16 }]}>{isTurkish ? 'TEHLİKELİ İŞLEMLER' : 'DANGER ZONE'}</Text>
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
      <Modal visible={emailModalVisible} animationType="fade" transparent onRequestClose={() => setEmailModalVisible(false)}>
        <KeyboardAvoidingView
          style={dynamicStyles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={dynamicStyles.modalDismissArea} onPress={() => { Keyboard.dismiss(); setEmailModalVisible(false); }} />
          <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: modalBottomPadding }]}>
            <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>{(t.accountSettings as any)?.changeEmail || 'Change Email'}</Text>
            <Text style={[dynamicStyles.modalSubtitle, { color: colors.textSecondary }]}>
              {isTurkish ? 'Güvenlik için yeni e-posta adresini ve mevcut şifreni doğrula.' : 'Confirm your new email and current password for security.'}
            </Text>

            <TextInput
              style={[dynamicStyles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder={(t.accountSettings as any)?.newEmailPlaceholder || 'New Email Address'}
              placeholderTextColor={colors.textSecondary}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[dynamicStyles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder={isTurkish ? 'Mevcut şifre' : 'Current password'}
              placeholderTextColor={colors.textSecondary}
              value={currentEmailPassword}
              onChangeText={setCurrentEmailPassword}
              secureTextEntry
            />

            <View style={dynamicStyles.modalButtons}>
              <Button title={t.common?.cancel || 'Cancel'} variant="secondary" onPress={() => setEmailModalVisible(false)} style={dynamicStyles.modalButton} />
              <Button title={(t.global as any)?.saveChanges || 'Save'} onPress={handleChangeEmail} style={dynamicStyles.modalButton} isLoading={isLoading} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} animationType="fade" transparent onRequestClose={() => setPasswordModalVisible(false)}>
        <KeyboardAvoidingView
          style={dynamicStyles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={dynamicStyles.modalDismissArea} onPress={() => { Keyboard.dismiss(); setPasswordModalVisible(false); }} />
          <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: modalBottomPadding }]}>
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
              <Button title={t.common?.cancel || 'Cancel'} variant="secondary" onPress={() => setPasswordModalVisible(false)} style={dynamicStyles.modalButton} />
              <Button title={(t.global as any)?.update || 'Update'} onPress={handleChangePassword} style={dynamicStyles.modalButton} isLoading={isLoading} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={isDeleteModalVisible} animationType="fade" transparent onRequestClose={() => setDeleteModalVisible(false)}>
        <KeyboardAvoidingView
          style={dynamicStyles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={dynamicStyles.modalDismissArea} onPress={() => { Keyboard.dismiss(); setDeleteModalVisible(false); }} />
          <View style={[dynamicStyles.modalContent, { backgroundColor: colors.surface, borderColor: '#EF4444', paddingBottom: modalBottomPadding }]}>
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
              <Button title={t.common?.cancel || 'Cancel'} variant="secondary" onPress={() => setDeleteModalVisible(false)} style={dynamicStyles.modalButton} />
              <Button title={(t.accountSettings as any)?.permanentlyDelete || 'Permanently Delete'} onPress={confirmAndDelete} style={[dynamicStyles.modalButton, { backgroundColor: '#EF4444' }]} isLoading={isLoading} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isCompact: boolean) =>
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
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '800',
      flex: 1,
      minWidth: 0,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: isCompact ? 14 : 20,
      paddingTop: 18,
    },
    accountHero: {
      minHeight: 142,
      borderRadius: 25,
      padding: isCompact ? 16 : 20,
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: 24,
    },
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.20)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.34)',
      marginRight: 14,
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 27,
      fontWeight: '800',
    },
    heroCopy: {
      flex: 1,
      minWidth: 0,
    },
    heroName: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '800',
    },
    heroEmail: {
      color: 'rgba(255,255,255,0.76)',
      fontSize: 12.5,
      marginTop: 4,
    },
    heroStatus: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 9,
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginTop: 11,
    },
    heroStatusText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
    },
    heroDecoration: {
      position: 'absolute',
      top: -8,
      right: -9,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginBottom: 8,
      marginLeft: 4,
      marginTop: 4,
    },
    cardGroup: {
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
    },
    menuValue: {
      fontSize: 13,
      fontWeight: '600',
      maxWidth: '46%',
      flexShrink: 1,
      textAlign: 'right',
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
      borderRadius: 26,
      padding: 22,
      paddingBottom: 28,
      borderWidth: 1,
      maxHeight: '92%',
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
      flexDirection: isCompact ? 'column' : 'row',
      marginTop: 8,
      gap: 10,
    },
    modalButton: {
      flex: isCompact ? 0 : 1,
      width: isCompact ? '100%' : undefined,
    },
  });
