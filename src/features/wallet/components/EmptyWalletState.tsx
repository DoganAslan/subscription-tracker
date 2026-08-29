import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';

export function EmptyWalletState({ colors, title, description, action, onAdd }: { colors: ThemeColors; title: string; description: string; action: string; onAdd: () => void }) {
  return <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: colors.border }]}><Ionicons name="card-outline" size={44} color={colors.primary} /></View><Text style={[styles.title, { color: colors.text }]}>{title}</Text><Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text><TouchableOpacity onPress={onAdd} style={[styles.button, { backgroundColor: colors.primary }]} activeOpacity={0.85}><Ionicons name="add" size={20} color="#FFFFFF" /><Text style={styles.buttonText}>{action}</Text></TouchableOpacity></View>;
}
const styles = StyleSheet.create({ container: { borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, marginTop: 12 }, icon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, title: { fontSize: 18, fontWeight: '800', marginBottom: 6 }, description: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 20 }, button: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 }, buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' } });
