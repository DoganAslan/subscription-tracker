import { useTranslation } from '@/context/LanguageContext';
import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, LayoutAnimation, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCards, useUpdateCard } from '@/features/cards/hooks/useCards';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { CardWidget } from '@/features/cards/components/CardWidget';
import { SavingBankWidget } from '@/features/wallet/components/SavingBankWidget';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { triggerHaptic } from '@/utils/haptics';
import { convertCurrency, SUPPORTED_CURRENCIES } from '@/utils/currency';
import { useCurrencyStore } from '@/store/useCurrencyStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WalletScreen() {
  const { data: cards = [], isLoading: isLoadingCards } = useCards();
  const { data: subscriptions = [], isLoading: isLoadingSubs } = useSubscriptions();
  const updateCardMutation = useUpdateCard();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { t, currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, Platform.OS === 'web' ? 16 : 12);
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency)?.symbol || baseCurrency;

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const handlePinToggle = (cardId: string, currentPinned: boolean) => {
    triggerHaptic('medium');
    updateCardMutation.mutate({ id: cardId, data: { isPinned: !currentPinned } });
  };

  const handleAddCard = () => {
    triggerHaptic('impactLight');
    router.push('/(tabs)/wallet/add');
  };

  const handleCardPress = (cardId: string) => {
    triggerHaptic('selection');
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedCardId(prev => prev === cardId ? null : cardId);
  };

  const handleEditCard = (cardId: string) => {
    triggerHaptic('selection');
    router.navigate({ pathname: '/(tabs)/wallet/[id]', params: { id: cardId } });
  };

  const getLinkedSubs = (cardId: string) =>
    subscriptions.filter(s => s.cardId === cardId && s.status !== 'paused');

  const getCardMonthlyTotal = (cardId: string) => {
    const subs = subscriptions.filter(s => s.cardId === cardId && s.status !== 'paused');
    return subs.reduce((sum, sub) => {
      const amount = typeof sub.amount === 'number' ? sub.amount : parseFloat(sub.amount) || 0;
      return sum + convertCurrency(amount, sub.currency || 'TRY', baseCurrency);
    }, 0);
  };

  if (isLoadingCards || isLoadingSubs) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const linkedSubsCount = subscriptions.filter(s => s.cardId).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop }]}>
      {/* Title & Add Button Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{t.walletPage?.myWallet || 'My Wallet'}</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
            {cards.length} {t.walletPage?.cards || 'Cards'} • {linkedSubsCount} {t.walletPage?.linkedSubs || 'Linked Subscriptions'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleAddCard}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item, index) => item.id || `card-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <SavingBankWidget />
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.border }]}>
              <Ionicons name="card-outline" size={44} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t.walletPage?.noCardsAdded || 'No Cards Added Yet'}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              {t.walletPage?.createAVirtualCardTo || 'Add a payment card to organize your subscriptions and link recurring payments.'}
            </Text>
            <TouchableOpacity
              onPress={handleAddCard}
              style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyAddBtnText}>{t.walletPage?.addMethod || 'Add First Card'}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedCardId === item.id;
          const linkedSubs = getLinkedSubs(item.id!);
          const monthlyTotal = getCardMonthlyTotal(item.id!);

          return (
            <View style={styles.cardWrapper}>
              {/* Card visual – tap to expand */}
              <TouchableOpacity activeOpacity={0.9} onPress={() => handleCardPress(item.id!)} style={{ borderRadius: 24 }}>
                <CardWidget
                  card={item}
                  subscriptions={subscriptions}
                  showPinToggle={true}
                  onTogglePin={() => handlePinToggle(item.id!, !!item.isPinned)}
                />
              </TouchableOpacity>

              {/* Expandable details panel */}
              {isExpanded && (
                <View style={[styles.detailsPanel, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]}>
                  {/* Panel header */}
                  <View style={styles.detailsHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="layers-outline" size={16} color={colors.primary} />
                      <Text style={[styles.detailsTitle, { color: colors.text }]}>
                        {t.walletPage?.linkedSubscriptions || 'Linked Subscriptions'}
                      </Text>
                      {linkedSubs.length > 0 && (
                        <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.countBadgeText}>{linkedSubs.length}</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {/* Monthly total for this card */}
                      {linkedSubs.length > 0 && (
                        <View style={[styles.totalBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                          <Text style={[styles.totalBadgeText, { color: '#10B981' }]}>
                            {currencySymbol}{monthlyTotal.toFixed(2)}{isTurkish ? '/ay' : '/mo'}
                          </Text>
                        </View>
                      )}
                      {/* Edit card button */}
                      <TouchableOpacity
                        onPress={() => handleEditCard(item.id!)}
                        style={[styles.editBtn, { backgroundColor: colors.border }]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="pencil-outline" size={14} color={colors.text} />
                        <Text style={[styles.editBtnText, { color: colors.text }]}>
                          {(t.common as any)?.edit || 'Edit'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Subscriptions list */}
                  {linkedSubs.length === 0 ? (
                    <View style={styles.noSubsBox}>
                      <Ionicons name="link-outline" size={28} color={colors.textSecondary} />
                      <Text style={[styles.noSubsText, { color: colors.textSecondary }]}>
                        {t.walletPage?.noLinkedSubs || 'No subscriptions linked to this card yet.'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => router.push('/(tabs)/subscriptions')}
                        style={[styles.linkSubsBtn, { borderColor: colors.primary }]}
                      >
                        <Text style={[styles.linkSubsBtnText, { color: colors.primary }]}>
                          {t.walletPage?.goToSubscriptions || 'Go to Subscriptions →'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    linkedSubs.map((sub) => {
                      const converted = convertCurrency(
                        typeof sub.amount === 'number' ? sub.amount : parseFloat(sub.amount) || 0,
                        sub.currency || 'TRY',
                        baseCurrency
                      );
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          activeOpacity={0.75}
                          onPress={() => {
                            triggerHaptic('selection');
                            router.push(`/(tabs)/subscriptions/${sub.id}`);
                          }}
                          style={[styles.subRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <View style={[styles.subIconBg, { backgroundColor: colors.border }]}>
                              <Ionicons name="cube-outline" size={16} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.subName, { color: colors.text }]} numberOfLines={1}>{sub.name}</Text>
                              <Text style={[styles.subCycle, { color: colors.textSecondary }]}>
                                {sub.billingCycle} • {sub.category || 'General'}
                              </Text>
                            </View>
                          </View>

                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.subPrice, { color: colors.text }]}>
                              {currencySymbol}{converted.toFixed(2)}
                            </Text>
                            <Text style={[styles.subNative, { color: colors.textSecondary }]}>
                              {sub.currency || 'TRY'} {sub.amount}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  detailsPanel: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginTop: -8,
    paddingTop: 18,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  totalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noSubsBox: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  noSubsText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  linkSubsBtn: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  linkSubsBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
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
    marginTop: 1,
  },
  subPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  subNative: {
    fontSize: 10,
    marginTop: 1,
  },
  emptyContainer: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 12,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
