import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpringButton } from '@/components/SpringButton';
import type { ThemeColors } from '@/theme/colors';
import type { QuickActionItem } from '../services/quickActionsStore';

type IconName = ComponentProps<typeof Ionicons>['name'];

type DashboardQuickActionsProps = {
  actions: QuickActionItem[];
  colors: ThemeColors;
  isTurkish: boolean;
  onPress: (action: QuickActionItem) => void;
};

export function DashboardQuickActions({ actions, colors, isTurkish, onPress }: DashboardQuickActionsProps) {
  const visibleActions = actions.filter(action => (
    action.enabled && ['add-sub', 'cards', 'split-share'].includes(action.id)
  ));

  return (
    <View>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        {isTurkish ? 'Hızlı İşlemler' : 'Quick Actions'}
      </Text>
      <View style={styles.grid}>
        {visibleActions.map(action => (
          <SpringButton
            key={action.id}
            style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onPress(action)}
          >
            <View style={[styles.icon, { backgroundColor: action.badgeColorBg }]}>
              <Ionicons name={action.icon as IconName} size={20} color={action.color} />
            </View>
            <Text numberOfLines={1} style={[styles.label, { color: colors.text }]}>
              {isTurkish ? action.titleTr : action.titleEn}
            </Text>
          </SpringButton>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 8 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  button: { flex: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, gap: 6, overflow: 'hidden' },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label: { fontSize: 12, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
});
