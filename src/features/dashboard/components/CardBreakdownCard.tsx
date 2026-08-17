import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { Subscription, Card } from '@/services/firebase/types';
import { convertCurrency, SUPPORTED_CURRENCIES } from '@/utils/currency';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useRouter } from 'expo-router';
import { triggerHaptic } from '@/utils/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CardBreakdownCardProps {
  cards: Card[];
  subscriptions: Subscription[];
}

export const CardBreakdownCard: React.FC<CardBreakdownCardProps> = ({ cards, subscriptions }) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency)?.symbol || baseCurrency;

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Group subscriptions by card and calculate totals in baseCurrency
  const { cardStats, totalSpent } = useMemo(() => {
    let grandTotal = 0;
    const statsMap: Record<string, { card: Card | null; total: number; subs: Subscription[] }> = {};

    // Initialize cards map
    cards.forEach(card => {
      if (card.id) {
        statsMap[card.id] = { card, total: 0, subs: [] };
      }
    });

    // Unassigned card bucket
    statsMap['unassigned'] = { card: null, total: 0, subs: [] };

    // Distribute subscriptions
    subscriptions.forEach(sub => {
      if (sub.status === 'paused') return;
      const amount = typeof sub.amount === 'number' ? sub.amount : parseFloat(sub.amount) || 0;
      const converted = convertCurrency(amount, sub.currency || 'TRY', baseCurrency);
      grandTotal += converted;

      const targetId = sub.cardId && statsMap[sub.cardId] ? sub.cardId : 'unassigned';
      statsMap[targetId].total += converted;
      statsMap[targetId].subs.push(sub);
    });

    // Format list sorted by total spend descending
    const list = Object.values(statsMap)
      .filter(item => item.subs.length > 0 || (item.card && cards.length > 0))
      .sort((a, b) => b.total - a.total);

    return { cardStats: list, totalSpent: grandTotal };
  }, [cards, subscriptions, baseCurrency]);

  const toggleExpand = (id: string) => {
    triggerHaptic('selection');
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedCardId(prev => (prev === id ? null : id));
  };

  if (cards.length === 0 && subscriptions.every(s => !s.cardId)) {
    return null; // Hide if no cards and no card assignments exist
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8, overflow: 'hidden' }}>
          <View style={[styles.headerIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.12)', flexShrink: 0 }]}>
            <Ionicons name="card-outline" size={18} color="#6366F1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
              {t.analytics?.cardBreakdown || 'Card Spending Breakdown'}
            </Text>
            <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textSecondary }]}>
              Monthly spending per payment card
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/wallet')}
          style={[styles.manageBtn, { backgroundColor: colors.border, flexShrink: 0 }]}
        >
          <Text style={[styles.manageBtnText, { color: colors.text }]}>{t.tabs?.wallet || 'Wallet'}</Text>
          <Ionicons name="chevron-forward" size={12} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Cards Breakdown Rows */}
      <View style={styles.cardsList}>
        {cardStats.map((item) => {
          const itemKey = item.card ? item.card.id! : 'unassigned';
          const isExpanded = expandedCardId === itemKey;
          const percentage = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
          const cardName = item.card ? item.card.name : (t.walletPage?.unassignedCard || 'Unassigned / Cash');
          const lastFour = item.card?.lastFourDigits ? `•••• ${item.card.lastFourDigits}` : '';
          const cardType = item.card?.type ? item.card.type.toUpperCase() : '';

          return (
            <View 
              key={itemKey} 
              style={[
                styles.cardRowWrapper, 
                { borderColor: isExpanded ? colors.primary : colors.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleExpand(itemKey)}
                style={styles.cardHeader}
              >
                <View style={styles.cardInfoCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Ionicons 
                      name={item.card ? "card" : "help-circle-outline"} 
                      size={18} 
                      color={item.card ? colors.primary : colors.textSecondary} 
                    />
                    <Text style={[styles.cardNameText, { color: colors.text }]}>
                      {cardName} {lastFour ? <Text style={styles.lastFourText}>{lastFour}</Text> : null}
                    </Text>
                    {cardType ? (
                      <View style={[styles.badge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                        <Text style={[styles.badgeText, { color: '#6366F1' }]}>{cardType}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Progress Bar */}
                  <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${Math.min(100, Math.max(4, percentage))}%`, backgroundColor: item.card?.color || colors.primary }
                      ]} 
                    />
                  </View>
                </View>

                {/* Spend & Count */}
                <View style={styles.cardAmountCol}>
                  <Text style={[styles.amountText, { color: colors.text }]}>
                    {currencySymbol}{item.total.toFixed(2)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.subCountText, { color: colors.textSecondary }]}>
                      {item.subs.length} sub{item.subs.length === 1 ? '' : 's'} ({percentage.toFixed(0)}%)
                    </Text>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={14} 
                      color={colors.textSecondary} 
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Accordion Subscriptions List */}
              {isExpanded && (
                <View style={[styles.accordionContent, { borderTopColor: colors.border }]}>
                  {item.subs.length === 0 ? (
                    <Text style={[styles.noSubsText, { color: colors.textSecondary }]}>
                      No active subscriptions linked to this card yet.
                    </Text>
                  ) : (
                    item.subs.map((sub) => (
                      <TouchableOpacity
                        key={sub.id}
                        activeOpacity={0.7}
                        onPress={() => {
                          triggerHaptic('selection');
                          router.push(`/(tabs)/subscriptions/${sub.id}`);
                        }}
                        style={[styles.subRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={[styles.subIconBg, { backgroundColor: colors.border }]}>
                            <Ionicons name="cube-outline" size={16} color={colors.primary} />
                          </View>
                          <View>
                            <Text style={[styles.subName, { color: colors.text }]}>{sub.name}</Text>
                            <Text style={[styles.subCycle, { color: colors.textSecondary }]}>
                              {sub.billingCycle} • {sub.category || 'General'}
                            </Text>
                          </View>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.subPrice, { color: colors.text }]}>
                            {sub.currency || 'TRY'} {sub.amount.toFixed(2)}
                          </Text>
                          <Text style={[styles.subLinkHint, { color: colors.primary }]}>Details ›</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  manageBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardsList: {
    gap: 10,
  },
  cardRowWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardInfoCol: {
    flex: 1,
    marginRight: 12,
  },
  cardNameText: {
    fontSize: 14,
    fontWeight: '800',
  },
  lastFourText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardAmountCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  subCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  accordionContent: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 8,
  },
  noSubsText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  subIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subName: {
    fontSize: 13,
    fontWeight: '700',
  },
  subCycle: {
    fontSize: 11,
  },
  subPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  subLinkHint: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
