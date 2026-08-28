import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function AnalysisSectionCard({ children, surface, border, style }: { children: ReactNode; surface: string; border: string; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, { backgroundColor: surface, borderColor: border }, style]}>{children}</View>;
}

export function AnalysisSectionHeader({ icon, title, subtitle, text, secondary, action, onAction }: {
  icon: IconName;
  title: string;
  subtitle: string;
  text: string;
  secondary: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <View style={styles.titleRow}><Ionicons name={icon} size={18} color="#6366F1" /><Text style={[styles.title, { color: text }]}>{title}</Text></View>
        <Text style={[styles.subtitle, { color: secondary }]}>{subtitle}</Text>
      </View>
      {action && onAction ? <TouchableOpacity onPress={onAction} style={styles.action}><Text style={styles.actionText}>{action}</Text><Ionicons name="chevron-forward" size={15} color="#3B82F6" /></TouchableOpacity> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 1, padding: 17 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  headerCopy: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  subtitle: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  action: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  actionText: { color: '#3B82F6', fontSize: 11, fontWeight: '800' },
});
