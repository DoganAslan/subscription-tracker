import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';
import { useRouter } from 'expo-router';
import { exportVaultBackup } from '@/utils/vault';
import { exportCsvReport } from '@/utils/reportExporter';
import { Subscription } from '@/services/firebase/types';

interface ProfileDrawerModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  userEmail?: string;
  userPhoto?: string;
  subscriptions: Subscription[];
  onOpenWrapped: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

export function ProfileDrawerModal({
  visible,
  onClose,
  userName,
  userEmail,
  userPhoto,
  subscriptions,
  onOpenWrapped,
}: ProfileDrawerModalProps) {
  const { colors, isDark, setThemeMode } = useTheme();
  const { currentLanguage, changeLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const router = useRouter();

  if (!visible) return null;

  const handleLanguageToggle = () => {
    triggerHaptic('selection');
    const nextLang = isTurkish ? 'en' : 'tr';
    changeLanguage(nextLang);
  };

  const handleThemeToggle = () => {
    triggerHaptic('selection');
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const handleExportBackup = async () => {
    triggerHaptic('impactLight');
    await exportVaultBackup();
  };

  const handleExportReport = async () => {
    triggerHaptic('impactLight');
    await exportCsvReport(subscriptions.map(subscription => ({
      name: subscription.name,
      category: subscription.category,
      amount: subscription.amount,
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      status: subscription.status ?? 'active',
      notes: subscription.notes,
    })));
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlayContainer}>
        {/* Backdrop overlay */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Drawer Content */}
        <View
          style={[
            styles.drawerPanel,
            {
              width: DRAWER_WIDTH,
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* 1. USER PROFILE CARD */}
            <View style={[styles.profileCard, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <View style={styles.avatarWrapper}>
                {userPhoto ? (
                  <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{(userName || 'U').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.userNameText, { color: colors.text }]} numberOfLines={1}>
                    {userName || (isTurkish ? 'SubMate kullanıcısı' : 'SubMate user')}
                  </Text>
                </View>
                {!!userEmail && (
                  <Text style={[styles.userEmailText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {userEmail}
                  </Text>
                )}
              </View>
            </View>

            {/* 2. FAST CONTROLS TOGGLES */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {isTurkish ? 'Hızlı ayarlar' : 'Quick settings'}
            </Text>

            <View style={[styles.toggleRow, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <TouchableOpacity style={styles.toggleItem} onPress={handleThemeToggle} activeOpacity={0.7}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? '#F59E0B' : '#3B82F6'} />
                <Text style={[styles.toggleText, { color: colors.text }]}>
                  {isDark ? (isTurkish ? 'Karanlık Mod' : 'Dark Mode') : (isTurkish ? 'Aydınlık Mod' : 'Light Mode')}
                </Text>
              </TouchableOpacity>

              <View style={styles.toggleDivider} />

              <TouchableOpacity style={styles.toggleItem} onPress={handleLanguageToggle} activeOpacity={0.7}>
                <Ionicons name="language" size={18} color="#10B981" />
                <Text style={[styles.toggleText, { color: colors.text }]}>
                  {isTurkish ? '🇹🇷 Türkçe' : '🇬🇧 English'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. USEFUL SHORTCUT */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {isTurkish ? 'Kısayol' : 'Shortcut'}
            </Text>

            <View style={styles.menuList}>
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                onPress={() => {
                  onClose();
                  onOpenWrapped();
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <Ionicons name="sparkles" size={18} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>
                    {isTurkish ? 'Yıllık özet' : 'Yearly summary'}
                  </Text>
                  <Text style={[styles.menuSub, { color: colors.textSecondary }]}>
                    {isTurkish ? 'Yıllık abonelik görünümün' : 'Your yearly subscription overview'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

            </View>

            {/* 4. BACKUP & EXPORTS */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {isTurkish ? 'Yedekleme ve raporlar' : 'Backups & reports'}
            </Text>

            <View style={styles.menuList}>
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                onPress={handleExportBackup}
                activeOpacity={0.8}
              >
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                  <Ionicons name="cloud-download-outline" size={18} color="#06B6D4" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>
                    {isTurkish ? 'Yedeği indir (JSON)' : 'Download backup (JSON)'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                onPress={handleExportReport}
                activeOpacity={0.8}
              >
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                  <Ionicons name="document-text-outline" size={18} color="#EC4899" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>
                    {isTurkish ? 'Harcama raporunu indir (CSV)' : 'Download spending report (CSV)'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* 5. SETTINGS NAVIGATION LINK */}
            <View style={{ marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.settingsBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  onClose();
                  router.push('/(tabs)/settings');
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
                <Text style={styles.settingsBtnText}>
                  {isTurkish ? 'Ayarlar ve profil' : 'Settings & profile'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  drawerPanel: {
    height: '100%',
    borderRightWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  proBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#8B5CF6',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '800',
  },
  userEmailText: {
    fontSize: 11,
    marginTop: 1,
  },
  tierPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  tierPillText: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 6,
    marginBottom: 8,
  },
  toggleItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  menuSub: {
    fontSize: 10,
    marginTop: 1,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  settingsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
