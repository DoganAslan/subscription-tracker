import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { calculateAiFinancialHealthScore } from '@/services/ai/aiHealthScore';

interface Props {
  subscriptions: Subscription[];
  baseCurrency: string;
}

export function AiHealthScoreCard({ subscriptions, baseCurrency }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  const health = useMemo(() => {
    return calculateAiFinancialHealthScore(subscriptions, baseCurrency, isTurkish);
  }, [subscriptions, baseCurrency, isTurkish]);

  if (!subscriptions || subscriptions.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)', flexShrink: 0 }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>
              {isTurkish ? '🎯 YZ Finansal Sağlık Skoru' : '🎯 AI Financial Health Score'}
            </Text>
            <Text numberOfLines={1} style={[styles.cardSub, { color: colors.textSecondary }]}>
              {health.statusTitle}
            </Text>
          </View>
        </View>

        <View style={[styles.scoreBadge, { backgroundColor: health.statusColor + '20' }]}>
          <Text style={[styles.scoreBadgeText, { color: health.statusColor }]}>{health.score} / 100 ({health.grade})</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${health.score}%`, backgroundColor: health.statusColor }]} />
      </View>

      {/* Top Advice List */}
      <View style={{ gap: 6, marginTop: 12 }}>
        {health.topAdvice.map((advice, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="checkmark-circle-outline" size={14} color={health.statusColor} />
            <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1 }}>{advice}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    overflow: 'hidden',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  scoreBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
