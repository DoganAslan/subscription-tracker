import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CardWidget } from '@/features/cards/components/CardWidget';
import type { ThemeColors } from '@/theme/colors';
import type { Subscription } from '@/services/firebase/types';
import type { WalletCardSummary } from '@/features/wallet/hooks/useWalletViewModel';
import { getBillingCycleLabel, getCategoryLabel } from '@/utils/categoryMeta';

type Copy = { linkedSubscriptions: string; edit: string; noLinked: string; goToSubscriptions: string };

export function WalletCardItem({ summary, allSubscriptions, colors, isDark, isTurkish, currencySymbol, expanded, copy, onTogglePin, onToggleExpanded, onEdit, onOpenSubscription, onOpenSubscriptions }: {
  summary: WalletCardSummary;
  allSubscriptions: Subscription[];
  colors: ThemeColors;
  isDark: boolean;
  isTurkish: boolean;
  currencySymbol: string;
  expanded: boolean;
  copy: Copy;
  onTogglePin: () => void;
  onToggleExpanded: () => void;
  onEdit: () => void;
  onOpenSubscription: (id: string) => void;
  onOpenSubscriptions: () => void;
}) {
  const { card, linkedSubscriptions, monthlyCommitment, monthlyCommitmentBySubscriptionId, limitUsagePercent, isOverLimit } = summary;
  return <View style={styles.wrapper}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open ${card.name} details`} activeOpacity={0.9} onPress={onToggleExpanded} style={styles.cardButton}><CardWidget card={card} subscriptions={allSubscriptions} showPinToggle onTogglePin={onTogglePin} /></TouchableOpacity>
    {expanded ? <View style={[styles.panel, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]}>
      <View style={styles.header}><View style={styles.titleRow}><Ionicons name="layers-outline" size={16} color={colors.primary} /><Text style={[styles.title, { color: colors.text }]}>{copy.linkedSubscriptions}</Text>{linkedSubscriptions.length > 0 ? <View style={[styles.countBadge, { backgroundColor: colors.primary }]}><Text style={styles.countText}>{linkedSubscriptions.length}</Text></View> : null}</View><View style={styles.actions}>{linkedSubscriptions.length > 0 ? <View style={styles.commitmentArea}><View style={styles.totalBadge}><Text style={styles.totalText}>{currencySymbol}{monthlyCommitment.toFixed(2)}{isTurkish ? '/ay' : '/mo'}</Text></View>{limitUsagePercent !== null ? <Text style={[styles.limitText, { color: isOverLimit ? '#EF4444' : colors.textSecondary }]}>{isTurkish ? `Limitin %${limitUsagePercent.toFixed(0)}’i` : `${limitUsagePercent.toFixed(0)}% of limit`}</Text> : null}</View> : null}<TouchableOpacity onPress={onEdit} style={[styles.edit, { backgroundColor: colors.border }]}><Ionicons name="pencil-outline" size={14} color={colors.text} /><Text style={[styles.editText, { color: colors.text }]}>{copy.edit}</Text></TouchableOpacity></View></View>
      {linkedSubscriptions.length === 0 ? <View style={styles.empty}><Ionicons name="link-outline" size={28} color={colors.textSecondary} /><Text style={[styles.emptyText, { color: colors.textSecondary }]}>{copy.noLinked}</Text><TouchableOpacity onPress={onOpenSubscriptions} style={[styles.linkButton, { borderColor: colors.primary }]}><Text style={[styles.linkText, { color: colors.primary }]}>{copy.goToSubscriptions}</Text></TouchableOpacity></View> : linkedSubscriptions.map(subscription => <TouchableOpacity key={subscription.id} activeOpacity={0.75} onPress={() => subscription.id && onOpenSubscription(subscription.id)} style={[styles.subscription, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.subscriptionIdentity}><View style={[styles.subscriptionIcon, { backgroundColor: colors.border }]}><Ionicons name="cube-outline" size={16} color={colors.primary} /></View><View style={styles.subscriptionCopy}><Text style={[styles.subscriptionName, { color: colors.text }]} numberOfLines={1}>{subscription.name}</Text><Text style={[styles.subscriptionCycle, { color: colors.textSecondary }]}>{getBillingCycleLabel(subscription.billingCycle, isTurkish)} • {getCategoryLabel(subscription.category || '', isTurkish)}</Text></View></View><View style={styles.priceArea}><Text style={[styles.price, { color: colors.text }]}>{currencySymbol}{(monthlyCommitmentBySubscriptionId[String(subscription.id || subscription.name)] || 0).toFixed(2)}</Text><Text style={[styles.nativePrice, { color: colors.textSecondary }]}>{subscription.currency || 'TRY'} {subscription.amount}</Text></View></TouchableOpacity>)}
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 }, cardButton: { borderRadius: 24 }, panel: { borderRadius: 18, borderWidth: 1, padding: 14, marginTop: -8, paddingTop: 18, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }, title: { fontSize: 13, fontWeight: '800' }, countBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }, countText: { color: '#FFF', fontSize: 10, fontWeight: '800' }, actions: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }, commitmentArea: { alignItems: 'flex-end' }, totalBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.12)' }, totalText: { fontSize: 11, fontWeight: '800', color: '#10B981' }, limitText: { fontSize: 9, marginTop: 2 }, edit: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }, editText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 16, gap: 8 }, emptyText: { fontSize: 12, textAlign: 'center', fontStyle: 'italic' }, linkButton: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 }, linkText: { fontSize: 12, fontWeight: '700' }, subscription: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 8 }, subscriptionIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }, subscriptionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, subscriptionCopy: { flex: 1 }, subscriptionName: { fontSize: 13, fontWeight: '700' }, subscriptionCycle: { fontSize: 11, marginTop: 1 }, priceArea: { alignItems: 'flex-end' }, price: { fontSize: 13, fontWeight: '800' }, nativePrice: { fontSize: 10, marginTop: 1 },
});
