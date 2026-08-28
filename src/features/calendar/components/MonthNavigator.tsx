import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';

type MonthNavigatorProps = {
  colors: ThemeColors;
  isTurkish: boolean;
  title: string;
  currencySymbol: string;
  monthlyTotal: number;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function MonthNavigator({
  colors,
  isTurkish,
  title,
  currencySymbol,
  monthlyTotal,
  onPrevious,
  onNext,
  onToday,
}: MonthNavigatorProps) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.monthRow}>
        <Text style={[styles.monthTitle, { color: colors.text }]}>{title}</Text>
        <View style={[styles.chevrons, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous month" onPress={onPrevious} style={styles.chevronButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={18} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.chevronDivider} />
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next month" onPress={onNext} style={styles.chevronButton} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.totalRow}>
        <View>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>{isTurkish ? 'Bu ay ödenecek' : 'Monthly due'}</Text>
          <Text style={[styles.totalAmount, { color: colors.text }]}>{currencySymbol}{monthlyTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity onPress={onToday} style={[styles.todayButton, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
          <Text style={styles.todayText}>{isTurkish ? 'Bugün' : 'Today'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, borderWidth: 1 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthTitle: { fontSize: 18, fontWeight: '800' },
  chevrons: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 2 },
  chevronButton: { paddingHorizontal: 10, paddingVertical: 6 },
  chevronDivider: { width: 1, height: 16, backgroundColor: 'rgba(148, 163, 184, 0.3)' },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  totalAmount: { fontSize: 24, fontWeight: '800' },
  todayButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  todayText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
