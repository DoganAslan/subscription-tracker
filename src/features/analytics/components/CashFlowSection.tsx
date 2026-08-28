import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';
import type { CashFlowMonth } from '@/features/analytics/utils/financialAnalytics';
import { AnalysisSectionCard, AnalysisSectionHeader } from './AnalysisSectionCard';

export function CashFlowSection({ colors, isTurkish, cashFlow, maxCashFlow, selectedKey, selectedMonth, formatMoney, formatDate, formatMonth, formatMonthYear, onSelect }: {
  colors: ThemeColors;
  isTurkish: boolean;
  cashFlow: CashFlowMonth[];
  maxCashFlow: number;
  selectedKey: string | null;
  selectedMonth: CashFlowMonth | null;
  formatMoney: (value: number) => string;
  formatDate: (date: Date) => string;
  formatMonth: (date: Date) => string;
  formatMonthYear: (date: Date) => string;
  onSelect: (key: string) => void;
}) {
  return <AnalysisSectionCard surface={colors.surface} border={colors.border}>
    <AnalysisSectionHeader icon="bar-chart-outline" title={isTurkish ? 'Önümüzdeki 6 ay' : 'Next 6 months'} subtitle={isTurkish ? 'Gerçek yenileme tarihlerine göre ödeme akışı' : 'Cash flow based on actual renewal dates'} text={colors.text} secondary={colors.textSecondary} />
    <View style={styles.chart}>{cashFlow.map((month, index) => {
      const height = month.amount > 0 ? Math.max(8, (month.amount / maxCashFlow) * 118) : 4;
      const selected = selectedKey === month.key;
      return <TouchableOpacity key={month.key} style={styles.column} activeOpacity={0.75} onPress={() => onSelect(month.key)} accessibilityRole="button" accessibilityLabel={isTurkish ? `${formatMonth(month.date)} ayı ödemelerini göster` : `Show ${formatMonth(month.date)} payments`}>
        <Text numberOfLines={1} style={[styles.chartValue, { color: index === 0 || selected ? colors.primary : colors.textSecondary }]}>{month.amount > 0 ? formatMoney(month.amount) : '—'}</Text>
        <View style={[styles.track, { backgroundColor: selected ? `${colors.primary}26` : colors.surfaceSubtle, borderColor: selected ? colors.primary : 'transparent' }]}><View style={[styles.bar, { height, backgroundColor: index === 0 || selected ? colors.primary : '#6366F1', opacity: index === 0 || selected ? 1 : 0.68 }]} /></View>
        <Text style={[styles.month, { color: index === 0 || selected ? colors.primary : colors.textSecondary }]}>{formatMonth(month.date)}</Text>
      </TouchableOpacity>;
    })}</View>
    {selectedMonth ? <View style={[styles.details, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
      <View style={styles.detailsHeader}><View style={styles.detailsTitleRow}><Ionicons name="calendar-outline" size={16} color={colors.primary} /><Text style={[styles.detailsTitle, { color: colors.text }]}>{formatMonthYear(selectedMonth.date)}</Text></View><Text style={[styles.detailsTotal, { color: colors.primary }]}>{formatMoney(selectedMonth.amount)}</Text></View>
      {selectedMonth.payments.length > 0 ? <View style={styles.paymentList}>{selectedMonth.payments.map(payment => <View key={`${selectedMonth.key}-${payment.subscription.id}-${payment.date.toISOString()}`} style={[styles.paymentRow, { borderTopColor: colors.border }]}><View style={[styles.paymentIcon, { backgroundColor: `${colors.primary}1A` }]}><Ionicons name="card-outline" size={15} color={colors.primary} /></View><View style={styles.paymentCopy}><Text numberOfLines={1} style={[styles.paymentName, { color: colors.text }]}>{payment.subscription.name}</Text><Text style={[styles.paymentDate, { color: colors.textSecondary }]}>{formatDate(payment.date)}</Text></View><Text style={[styles.paymentAmount, { color: colors.text }]}>{formatMoney(payment.amount)}</Text></View>)}</View> : <Text style={[styles.empty, { color: colors.textSecondary }]}>{isTurkish ? 'Bu ay için kayıtlı ödeme yok.' : 'No recorded payments for this month.'}</Text>}
    </View> : null}
  </AnalysisSectionCard>;
}

const styles = StyleSheet.create({
  chart: { height: 175, flexDirection: 'row', alignItems: 'flex-end', paddingTop: 4 }, column: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', minWidth: 0 }, chartValue: { fontSize: 9, fontWeight: '800', marginBottom: 5, maxWidth: '100%' }, track: { height: 122, width: '62%', maxWidth: 38, minWidth: 18, borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden', borderWidth: 1 }, bar: { width: '100%', borderRadius: 10 }, month: { fontSize: 10, fontWeight: '800', marginTop: 7, textTransform: 'capitalize' },
  details: { borderRadius: 16, borderWidth: 1, padding: 12, marginTop: 12 }, detailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, detailsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }, detailsTitle: { fontSize: 13, fontWeight: '900', textTransform: 'capitalize' }, detailsTotal: { fontSize: 13, fontWeight: '900' }, paymentList: { marginTop: 5 }, paymentRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: StyleSheet.hairlineWidth }, paymentIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, paymentCopy: { flex: 1 }, paymentName: { fontSize: 11, fontWeight: '800' }, paymentDate: { fontSize: 10, marginTop: 2 }, paymentAmount: { fontSize: 11, fontWeight: '900' }, empty: { fontSize: 11, marginTop: 12 },
});
