import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { convertCurrency, SUPPORTED_CURRENCIES } from '@/utils/currency';

interface Props {
  subscription: Subscription;
  onTrackUsage: () => void;
}

export function UsageTrackerCard({ subscription, onTrackUsage }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency)?.symbol || baseCurrency;

  const usageCount = subscription.usageScore || 0;
  const convertedAmount = convertCurrency(subscription.amount, subscription.currency || 'USD', baseCurrency);
  const costPerUse = usageCount > 0 ? convertedAmount / usageCount : convertedAmount;

  const getUsageBadge = () => {
    if (usageCount >= 10) {
      return { label: '🔥 High Value', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
    }
    if (usageCount >= 3) {
      return { label: '⚖️ Moderate Use', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
    }
    if (usageCount > 0) {
      return { label: '⚠️ Low Usage', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
    }
    return { label: '💤 Not Logged Yet', color: colors.textSecondary, bg: colors.border };
  };

  const badge = getUsageBadge();

  const handlePressLog = () => {
    triggerHaptic('impactLight');
    onTrackUsage();
  };

  const formattedLastUsed = subscription.lastUsedDate
    ? new Date(subscription.lastUsedDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Title & Badge Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.iconCircle}>
            <Ionicons name="analytics" size={18} color="#10B981" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Usage Tracker</Text>
        </View>

        <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Times Logged</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>{usageCount}</Text>
        </View>

        <View style={[styles.metricBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Cost Per Use</Text>
          <Text style={[styles.metricValue, { color: '#10B981' }]}>
            {currencySymbol}{costPerUse.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Log Button */}
      <TouchableOpacity
        onPress={handlePressLog}
        activeOpacity={0.8}
        style={styles.logButton}
      >
        <Ionicons name="flash" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.logButtonText}>I Used This Today (+1)</Text>
      </TouchableOpacity>

      {/* Last Logged Subtext */}
      {formattedLastUsed && (
        <Text style={[styles.lastLoggedText, { color: colors.textSecondary }]}>
          Last logged: {formattedLastUsed}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  logButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  lastLoggedText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
});

