import type { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';
type IconName = ComponentProps<typeof Ionicons>['name'];

export function SettingsRow({ colors, icon, iconColor, label, value, onPress, showDivider = false }: { colors: ThemeColors; icon: IconName; iconColor: string; label: string; value?: string; onPress: () => void; showDivider?: boolean }) {
  return <><TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}><View style={styles.left}><View style={[styles.icon, { backgroundColor: `${iconColor}1F` }]}><Ionicons name={icon} size={18} color={iconColor} /></View><Text style={[styles.label, { color: colors.text }]}>{label}</Text></View><View style={styles.right}>{value ? <Text numberOfLines={1} style={[styles.value, { color: colors.textSecondary }]}>{value}</Text> : null}<Ionicons name="chevron-forward" size={18} color={colors.textSecondary} /></View></TouchableOpacity>{showDivider ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}</>;
}
const styles = StyleSheet.create({ row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, gap: 12 }, left: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 }, icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, label: { fontSize: 14, fontWeight: '700', flexShrink: 1 }, right: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '46%' }, value: { fontSize: 12, fontWeight: '700', flexShrink: 1 }, divider: { height: StyleSheet.hairlineWidth, marginLeft: 61 } });
