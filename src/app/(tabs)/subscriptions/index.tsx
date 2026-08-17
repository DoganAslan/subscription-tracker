import { View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SubscriptionList } from '@/features/subscriptions/components/SubscriptionList';
import { Header } from '@/components/common/Header';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/utils/haptics';

export default function SubscriptionListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, Platform.OS === 'web' ? 16 : 12);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop }]}>
      <View style={styles.headerRow}>
        <Header title={t.subscriptionsPage?.title || 'My Subscriptions'} />
      </View>

      <SubscriptionList />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => {
          triggerHaptic('impactLight');
          router.push('/(tabs)/subscriptions/add');
        }}
        activeOpacity={0.85}
        style={[styles.fabButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  fabButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },
});

