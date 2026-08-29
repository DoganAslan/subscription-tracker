import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '@/theme/colors';
export function SettingsSection({ colors, title, children }: { colors: ThemeColors; title: string; children: ReactNode }) { return <View><Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text><View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View></View>; }
const styles = StyleSheet.create({ title: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }, group: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' } });
