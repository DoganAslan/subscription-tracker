import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ThemeColors } from '@/theme/colors';

type CalendarGridProps = {
  colors: ThemeColors;
  weekDays: string[];
  days: (number | null)[];
  selectedDay: number;
  paymentCountByDay: Map<number, number>;
  onSelectDay: (day: number) => void;
};

export function CalendarGrid({ colors, weekDays, days, selectedDay, paymentCountByDay, onSelectDay }: CalendarGridProps) {
  return (
    <>
      <View style={styles.weekHeader}>
        {weekDays.map(day => <Text key={day} style={[styles.weekDay, { color: colors.textSecondary }]}>{day}</Text>)}
      </View>
      <View style={[styles.grid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {days.map((day, index) => {
          if (day === null) return <View key={`empty-${index}`} style={[styles.dayCell, { borderColor: colors.border }]} />;

          const isSelected = day === selectedDay;
          const paymentCount = paymentCountByDay.get(day) ?? 0;
          return (
            <TouchableOpacity
              key={`day-${day}`}
              accessibilityRole="button"
              accessibilityLabel={`Select day ${day}`}
              style={[styles.dayCell, { borderColor: colors.border }, isSelected && styles.selectedCell]}
              onPress={() => onSelectDay(day)}
              activeOpacity={0.75}
            >
              <View style={[styles.dayCircle, isSelected && { backgroundColor: colors.primary }]}>
                <Text style={[styles.dayText, { color: isSelected ? '#FFFFFF' : colors.text }]}>{day}</Text>
              </View>
              {paymentCount > 0 ? (
                <View style={styles.paymentRow}>
                  <View style={styles.paymentDot} />
                  {paymentCount > 1 ? <Text style={styles.paymentCount}>{paymentCount}</Text> : null}
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  weekDay: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  dayCell: { width: '14.28%', height: 52, alignItems: 'center', justifyContent: 'center', borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  selectedCell: { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
  dayCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 13, fontWeight: '700' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', position: 'absolute', bottom: 4 },
  paymentDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#F59E0B' },
  paymentCount: { fontSize: 9, fontWeight: '800', color: '#F59E0B', marginLeft: 2 },
});
