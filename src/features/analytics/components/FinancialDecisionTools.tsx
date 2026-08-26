import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/context/ThemeContext';
import { getSubscriptionMonthlyNetCost } from '@/features/analytics/utils/financialAnalytics';
import { Subscription } from '@/services/firebase/types';
import { triggerHaptic } from '@/utils/haptics';

type UsageFrequency = NonNullable<Subscription['usageFrequency']>;
type UsageState = 'attention' | 'healthy' | 'unknown';

interface Props {
  subscriptions: Subscription[];
  baseCurrency: string;
  isTurkish: boolean;
  formatMoney: (value: number) => string;
  updatingId: string | null;
  onOpenSubscription: (id: string) => void;
  onLogUsage: (subscription: Subscription) => void;
  onSetFrequency: (subscription: Subscription, frequency: UsageFrequency) => void;
}

interface UsageRow {
  subscription: Subscription;
  monthlyCost: number;
  state: UsageState;
  daysSinceLastUse: number | null;
  usesLast30Days: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const FREQUENCIES: UsageFrequency[] = ['high', 'medium', 'low', 'none'];

function parseValidDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getUsageState(subscription: Subscription, daysSinceLastUse: number | null): UsageState {
  if (subscription.usageFrequency === 'low' || subscription.usageFrequency === 'none') {
    return 'attention';
  }
  if (daysSinceLastUse !== null && daysSinceLastUse > 30) return 'attention';
  if (
    subscription.usageFrequency === 'high'
    || subscription.usageFrequency === 'medium'
    || (daysSinceLastUse !== null && daysSinceLastUse <= 30)
  ) {
    return 'healthy';
  }
  return 'unknown';
}

export function FinancialDecisionTools({
  subscriptions,
  baseCurrency,
  isTurkish,
  formatMoney,
  updatingId,
  onOpenSubscription,
  onLogUsage,
  onSetFrequency,
}: Props) {
  const { colors } = useTheme();
  const [horizonYears, setHorizonYears] = useState<1 | 3 | 5>(3);
  const [frequencyEditorId, setFrequencyEditorId] = useState<string | null>(null);

  const activeCosts = useMemo(
    () => subscriptions
      .filter(subscription => subscription.status !== 'paused')
      .map(subscription => ({
        subscription,
        monthlyCost: getSubscriptionMonthlyNetCost(subscription, baseCurrency),
      }))
      .sort((a, b) => b.monthlyCost - a.monthlyCost),
    [baseCurrency, subscriptions],
  );

  const monthlyTotal = activeCosts.reduce((sum, item) => sum + item.monthlyCost, 0);
  const projectedTotal = monthlyTotal * 12 * horizonYears;
  const topLongTermCosts = activeCosts.slice(0, 3);

  const usageRows = useMemo<UsageRow[]>(() => {
    const now = new Date();
    const last30Days = now.getTime() - (30 * DAY_MS);
    const stateOrder: Record<UsageState, number> = { attention: 0, unknown: 1, healthy: 2 };

    return activeCosts
      .map(({ subscription, monthlyCost }) => {
        const lastUsed = parseValidDate(subscription.lastUsedDate);
        const daysSinceLastUse = lastUsed
          ? Math.max(0, Math.floor((now.getTime() - lastUsed.getTime()) / DAY_MS))
          : null;
        const usesLast30Days = (subscription.usageLogDates || []).filter(value => {
          const date = parseValidDate(value);
          return date !== null && date.getTime() >= last30Days && date.getTime() <= now.getTime();
        }).length;

        return {
          subscription,
          monthlyCost,
          daysSinceLastUse,
          usesLast30Days,
          state: getUsageState(subscription, daysSinceLastUse),
        };
      })
      .sort((a, b) => stateOrder[a.state] - stateOrder[b.state] || b.monthlyCost - a.monthlyCost);
  }, [activeCosts]);

  const reviewRows = usageRows.slice(0, 5);
  const attentionRows = usageRows.filter(row => row.state === 'attention');
  const reviewMonthlyCost = attentionRows.reduce((sum, row) => sum + row.monthlyCost, 0);

  const statusText = (row: UsageRow) => {
    if (row.state === 'attention') {
      if (row.subscription.usageFrequency === 'none') return isTurkish ? 'Kullanılmıyor' : 'Not used';
      if (row.daysSinceLastUse !== null && row.daysSinceLastUse > 30) {
        return isTurkish ? `${row.daysSinceLastUse} gündür kayıt yok` : `No log for ${row.daysSinceLastUse} days`;
      }
      return isTurkish ? 'Nadir kullanılıyor' : 'Rarely used';
    }
    if (row.state === 'healthy') {
      return row.daysSinceLastUse !== null
        ? isTurkish ? `${row.daysSinceLastUse} gün önce kullanıldı` : `Used ${row.daysSinceLastUse} days ago`
        : isTurkish ? 'Kullanım düzenli' : 'Regularly used';
    }
    return isTurkish ? 'Kullanım bilgisi eksik' : 'Usage data missing';
  };

  const frequencyLabel = (frequency: UsageFrequency) => {
    const labels = isTurkish
      ? { high: 'Sık', medium: 'Ara sıra', low: 'Nadir', none: 'Kullanmıyorum' }
      : { high: 'Often', medium: 'Sometimes', low: 'Rarely', none: 'Not using' };
    return labels[frequency];
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <View style={styles.projectionIcon}>
                <Ionicons name="hourglass-outline" size={18} color="#8B5CF6" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                {isTurkish ? 'Uzun vadeli maliyet' : 'Long-term cost'}
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isTurkish
                ? 'Mevcut fiyat ve ödeme aralıkları değişmezse oluşacak toplam.'
                : 'Projected total if current prices and billing cycles stay unchanged.'}
            </Text>
          </View>
          <View style={styles.horizonSelector}>
            {([1, 3, 5] as const).map(year => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.horizonButton,
                  { backgroundColor: colors.surfaceSubtle },
                  horizonYears === year && styles.horizonButtonActive,
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setHorizonYears(year);
                }}
              >
                <Text style={[
                  styles.horizonButtonText,
                  { color: colors.textSecondary },
                  horizonYears === year && styles.horizonButtonTextActive,
                ]}>
                  {year} {isTurkish ? 'Y' : 'Y'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.projectionSummary, { backgroundColor: colors.surfaceSubtle }]}>
          <View style={styles.projectionValueArea}>
            <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>
              {isTurkish ? `${horizonYears} YILLIK TAHMİN` : `${horizonYears}-YEAR FORECAST`}
            </Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.projectionValue, { color: colors.text }]}>
              {formatMoney(projectedTotal)}
            </Text>
          </View>
          <View style={styles.monthlyBaseline}>
            <Text style={[styles.baselineLabel, { color: colors.textSecondary }]}>
              {isTurkish ? 'Aylık temel' : 'Monthly base'}
            </Text>
            <Text style={[styles.baselineValue, { color: '#8B5CF6' }]}>{formatMoney(monthlyTotal)}</Text>
          </View>
        </View>

        <View style={styles.costList}>
          {topLongTermCosts.map(({ subscription, monthlyCost }, index) => {
            const id = String(subscription.id || '');
            return (
              <TouchableOpacity
                key={id || `${subscription.name}-${index}`}
                style={[styles.costRow, { borderBottomColor: colors.border }]}
                disabled={!id}
                onPress={() => id && onOpenSubscription(id)}
                activeOpacity={0.72}
              >
                <View style={[styles.rankBadge, { backgroundColor: colors.surfaceSubtle }]}>
                  <Text style={[styles.rankText, { color: colors.textSecondary }]}>{index + 1}</Text>
                </View>
                <View style={styles.rowCopy}>
                  <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text }]}>{subscription.name}</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                    {formatMoney(monthlyCost)} {isTurkish ? '/ ay' : '/ month'}
                  </Text>
                </View>
                <View style={styles.rowAmountArea}>
                  <Text style={[styles.rowAmount, { color: colors.text }]}>
                    {formatMoney(monthlyCost * 12 * horizonYears)}
                  </Text>
                  <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <View style={styles.usageIcon}>
                <Ionicons name="pulse-outline" size={18} color="#F97316" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                {isTurkish ? 'Kullanım kontrolü' : 'Usage review'}
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isTurkish
                ? 'Kesin etiketler yerine, senin kullanım sinyallerinle gözden geçirilecek abonelikleri bulur.'
                : 'Uses your own usage signals to find subscriptions worth reviewing.'}
            </Text>
          </View>
          {attentionRows.length > 0 && (
            <View style={styles.reviewBadge}>
              <Text style={styles.reviewBadgeValue}>{formatMoney(reviewMonthlyCost)}</Text>
              <Text style={styles.reviewBadgeLabel}>{isTurkish ? 'aylık kontrol' : 'monthly review'}</Text>
            </View>
          )}
        </View>

        <View style={styles.usageList}>
          {reviewRows.map(row => {
            const id = String(row.subscription.id || '');
            const isEditing = id !== '' && frequencyEditorId === id;
            const isUpdating = id !== '' && updatingId === id;
            const stateColor = row.state === 'attention' ? '#F97316' : row.state === 'healthy' ? '#10B981' : '#64748B';
            const costPerUse = row.usesLast30Days > 0 ? row.monthlyCost / row.usesLast30Days : null;

            return (
              <View key={id || row.subscription.name} style={[styles.usageRow, { backgroundColor: colors.surfaceSubtle }]}>
                <View style={styles.usageMainRow}>
                  <View style={[styles.stateDot, { backgroundColor: stateColor }]} />
                  <View style={styles.rowCopy}>
                    <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text }]}>{row.subscription.name}</Text>
                    <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{statusText(row)}</Text>
                    {costPerUse !== null && (
                      <Text style={[styles.costPerUse, { color: stateColor }]}>
                        {isTurkish
                          ? `Son 30 gün: ${row.usesLast30Days} kullanım · ${formatMoney(costPerUse)}/kullanım`
                          : `Last 30 days: ${row.usesLast30Days} uses · ${formatMoney(costPerUse)}/use`}
                      </Text>
                    )}
                  </View>
                  <View style={styles.usageAmountArea}>
                    <Text style={[styles.rowAmount, { color: colors.text }]}>{formatMoney(row.monthlyCost)}</Text>
                    <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>{isTurkish ? '/ ay' : '/ month'}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.secondaryAction, { borderColor: colors.border }]}
                    disabled={!id || isUpdating}
                    onPress={() => onLogUsage(row.subscription)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={15} color="#10B981" />
                    <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                      {isUpdating ? '…' : isTurkish ? 'Bugün kullandım' : 'Used today'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryAction, { borderColor: colors.border }]}
                    disabled={!id || isUpdating}
                    onPress={() => {
                      triggerHaptic('selection');
                      setFrequencyEditorId(current => current === id ? null : id);
                    }}
                  >
                    <Ionicons name="options-outline" size={15} color="#8B5CF6" />
                    <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                      {isTurkish ? 'Sıklık' : 'Frequency'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.detailAction}
                    disabled={!id}
                    onPress={() => id && onOpenSubscription(id)}
                  >
                    <Text style={styles.detailActionText}>{isTurkish ? 'Detay' : 'Details'}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
                  </TouchableOpacity>
                </View>

                {isEditing && (
                  <View style={[styles.frequencyPanel, { borderTopColor: colors.border }]}>
                    <Text style={[styles.frequencyPrompt, { color: colors.textSecondary }]}>
                      {isTurkish ? 'Genellikle ne sıklıkta kullanıyorsun?' : 'How often do you usually use it?'}
                    </Text>
                    <View style={styles.frequencyRow}>
                      {FREQUENCIES.map(frequency => {
                        const selected = row.subscription.usageFrequency === frequency;
                        return (
                          <TouchableOpacity
                            key={frequency}
                            style={[
                              styles.frequencyChip,
                              { borderColor: selected ? '#8B5CF6' : colors.border },
                              selected && styles.frequencyChipSelected,
                            ]}
                            onPress={() => {
                              onSetFrequency(row.subscription, frequency);
                              setFrequencyEditorId(null);
                            }}
                          >
                            <Text style={[
                              styles.frequencyChipText,
                              { color: selected ? '#8B5CF6' : colors.textSecondary },
                            ]}>
                              {frequencyLabel(frequency)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={[styles.infoNote, { backgroundColor: colors.surfaceSubtle }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoNoteText, { color: colors.textSecondary }]}>
            {isTurkish
              ? 'SubMate diğer uygulamaların kullanımına erişmez. Sonuçlar yalnızca senin kaydettiğin bilgilerden oluşur.'
              : 'SubMate cannot access usage from other apps. Results use only the information you record.'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  card: { borderRadius: 22, borderWidth: 1, padding: 17 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  projectionIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(139, 92, 246, 0.13)' },
  usageIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249, 115, 22, 0.13)' },
  title: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  subtitle: { fontSize: 11, lineHeight: 16, marginTop: 7, maxWidth: 600 },
  horizonSelector: { flexDirection: 'row', gap: 5 },
  horizonButton: { minWidth: 38, minHeight: 34, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  horizonButtonActive: { backgroundColor: '#8B5CF6' },
  horizonButtonText: { fontSize: 10, fontWeight: '800' },
  horizonButtonTextActive: { color: '#FFFFFF' },
  projectionSummary: { marginTop: 16, borderRadius: 17, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  projectionValueArea: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  projectionValue: { fontSize: 25, fontWeight: '900', letterSpacing: -0.5, marginTop: 4 },
  monthlyBaseline: { alignItems: 'flex-end' },
  baselineLabel: { fontSize: 9, fontWeight: '700' },
  baselineValue: { fontSize: 13, fontWeight: '900', marginTop: 3 },
  costList: { marginTop: 10 },
  costRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  rankBadge: { width: 29, height: 29, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 11, fontWeight: '900' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 12, fontWeight: '900' },
  rowSubtitle: { fontSize: 9, lineHeight: 13, marginTop: 3 },
  rowAmountArea: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowAmount: { fontSize: 12, fontWeight: '900' },
  reviewBadge: { alignItems: 'flex-end', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(249, 115, 22, 0.12)' },
  reviewBadgeValue: { color: '#F97316', fontSize: 12, fontWeight: '900' },
  reviewBadgeLabel: { color: '#F97316', fontSize: 8, fontWeight: '700', marginTop: 1 },
  usageList: { gap: 9, marginTop: 16 },
  usageRow: { borderRadius: 16, padding: 12 },
  usageMainRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stateDot: { width: 8, height: 8, borderRadius: 4 },
  costPerUse: { fontSize: 8, lineHeight: 12, fontWeight: '700', marginTop: 3 },
  usageAmountArea: { alignItems: 'flex-end' },
  monthLabel: { fontSize: 8, marginTop: 2 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 11 },
  secondaryAction: { minHeight: 34, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  secondaryActionText: { fontSize: 9, fontWeight: '800' },
  detailAction: { marginLeft: 'auto', minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5 },
  detailActionText: { color: '#3B82F6', fontSize: 9, fontWeight: '800' },
  frequencyPanel: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 11, paddingTop: 11 },
  frequencyPrompt: { fontSize: 9, fontWeight: '700', marginBottom: 8 },
  frequencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  frequencyChip: { minHeight: 32, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  frequencyChipSelected: { backgroundColor: 'rgba(139, 92, 246, 0.1)' },
  frequencyChipText: { fontSize: 9, fontWeight: '800' },
  infoNote: { borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 12 },
  infoNoteText: { flex: 1, fontSize: 9, lineHeight: 14 },
});
