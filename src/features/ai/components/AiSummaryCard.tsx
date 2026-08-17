import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { Subscription } from '@/services/firebase/types';
import { triggerHaptic } from '@/utils/haptics';

interface Props {
  subscriptions: Subscription[];
  onPress: () => void;
}

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;

  if (value && typeof value === 'object' && 'toDate' in value) {
    const toDateValue = (value as { toDate?: unknown }).toDate;
    if (typeof toDateValue === 'function') return toDateValue.call(value);
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

export function AiSummaryCard({ subscriptions, onPress }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  const insight = useMemo(() => {
    const now = Date.now();
    const urgentTrial = subscriptions.find((sub) => {
      if (!sub.isTrial) return false;
      const endDate = toDate(sub.trialEndDate);
      const hoursLeft = endDate ? (endDate.getTime() - now) / 3_600_000 : Infinity;
      return hoursLeft >= 0 && hoursLeft <= 72;
    });

    if (urgentTrial) {
      return isTurkish
        ? `${urgentTrial.name} denemesi yakında bitiyor. Yenilenmeden önce birlikte değerlendirelim.`
        : `${urgentTrial.name}'s trial ends soon. Let's review it before it renews.`;
    }

    const inactive = subscriptions.find((sub) => {
      const lastUsed = toDate(sub.lastUsedDate);
      return lastUsed && now - lastUsed.getTime() > 30 * 86_400_000;
    });

    if (inactive) {
      return isTurkish
        ? `${inactive.name} son 30 gündür kullanılmamış görünüyor. Duraklatmak mantıklı olabilir.`
        : `${inactive.name} has not been used in 30 days. Pausing it may make sense.`;
    }

    const activeCount = subscriptions.filter((sub) => sub.status !== 'paused').length;
    return isTurkish
      ? `${activeCount} aktif aboneliğini kontrol altında tutuyorsun. Tasarruf fırsatlarını birlikte bulalım.`
      : `You have ${activeCount} active subscriptions. Let's look for savings opportunities.`;
  }, [isTurkish, subscriptions]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        triggerHaptic('impactLight');
        onPress();
      }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <Ionicons name="sparkles" size={18} color="#8B5CF6" />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>SubMate AI</Text>
            <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>
              {isTurkish ? 'GÜNLÜK FİNANS ÖZETİ' : 'DAILY FINANCE SUMMARY'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#8B5CF6" />
      </View>

      <Text style={[styles.insight, { color: colors.text }]}>{insight}</Text>

      <View style={styles.actionRow}>
        <Text style={styles.actionText}>{isTurkish ? 'AI ile incele' : 'Review with AI'}</Text>
        <Ionicons name="arrow-forward" size={14} color="#8B5CF6" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(139, 92, 246, 0.10)',
    borderColor: 'rgba(139, 92, 246, 0.28)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  iconBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  title: { fontSize: 15, fontWeight: '800' },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 1 },
  insight: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  actionRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  actionText: { color: '#8B5CF6', fontSize: 13, fontWeight: '800' },
});
