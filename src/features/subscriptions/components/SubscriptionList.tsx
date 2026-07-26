import React, { useState, useMemo } from 'react';
import { FlatList, RefreshControl, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { SubscriptionCard } from './SubscriptionCard';
import { AppLoader } from '@/components/common/AppLoader';
import { useTranslation } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { convertCurrency, SUPPORTED_CURRENCIES } from '@/utils/currency';
import { calculateMonthlyCosts } from '@/utils/calculations';
import { triggerHaptic } from '@/utils/haptics';

export function SubscriptionList() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data: subscriptions, isLoading, isError, refetch, isRefetching } = useSubscriptions();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'paused' | 'trials' | 'splits'>('all');

  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency)?.symbol || baseCurrency;

  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    
    return subscriptions.filter(sub => {
      // 1. Status filter
      if (activeFilter === 'active' && sub.status === 'paused') return false;
      if (activeFilter === 'paused' && sub.status !== 'paused') return false;
      if (activeFilter === 'trials' && !sub.isFreeTrial && !sub.isTrial) return false;
      if (activeFilter === 'splits' && !sub.isSplit) return false;

      // 2. Search query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = sub.name?.toLowerCase().includes(q);
        const matchCategory = sub.category?.toLowerCase().includes(q);
        const matchNotes = sub.notes?.toLowerCase().includes(q);
        return matchName || matchCategory || matchNotes;
      }

      return true;
    });
  }, [subscriptions, searchQuery, activeFilter]);

  const totalSpend = useMemo(() => {
    if (!subscriptions) return 0;
    let sum = 0;
    subscriptions.forEach(sub => {
      if (sub.status === 'paused') return;
      const costs = calculateMonthlyCosts(sub, baseCurrency);
      sum += costs.gross;
    });
    return sum;
  }, [subscriptions, baseCurrency]);

  if (isLoading) {
    return <AppLoader />;
  }

  if (isError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="alert-circle-outline" size={40} color="#EF4444" style={{ marginBottom: 8 }} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>{t.common.error}</Text>
        <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>{t.home.failedToLoad}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredSubscriptions}
      keyExtractor={(item, index) => item.id || `sub-list-${index}`}
      renderItem={({ item }) => <SubscriptionCard subscription={item} />}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 180 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={isRefetching} 
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 16 }}>
          {/* STATS HEADER CARD */}
          <View style={[styles.summaryBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Monthly Spend</Text>
              <Text style={[styles.summaryAmount, { color: colors.text }]}>
                {currencySymbol}{totalSpend.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.countBadge, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
              <Ionicons name="cube-outline" size={16} color="#2563EB" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#2563EB' }}>
                {subscriptions?.length || 0} Subscriptions
              </Text>
            </View>
          </View>

          {/* SEARCH BAR */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search subscriptions..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* FILTER PILLS ROW */}
          <View style={styles.filterRow}>
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'paused', label: 'Paused' },
              { id: 'trials', label: 'Free Trials' },
              { id: 'splits', label: 'Splits 👥' },
            ].map(tab => {
              const isActive = activeFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => {
                    triggerHaptic('selection');
                    setActiveFilter(tab.id as any);
                  }}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surface,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: isActive ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="receipt-outline" size={44} color={colors.textSecondary} style={{ marginBottom: 10 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchQuery.trim().length > 0 ? 'No Subscriptions Found' : 'No Subscriptions'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {searchQuery.trim().length > 0
              ? `No items match "${searchQuery}"`
              : activeFilter === 'splits' 
                ? 'No split subscriptions found.'
                : 'Add your first subscription using the button below!'}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  summaryBanner: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorContainer: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
