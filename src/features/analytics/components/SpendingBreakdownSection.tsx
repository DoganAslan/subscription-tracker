import type { ComponentProps } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';
import type { CategoryAnalysis } from '@/features/analytics/utils/financialAnalytics';
import { getCategoryMeta } from '@/utils/categoryMeta';
import { AnalysisSectionCard, AnalysisSectionHeader } from './AnalysisSectionCard';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function SpendingBreakdownSection({ colors, isTurkish, categories, formatMoney, style }: { colors: ThemeColors; isTurkish: boolean; categories: CategoryAnalysis[]; formatMoney: (value: number) => string; style?: StyleProp<ViewStyle> }) {
  return <AnalysisSectionCard surface={colors.surface} border={colors.border} style={style}>
    <AnalysisSectionHeader icon="pie-chart-outline" title={isTurkish ? 'Harcama dağılımı' : 'Spending breakdown'} subtitle={isTurkish ? 'Aylık net taahhüdün kategorilere dağılımı' : 'Your net monthly commitment by category'} text={colors.text} secondary={colors.textSecondary} />
    <View style={styles.list}>{categories.map(category => { const meta = getCategoryMeta(category.category, isTurkish); const icon = meta.icon as IconName; return <View key={category.category} style={styles.item}><View style={styles.topRow}><View style={styles.identity}><View style={[styles.icon, { backgroundColor: meta.bg }]}><Ionicons name={icon} size={16} color={meta.color} /></View><View><Text style={[styles.name, { color: colors.text }]}>{meta.name}</Text><Text style={[styles.count, { color: colors.textSecondary }]}>{isTurkish ? `${category.count} abonelik` : `${category.count} subscription${category.count > 1 ? 's' : ''}`}</Text></View></View><View style={styles.amountArea}><Text style={[styles.amount, { color: colors.text }]}>{formatMoney(category.amount)}</Text><Text style={[styles.percent, { color: colors.textSecondary }]}>%{category.percentage.toFixed(0)}</Text></View></View><View style={[styles.track, { backgroundColor: colors.surfaceSubtle }]}><View style={[styles.fill, { width: `${Math.max(2, category.percentage)}%`, backgroundColor: meta.color }]} /></View></View>; })}</View>
  </AnalysisSectionCard>;
}
const styles = StyleSheet.create({ list: { gap: 15 }, item: { gap: 8 }, topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, identity: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }, icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, name: { fontSize: 12, fontWeight: '800' }, count: { fontSize: 9, marginTop: 2 }, amountArea: { alignItems: 'flex-end', flexShrink: 0 }, amount: { fontSize: 12, fontWeight: '800' }, percent: { fontSize: 9, marginTop: 2 }, track: { height: 5, borderRadius: 3, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 3 } });
