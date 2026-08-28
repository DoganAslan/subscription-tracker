import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';
import type { FinancialInsight } from '@/features/analytics/hooks/useFinancialAnalysisViewModel';
import { AnalysisSectionCard, AnalysisSectionHeader } from './AnalysisSectionCard';

export function PriorityActionsSection({ colors, isTurkish, insights, onOpenSubscriptions }: { colors: ThemeColors; isTurkish: boolean; insights: FinancialInsight[]; onOpenSubscriptions: () => void }) {
  return <AnalysisSectionCard surface={colors.surface} border={colors.border}><AnalysisSectionHeader icon="flash-outline" title={isTurkish ? 'Öncelikli aksiyonlar' : 'Priority actions'} subtitle={isTurkish ? 'En etkili kontroller önce gösterilir' : 'Highest-impact checks appear first'} text={colors.text} secondary={colors.textSecondary} /><View style={styles.list}>{insights.map(insight => <TouchableOpacity key={insight.kind} style={[styles.row, { backgroundColor: colors.surfaceSubtle }]} onPress={onOpenSubscriptions} activeOpacity={0.75}><View style={[styles.icon, { backgroundColor: insight.backgroundColor }]}><Ionicons name={insight.icon} size={20} color={insight.color} /></View><View style={styles.copy}><Text style={[styles.title, { color: colors.text }]}>{insight.title}</Text><Text style={[styles.description, { color: colors.textSecondary }]}>{insight.description}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textSecondary} /></TouchableOpacity>)}</View></AnalysisSectionCard>;
}
const styles = StyleSheet.create({ list: { gap: 9 }, row: { minHeight: 70, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }, icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, title: { fontSize: 12, fontWeight: '900' }, description: { fontSize: 10, lineHeight: 15, marginTop: 3 } });
