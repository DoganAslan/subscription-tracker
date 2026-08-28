import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';

type CalendarHeaderProps = {
  colors: ThemeColors;
  isTurkish: boolean;
  activeCount: number;
};

export function CalendarHeader({ colors, isTurkish, activeCount }: CalendarHeaderProps) {
  return (
    <View style={styles.container}>
      <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
        {isTurkish ? 'Yenileme takvimi' : 'Renewal calendar'}
      </Text>
      <View style={styles.activePill}>
        <Ionicons name="calendar-outline" size={14} color="#3B82F6" />
        <Text style={styles.activeText}>{activeCount} {isTurkish ? 'aktif' : 'active'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, flex: 1, minWidth: 0, marginRight: 10 },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, flexShrink: 0, backgroundColor: 'rgba(59, 130, 246, 0.12)' },
  activeText: { fontSize: 12, fontWeight: '800', color: '#3B82F6' },
});
