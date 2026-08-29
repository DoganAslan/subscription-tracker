import { useState } from 'react';
import { ActivityIndicator, FlatList, LayoutAnimation, Platform, StyleSheet, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useCards, useUpdateCard } from '@/features/cards/hooks/useCards';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { useWalletViewModel } from '@/features/wallet/hooks/useWalletViewModel';
import { WalletHeader } from '@/features/wallet/components/WalletHeader';
import { EmptyWalletState } from '@/features/wallet/components/EmptyWalletState';
import { WalletCardItem } from '@/features/wallet/components/WalletCardItem';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { triggerHaptic } from '@/utils/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);

export default function WalletScreen() {
  const { data: cards = [], isLoading: isLoadingCards } = useCards();
  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useSubscriptions();
  const updateCard = useUpdateCard();
  const { colors, isDark } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const router = useRouter();
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const viewModel = useWalletViewModel({ cards, subscriptions, baseCurrency });
  const walletCopy = t.walletPage;
  const commonCopy = t.common as Record<string, string>;
  const isTurkish = currentLanguage === 'tr';

  const addCard = () => { triggerHaptic('impactLight'); router.push('/(tabs)/wallet/add'); };

  if (isLoadingCards || isLoadingSubscriptions) return <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></SafeAreaView>;

  return <SafeAreaView style={[styles.container, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : 8 }]} edges={['top', 'left', 'right']}>
    <WalletHeader colors={colors} title={walletCopy?.myWallet || 'My Wallet'} cardCount={cards.length} linkedCount={viewModel.linkedSubscriptionCount} cardsLabel={walletCopy?.cards || 'Cards'} linkedLabel={walletCopy?.linkedSubs || 'Linked Subscriptions'} onAdd={addCard} />
    <FlatList
      data={viewModel.cardSummaries}
      keyExtractor={(summary, index) => summary.card.id || `card-${index}`}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<EmptyWalletState colors={colors} title={walletCopy?.noCardsAdded || 'No Cards Added Yet'} description={walletCopy?.createAVirtualCardTo || 'Add a payment card to organize your subscriptions and link recurring payments.'} action={walletCopy?.addMethod || 'Add First Card'} onAdd={addCard} />}
      renderItem={({ item: summary }) => {
        const cardId = summary.card.id;
        if (!cardId) return null;
        return <WalletCardItem
          summary={summary}
          allSubscriptions={subscriptions}
          colors={colors}
          isDark={isDark}
          isTurkish={isTurkish}
          currencySymbol={viewModel.currencySymbol}
          expanded={expandedCardId === cardId}
          copy={{ linkedSubscriptions: walletCopy?.linkedSubscriptions || 'Linked Subscriptions', edit: commonCopy.edit || 'Edit', noLinked: walletCopy?.noLinkedSubs || 'No subscriptions linked to this card yet.', goToSubscriptions: walletCopy?.goToSubscriptions || 'Go to Subscriptions →' }}
          onTogglePin={() => { triggerHaptic('medium'); updateCard.mutate({ id: cardId, data: { isPinned: !summary.card.isPinned } }); }}
          onToggleExpanded={() => { triggerHaptic('selection'); if (Platform.OS !== 'web') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpandedCardId(current => current === cardId ? null : cardId); }}
          onEdit={() => { triggerHaptic('selection'); router.navigate({ pathname: '/(tabs)/wallet/[id]', params: { id: cardId } }); }}
          onOpenSubscription={id => { triggerHaptic('selection'); router.push(`/(tabs)/subscriptions/${id}`); }}
          onOpenSubscriptions={() => router.push('/(tabs)/subscriptions')}
        />;
      }}
    />
  </SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, list: { paddingHorizontal: 20, paddingBottom: 140 } });
