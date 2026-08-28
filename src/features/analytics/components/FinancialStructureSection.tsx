import type { ComponentProps } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';
import type { FinancialAnalysis } from '@/features/analytics/utils/financialAnalytics';
import { AnalysisSectionCard, AnalysisSectionHeader } from './AnalysisSectionCard';

type IconName = ComponentProps<typeof Ionicons>['name'];
function StructureItem({ width, icon, color, label, value, detail, colors }: { width: DimensionValue; icon: IconName; color: string; label: string; value: string; detail: string; colors: ThemeColors }) {
  return <View style={[styles.item, { width, backgroundColor: colors.surfaceSubtle }]}><View style={[styles.icon, { backgroundColor: `${color}1F` }]}><Ionicons name={icon} size={18} color={color} /></View><Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text><Text numberOfLines={1} style={[styles.value, { color: colors.text }]}>{value}</Text><Text numberOfLines={1} style={[styles.detail, { color: colors.textSecondary }]}>{detail}</Text></View>;
}
export function FinancialStructureSection({ analysis, widths, colors, isTurkish, formatMoney }: { analysis: FinancialAnalysis; widths: DimensionValue[]; colors: ThemeColors; isTurkish: boolean; formatMoney: (value: number) => string }) {
  return <AnalysisSectionCard surface={colors.surface} border={colors.border}><AnalysisSectionHeader icon="compass-outline" title={isTurkish ? 'Finansal yapı' : 'Financial structure'} subtitle={isTurkish ? 'Maliyet yoğunlaşması ve kur etkisi' : 'Cost concentration and currency exposure'} text={colors.text} secondary={colors.textSecondary} /><View style={styles.grid}>
    <StructureItem width={widths[0]} icon="diamond-outline" color="#8B5CF6" label={isTurkish ? 'En yüksek maliyet' : 'Largest commitment'} value={analysis.topSubscription?.subscription.name || '—'} detail={analysis.topSubscription ? `${formatMoney(analysis.topSubscription.amount)} · %${analysis.topSubscription.share.toFixed(0)}` : '—'} colors={colors} />
    <StructureItem width={widths[1]} icon="globe-outline" color="#3B82F6" label={isTurkish ? 'Döviz maruziyeti' : 'Currency exposure'} value={`%${analysis.foreignCurrencyShare.toFixed(0)}`} detail={formatMoney(analysis.foreignCurrencyMonthly)} colors={colors} />
    <StructureItem width={widths[2]} icon="people-outline" color="#10B981" label={isTurkish ? 'Aylık geri alınan pay' : 'Monthly shared recovery'} value={formatMoney(analysis.monthlyRecoverable)} detail={isTurkish ? 'Paylaşılan ödemeler' : 'Shared payments'} colors={colors} />
  </View></AnalysisSectionCard>;
}
const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'stretch' }, item: { minHeight: 118, borderRadius: 16, padding: 13 }, icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, label: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 }, value: { fontSize: 14, fontWeight: '900', marginTop: 4 }, detail: { fontSize: 9, marginTop: 3 } });
