import type { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';
import type { CalendarPayment } from '../types';

type IconName = ComponentProps<typeof Ionicons>['name'];

type PaymentDayListProps = {
  colors: ThemeColors;
  isTurkish: boolean;
  selectedDay: number;
  monthName: string;
  payments: CalendarPayment[];
  baseCurrency: string;
  currencySymbol: string;
  categoryNames: Record<string, string>;
  onOpenSubscription: (id: string) => void;
};

const getCategoryMeta = (category: string): { icon: IconName; color: string; background: string } => {
  const normalized = category.toLocaleLowerCase();
  if (/(music|müzik|audio|spotify)/.test(normalized)) return { icon: 'musical-notes-outline', color: '#10B981', background: 'rgba(16, 185, 129, 0.12)' };
  if (/(entertain|eğlence|tv|video|stream|netflix)/.test(normalized)) return { icon: 'film-outline', color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.12)' };
  if (/(product|üretken|work|cloud|software|tool)/.test(normalized)) return { icon: 'briefcase-outline', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.12)' };
  if (/(health|fit|spor|sağlık|gym)/.test(normalized)) return { icon: 'fitness-outline', color: '#EF4444', background: 'rgba(239, 68, 68, 0.12)' };
  if (/(game|oyun)/.test(normalized)) return { icon: 'game-controller-outline', color: '#EC4899', background: 'rgba(236, 72, 153, 0.12)' };
  if (/(finan|sigorta|bank)/.test(normalized)) return { icon: 'wallet-outline', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.12)' };
  return { icon: 'sparkles-outline', color: '#6366F1', background: 'rgba(99, 102, 241, 0.12)' };
};

export function PaymentDayList({
  colors,
  isTurkish,
  selectedDay,
  monthName,
  payments,
  baseCurrency,
  currencySymbol,
  categoryNames,
  onOpenSubscription,
}: PaymentDayListProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={18} color={colors.primary} />
        <Text style={[styles.headerText, { color: colors.text }]}>
          {selectedDay} {monthName} • {isTurkish ? `Ödemeler (${payments.length})` : `Payments (${payments.length})`}
        </Text>
      </View>

      {payments.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="checkmark-circle-outline" size={36} color="#10B981" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{isTurkish ? 'Bugün yenilenecek ödeme yok' : 'No renewals due today'}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {isTurkish ? 'Bu tarih için planlanmış düzenli abonelik ödemesi bulunmuyor.' : 'No recurring subscription payments are scheduled for this date.'}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {payments.map(payment => {
            const subscription = payment.subscription;
            const meta = getCategoryMeta(subscription.category || subscription.name);
            const showConversion = subscription.currency !== baseCurrency;
            return (
              <TouchableOpacity
                key={`${subscription.id ?? subscription.name}-${payment.dueDate.toISOString()}`}
                onPress={() => subscription.id && onOpenSubscription(subscription.id)}
                activeOpacity={0.75}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.identity}>
                  <View style={[styles.icon, { backgroundColor: meta.background }]}>
                    <Ionicons name={meta.icon} size={22} color={meta.color} />
                  </View>
                  <View style={styles.copy}>
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{subscription.name}</Text>
                    <Text style={[styles.category, { color: colors.textSecondary }]} numberOfLines={1}>
                      {categoryNames[subscription.category] || subscription.category} • {subscription.billingCycle}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceArea}>
                  <View style={styles.priceCopy}>
                    <Text style={[styles.price, { color: colors.text }]}>
                      {showConversion ? `${currencySymbol}${payment.amountInBaseCurrency.toFixed(2)}` : `${subscription.currency} ${subscription.amount.toFixed(2)}`}
                    </Text>
                    {showConversion ? <Text style={[styles.converted, { color: colors.textSecondary }]}>({subscription.amount.toFixed(0)} {subscription.currency})</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  headerText: { fontSize: 15, fontWeight: '800' },
  emptyCard: { borderRadius: 18, padding: 24, borderWidth: 1, alignItems: 'center', gap: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  emptySubtitle: { fontSize: 12, textAlign: 'center' },
  list: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, padding: 14, borderWidth: 1 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  category: { fontSize: 12, fontWeight: '500' },
  priceArea: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priceCopy: { alignItems: 'flex-end' },
  price: { fontSize: 15, fontWeight: '800' },
  converted: { fontSize: 11, fontWeight: '500', marginTop: 1 },
});
