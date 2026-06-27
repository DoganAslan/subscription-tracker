import i18n from '@/locales/i18n';
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useCards } from '@/features/cards/hooks/useCards';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { CardWidget } from '@/features/cards/components/CardWidget';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { triggerHaptic } from '@/utils/haptics';

export default function WalletScreen() {
  const { data: cards = [], isLoading: isLoadingCards } = useCards();
  const { data: subscriptions = [], isLoading: isLoadingSubs } = useSubscriptions();
  const { colors } = useTheme();
  const router = useRouter();

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{i18n.t('global.wallet')}</Text>
        <TouchableOpacity onPress={handleAddCard} style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>{i18n.t('global.addCard')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{i18n.t('global.noCardsAdded')}</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{i18n.t('global.createAVirtualCardTo')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => handleCardPress(item.id!)}
            style={styles.cardWrapper}
          >
            <CardWidget card={item} subscriptions={subscriptions} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for tab bar
  },
  cardWrapper: {
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '80%',
  },
});
