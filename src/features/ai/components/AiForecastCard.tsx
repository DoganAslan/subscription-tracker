import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { calculateAiCashFlowForecast } from '@/services/ai/aiForecast';

interface Props {
  subscriptions: Subscription[];
  baseCurrency: string;
}

export function AiForecastCard({ subscriptions, baseCurrency }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  const forecast = useMemo(() => {
    return calculateAiCashFlowForecast(subscriptions, baseCurrency, isTurkish);
  }, [subscriptions, baseCurrency, isTurkish]);

  if (!subscriptions || subscriptions.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)', flexShrink: 0 }]}>
            <Ionicons name="trending-up-outline" size={18} color="#3B82F6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>
              {isTurkish ? '🔮 YZ Gelecek Harcama Tahminleyicisi' : '🔮 AI Cash-Flow Forecast'}
            </Text>
            <Text numberOfLines={1} style={[styles.cardSub, { color: colors.textSecondary }]}>
              {isTurkish ? 'Önümüzdeki 3, 6 ve 12 aylık tahmini nakit çıkış projeksiyonu' : 'Projected 3, 6, and 12 month subscription outlay'}
            </Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>YZ PROJEKSİYON</Text>
        </View>
      </View>

      {/* 3 Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{isTurkish ? '3 Aylık' : '3 Months'}</Text>
          <Text style={[styles.metricVal, { color: colors.text }]}>{forecast.next3MonthsTotal} {baseCurrency}</Text>
        </View>

        <View style={[styles.metricBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.25)' }]}>
          <Text style={[styles.metricLabel, { color: '#3B82F6' }]}>{isTurkish ? '6 Aylık' : '6 Months'}</Text>
          <Text style={[styles.metricVal, { color: '#3B82F6' }]}>{forecast.next6MonthsTotal} {baseCurrency}</Text>
        </View>

        <View style={[styles.metricBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{isTurkish ? '12 Aylık' : '12 Months'}</Text>
          <Text style={[styles.metricVal, { color: colors.text }]}>{forecast.next12MonthsTotal} {baseCurrency}</Text>
        </View>
      </View>

      {/* Insights */}
      <View style={{ gap: 6, marginTop: 12 }}>
        {forecast.insights.map((text, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="sparkles-outline" size={14} color="#8B5CF6" />
            <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1 }}>{text}</Text>
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
    marginBottom: 14,
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
    fontWeight: '500',
    marginTop: 1,
  },
  badge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  badgeText: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
});
