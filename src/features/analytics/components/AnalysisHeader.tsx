import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';

export function AnalysisHeader({ colors, isTurkish, isCompact, onAskAi }: { colors: ThemeColors; isTurkish: boolean; isCompact: boolean; onAskAi: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.title, isCompact && styles.compactTitle, { color: colors.text }]}>{isTurkish ? 'Finansal Analiz' : 'Financial Analysis'}</Text>
        <View style={styles.liveRow}><View style={styles.liveDot} /><Text style={[styles.subtitle, { color: colors.textSecondary }]}>{isTurkish ? 'Aboneliklerin değiştikçe otomatik güncellenir' : 'Updates automatically when subscriptions change'}</Text></View>
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={isTurkish ? 'Yapay zekaya sor' : 'Ask AI'} style={styles.aiButton} onPress={onAskAi} activeOpacity={0.8}>
        <Ionicons name="sparkles" size={17} color="#FFFFFF" /><Text style={styles.aiText}>{isTurkish ? 'AI’ye sor' : 'Ask AI'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 2 },
  copy: { flex: 1, minWidth: 0 }, title: { fontSize: 25, fontWeight: '900', letterSpacing: -0.5 }, compactTitle: { fontSize: 21 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  subtitle: { fontSize: 12, lineHeight: 17, flexShrink: 1 }, aiButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#7C3AED', flexShrink: 0 }, aiText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
