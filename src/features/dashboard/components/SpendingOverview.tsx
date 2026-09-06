import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';
import type { DashboardCategoryBreakdown } from '../types';
import { getCategoryLabel } from '@/utils/categoryMeta';

type SpendingOverviewProps = {
  colors: ThemeColors;
  isTurkish: boolean;
  currencySymbol: string;
  formattedAmount: string;
  monthlyTotal: number;
  monthlyBudget: number | null;
  categories: DashboardCategoryBreakdown[];
};

const CATEGORY_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];

export function SpendingOverview({
  colors,
  isTurkish,
  currencySymbol,
  formattedAmount,
  monthlyTotal,
  monthlyBudget,
  categories,
}: SpendingOverviewProps) {
  const hasBudget = monthlyBudget !== null && monthlyBudget > 0;
  const usedPercent = hasBudget ? Math.min(100, Math.round(monthlyTotal / monthlyBudget * 100)) : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{isTurkish ? 'Harcama özeti' : 'Spending overview'}</Text>
        <View style={styles.monthBadge}>
          <Text style={[styles.monthBadgeText, { color: colors.textSecondary }]}>{isTurkish ? 'Bu ay' : 'This month'}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.amountArea}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.amount, { color: colors.text }]}>
            {currencySymbol}{formattedAmount}
          </Text>
          {hasBudget && usedPercent !== null ? (
            <>
              <Text style={[styles.limitText, { color: colors.textSecondary }]}>
                {isTurkish ? `${currencySymbol}${monthlyBudget.toLocaleString('tr-TR')} limitin` : `of ${currencySymbol}${monthlyBudget.toLocaleString('en-US')} limit`}
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${usedPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>{isTurkish ? `%${usedPercent} kullanıldı` : `${usedPercent}% used`}</Text>
            </>
          ) : (
            <Text style={[styles.limitText, { color: colors.textSecondary }]}>
              {isTurkish ? 'Aylık bütçe belirlenmedi' : 'No monthly budget set'}
            </Text>
          )}
        </View>

        <View style={styles.legend}>
          {categories.map((category, index) => (
            <View key={category.category} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }]} />
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]} numberOfLines={2}>{getCategoryLabel(category.category, isTurkish)}</Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>{category.percentage.toFixed(0)}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '800' },
  monthBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthBadgeText: { fontSize: 12, fontWeight: '600' },
  content: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountArea: { flex: 1, paddingRight: 12 },
  amount: { fontSize: 22, fontWeight: '800' },
  limitText: { fontSize: 12, fontWeight: '500', marginTop: 2, marginBottom: 10 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#2563EB' },
  progressText: { fontSize: 12, fontWeight: '700', color: '#2563EB', marginTop: 4 },
  legend: { width: 145, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendLabel: { fontSize: 11, fontWeight: '500', flex: 1 },
  legendValue: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
});
