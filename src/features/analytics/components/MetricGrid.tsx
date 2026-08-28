import type { ComponentProps } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';
import type { FinancialAnalysis } from '@/features/analytics/utils/financialAnalytics';

type IconName = ComponentProps<typeof Ionicons>['name'];
type MetricCardProps = { width: DimensionValue; icon: IconName; color: string; label: string; value: string; detail: string; colors: ThemeColors };
function MetricCard({ width, icon, color, label, value, detail, colors }: MetricCardProps) {
  return <View style={[styles.card, { width, backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: `${color}1F` }]}><Ionicons name={icon} size={18} color={color} /></View><Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.value, { color: colors.text }]}>{value}</Text><Text style={[styles.detail, { color: colors.textSecondary }]}>{detail}</Text></View>;
}

export function MetricGrid({ analysis, widths, colors, isTurkish, formatMoney }: { analysis: FinancialAnalysis; widths: DimensionValue[]; colors: ThemeColors; isTurkish: boolean; formatMoney: (value: number) => string }) {
  return <View style={styles.grid}>
    <MetricCard width={widths[0]} icon="calendar-outline" color="#8B5CF6" label={isTurkish ? '12 AYLIK TAHMİN' : '12-MONTH FORECAST'} value={formatMoney(analysis.yearlyProjection)} detail={isTurkish ? 'Mevcut taahhütlerle' : 'At current commitments'} colors={colors} />
    <MetricCard width={widths[1]} icon="repeat-outline" color="#10B981" label={isTurkish ? 'AKTİF ABONELİK' : 'ACTIVE SUBSCRIPTIONS'} value={String(analysis.activeCount)} detail={analysis.pausedCount > 0 ? (isTurkish ? `${analysis.pausedCount} duraklatılmış` : `${analysis.pausedCount} paused`) : (isTurkish ? 'Tümü aktif' : 'All active')} colors={colors} />
    <MetricCard width={widths[2]} icon="calculator-outline" color="#F59E0B" label={isTurkish ? 'ABONELİK BAŞINA' : 'PER SUBSCRIPTION'} value={formatMoney(analysis.averagePerSubscription)} detail={isTurkish ? 'Aylık ortalama' : 'Monthly average'} colors={colors} />
  </View>;
}
const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, card: { minHeight: 132, borderRadius: 18, borderWidth: 1, padding: 14 }, icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, label: { fontSize: 9, lineHeight: 13, fontWeight: '800', letterSpacing: 0.5 }, value: { fontSize: 20, fontWeight: '900', marginTop: 4 }, detail: { fontSize: 10, lineHeight: 14, marginTop: 3 } });
