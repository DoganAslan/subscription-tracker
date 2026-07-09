import { useTranslation } from '@/context/LanguageContext';
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCards, useUpdateCard } from '@/features/cards/hooks/useCards';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { CardWidget } from '@/features/cards/components/CardWidget';
import { SavingBankWidget } from '@/features/wallet/components/SavingBankWidget';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { triggerHaptic } from '@/utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function WalletScreen() {
  const { data: cards = [], isLoading: isLoadingCards } = useCards();
  const { data: subscriptions = [], isLoading: isLoadingSubs } = useSubscriptions();
  const updateCardMutation = useUpdateCard();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, Platform.OS === 'web' ? 16 : 8);

  const handlePinToggle = (cardId: string, currentPinned: boolean) => {
    triggerHaptic('medium');
    updateCardMutation.mutate({ id: cardId, data: { isPinned: !currentPinned } });
  };

  const handleAddCard = () => {
    triggerHaptic('selection');
    router.push('/wallet/add');
  };

  const handleCardPress = (cardId: string) => {
    triggerHaptic('selection');
    router.push(`/wallet/${cardId}` as any);
  };

  if (isLoadingCards || isLoadingSubs) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop }]}>
      <LinearGradient
        colors={isDark ? ['#1e293b', colors.background] : ['#f8fafc', colors.background]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>{t.walletPage?.subtitle || 'Manage your payment methods'}</Text>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{t.walletPage?.title || 'My Wallet'}</Text>
          </View>
          <TouchableOpacity onPress={handleAddCard} style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<SavingBankWidget />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.border }]}>
              <Ionicons name="wallet-outline" size={48} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.walletPage?.noCardsAdded || 'No Cards Added'}</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{t.walletPage?.createAVirtualCardTo || 'Add a card to your wallet to start tracking subscriptions'}</Text>
            <TouchableOpacity onPress={handleAddCard} style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.emptyAddBtnText}>{t.walletPage?.addMethod || 'Add Method'}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.95} 
            onPress={() => handleCardPress(item.id!)}
            style={styles.cardWrapper}
          >
            <CardWidget 
              card={item} 
              subscriptions={subscriptions} 
              showPinToggle={true}
              onTogglePin={() => handlePinToggle(item.id!, !!item.isPinned)}
            />
          </TouchableOpacity>
        )}
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
  headerGradient: {
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100, // Space for tab bar
  },
  cardWrapper: {
    marginBottom: 16, // Use the natural shadow space from CardWidget
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 30,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyAddBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  }
});


