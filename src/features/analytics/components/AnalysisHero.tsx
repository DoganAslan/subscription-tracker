import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { FinancialAnalysis } from '@/features/analytics/utils/financialAnalytics';

export function AnalysisHero({ analysis, baseCurrency, isTurkish, formatMoney, onSetBudget }: {
  analysis: FinancialAnalysis;
  baseCurrency: string;
  isTurkish: boolean;
  formatMoney: (value: number) => string;
  onSetBudget: () => void;
}) {
  return (
    <LinearGradient colors={['#2563EB', '#4F46E5', '#7C3AED']} style={styles.card}>
      <View style={styles.topRow}><View><Text style={styles.label}>{isTurkish ? 'AYLIK NET TAAHHÜT' : 'NET MONTHLY COMMITMENT'}</Text><Text style={styles.value}>{formatMoney(analysis.monthlyCommitment)}</Text></View><View style={styles.currencyBadge}><Text style={styles.currencyText}>{baseCurrency}</Text></View></View>
      {analysis.monthlyTrialCredit > 0 ? <Text style={styles.note}>{isTurkish ? `Aktif denemeler nedeniyle şu an yaklaşık ${formatMoney(analysis.currentMonthlyCost)}` : `Currently about ${formatMoney(analysis.currentMonthlyCost)} while trials are active`}</Text> : null}
      {analysis.budgetUsagePercent !== null ? (
        <View style={styles.budgetArea}>
          <View style={styles.budgetHeader}><Text style={styles.budgetLabel}>{isTurkish ? 'Bütçe kullanımı' : 'Budget usage'}</Text><Text style={styles.budgetValue}>{analysis.budgetUsagePercent.toFixed(0)}%</Text></View>
          <View style={styles.budgetTrack}><View style={[styles.budgetFill, { width: `${Math.min(100, analysis.budgetUsagePercent)}%`, backgroundColor: analysis.budgetUsagePercent > 100 ? '#FCA5A5' : '#FFFFFF' }]} /></View>
          <Text style={styles.budgetHint}>{(analysis.budgetRemaining || 0) >= 0 ? (isTurkish ? `${formatMoney(analysis.budgetRemaining || 0)} kullanılabilir alan kaldı` : `${formatMoney(analysis.budgetRemaining || 0)} of budget remains`) : (isTurkish ? `${formatMoney(Math.abs(analysis.budgetRemaining || 0))} limit üzerinde` : `${formatMoney(Math.abs(analysis.budgetRemaining || 0))} over budget`)}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.budgetPrompt} onPress={onSetBudget}><Ionicons name="flag-outline" size={16} color="#FFFFFF" /><Text style={styles.budgetPromptText}>{isTurkish ? 'Ana sayfadan aylık bütçe limiti belirle' : 'Set a monthly budget from Home'}</Text><Ionicons name="chevron-forward" size={16} color="#FFFFFF" /></TouchableOpacity>
      )}
      <View style={styles.summaryRow}><View style={styles.summaryItem}><Text style={styles.summaryLabel}>{isTurkish ? 'Brüt' : 'Gross'}</Text><Text style={styles.summaryValue}>{formatMoney(analysis.monthlyGross)}</Text></View><View style={styles.divider} /><View style={styles.summaryItem}><Text style={styles.summaryLabel}>{isTurkish ? 'Paylaşılan' : 'Recovered'}</Text><Text style={styles.summaryValue}>{formatMoney(analysis.monthlyRecoverable)}</Text></View></View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, overflow: 'hidden' }, topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, label: { color: 'rgba(255,255,255,0.74)', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }, value: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: 5 }, note: { color: 'rgba(255,255,255,0.82)', fontSize: 12, lineHeight: 18, marginTop: 4 }, currencyBadge: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }, currencyText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  budgetArea: { marginTop: 20 }, budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }, budgetLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '700' }, budgetValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' }, budgetTrack: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }, budgetFill: { height: '100%', borderRadius: 4 }, budgetHint: { color: 'rgba(255,255,255,0.72)', fontSize: 10, marginTop: 7 }, budgetPrompt: { marginTop: 18, minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.14)' }, budgetPromptText: { color: '#FFFFFF', flex: 1, fontSize: 11, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', marginTop: 20, paddingTop: 15, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.24)' }, summaryItem: { flex: 1 }, divider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.24)', marginHorizontal: 16 }, summaryLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 10, fontWeight: '700' }, summaryValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 3 },
});
