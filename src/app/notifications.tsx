import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';
import {
  clearNotificationHistory,
  getNotificationHistory,
  markNotificationsAsRead,
  NotificationHistoryItem,
  syncPresentedNotificationsToHistory,
} from '@/services/notificationService';

const formatTimestamp = (timestamp: number, isTurkish: boolean) => {
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString(isTurkish ? 'tr-TR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (sameDay) return isTurkish ? `Bugün, ${time}` : `Today, ${time}`;

  return date.toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const [items, setItems] = useState<NotificationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHistory = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      await syncPresentedNotificationsToHistory();
      const history = await getNotificationHistory();
      setItems(history);
      await markNotificationsAsRead();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleClear = () => {
    if (items.length === 0) return;
    Alert.alert(
      isTurkish ? 'Bildirim geçmişini temizle' : 'Clear notification history',
      isTurkish
        ? 'Bu işlem yalnızca SubMate içindeki geçmişi siler. Telefonunun bildirim merkezindeki kayıtlar etkilenmez.'
        : 'This only removes the history inside SubMate. Notifications in your device notification center are not affected.',
      [
        { text: isTurkish ? 'Vazgeç' : 'Cancel', style: 'cancel' },
        {
          text: isTurkish ? 'Temizle' : 'Clear',
          style: 'destructive',
          onPress: () => {
            void clearNotificationHistory().then(() => setItems([]));
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
          onPress={() => router.back()}
          activeOpacity={0.75}
          accessibilityLabel={isTurkish ? 'Geri dön' : 'Go back'}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{isTurkish ? 'Bildirimler' : 'Notifications'}</Text>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, opacity: items.length ? 1 : 0.45 }]}
          onPress={handleClear}
          activeOpacity={0.75}
          disabled={!items.length}
          accessibilityLabel={isTurkish ? 'Geçmişi temizle' : 'Clear history'}
        >
          <Ionicons name="trash-outline" size={19} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadHistory(true)} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${colors.primary}1F` }]}>
            <Ionicons name="notifications" size={24} color={colors.primary} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              {isTurkish ? 'Bildirim geçmişin' : 'Your notification history'}
            </Text>
            <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
              {isTurkish
                ? 'Ödeme ve abonelik hatırlatıcılarını burada görürsün.'
                : 'Your payment and subscription reminders appear here.'}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="notifications-off-outline" size={30} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {isTurkish ? 'Henüz bildirim yok' : 'No notifications yet'}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              {isTurkish
                ? 'Yaklaşan ödemelerin için oluşturulan hatırlatıcılar burada görünecek.'
                : 'Reminders created for your upcoming payments will appear here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {isTurkish ? 'GEÇMİŞ BİLDİRİMLER' : 'NOTIFICATION HISTORY'}
            </Text>
            {items.map(item => (
              <View key={`${item.id}-${item.receivedAt}`} style={[styles.notificationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.notificationIcon, { backgroundColor: `${colors.primary}1A` }]}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                  {!!item.body && <Text style={[styles.notificationBody, { color: colors.textSecondary }]}>{item.body}</Text>}
                  <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{formatTimestamp(item.receivedAt, isTurkish)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.refreshRow}
          onPress={() => {
            triggerHaptic('selection');
            void loadHistory(true);
          }}
          activeOpacity={0.75}
        >
          <Ionicons name="refresh-outline" size={16} color={colors.primary} />
          <Text style={[styles.refreshText, { color: colors.primary }]}>{isTurkish ? 'Bildirimleri yenile' : 'Refresh notifications'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 68,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', flex: 1, minWidth: 0, textAlign: 'center', marginHorizontal: 10 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: { padding: 20, paddingBottom: 44 },
  hero: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  heroCopy: { flex: 1 },
  heroTitle: { fontSize: 16, fontWeight: '800' },
  heroDescription: { fontSize: 12.5, lineHeight: 18, marginTop: 4 },
  loadingState: { paddingTop: 62, alignItems: 'center' },
  emptyState: { borderRadius: 22, borderWidth: 1, paddingHorizontal: 30, paddingVertical: 40, alignItems: 'center' },
  emptyIcon: { width: 62, height: 62, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyDescription: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  list: { gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginLeft: 4, marginBottom: 2 },
  notificationCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row' },
  notificationIcon: { width: 38, height: 38, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 11 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 14, fontWeight: '800' },
  notificationBody: { fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  timestamp: { fontSize: 11, fontWeight: '600', marginTop: 7 },
  refreshRow: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 24, padding: 10 },
  refreshText: { fontSize: 13, fontWeight: '800' },
});
