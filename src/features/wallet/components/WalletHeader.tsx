import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';

export function WalletHeader({ colors, title, cardCount, linkedCount, cardsLabel, linkedLabel, onAdd }: { colors: ThemeColors; title: string; cardCount: number; linkedCount: number; cardsLabel: string; linkedLabel: string; onAdd: () => void }) {
  return <View style={styles.row}><View style={styles.copy}><Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{title}</Text><Text numberOfLines={2} style={[styles.subtitle, { color: colors.textSecondary }]}>{cardCount} {cardsLabel} • {linkedCount} {linkedLabel}</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Add card" onPress={onAdd} style={[styles.add, { backgroundColor: colors.primary }]} activeOpacity={0.8}><Ionicons name="add" size={24} color="#FFFFFF" /></TouchableOpacity></View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, gap: 12 }, copy: { flex: 1, minWidth: 0, marginBottom: 12 }, title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 }, subtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 }, add: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 } });
