import React, { useMemo, useEffect, useState } from 'react';
import {
  ScrollView,
  FlatList,
  Text,
  SafeAreaView,
  RefreshControl,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  InteractionManager,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { useCards } from '@/features/cards/hooks/useCards';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProfileStore } from '@/store/useProfileStore';

import { SubscriptionCard } from '@/features/subscriptions/components/SubscriptionCard';
import { SubscriptionSkeleton } from '@/features/subscriptions/components/SubscriptionSkeleton';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DoomBanner } from '@/components/DoomBanner';
import { CardWidget } from '@/components/CardWidget';
import { CategoryBreakdownCard } from '@/features/dashboard/components/CategoryBreakdownCard';

import { convertCurrency, getMarketRatesWithDynamicCache, ExchangeRates, SUPPORTED_CURRENCIES } from '@/utils/currency';
import { calculateMonthlyCosts } from '@/utils/calculations';
import { calculateDoomStatus, getTrialHoursLeft } from '@/utils/date';
import { triggerHaptic } from '@/utils/haptics';
import { requestNotificationPermissions } from '@/utils/notifications';

const PROFILE_NAME_KEY = '@profile_name';

export default function DashboardScreen() {
  const [liveRates, setLiveRates] = useState<ExchangeRates | null>(null);
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  const { t } = useTranslation();
  const { data: subscriptions, isLoading, isError, refetch, isRefetching } = useSubscriptions();
  const { data: realCards = [] } = useCards();
  const { baseCurrency, setBaseCurrency } = useCurrencyStore();
  const user = useAuthStore(state => state.user);
  const { profileImage } = useProfileStore();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, Platform.OS === 'web' ? 16 : 12);

  useEffect(() => {
    requestNotificationPermissions();
    getMarketRatesWithDynamicCache().then(setLiveRates).catch(console.error);

    AsyncStorage.getItem(PROFILE_NAME_KEY).then(savedName => {
      if (savedName) setUserName(savedName);
      else setUserName(user?.displayName || 'Tega');
    });
  }, [user]);

  const activeCurrency = baseCurrency || 'USD';
  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === activeCurrency)?.symbol || activeCurrency;

  const isSearching = searchQuery.trim().length > 0;

  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return subscriptions.filter(sub => {
      const matchName = sub.name?.toLowerCase().includes(q);
      const matchCategory = sub.category?.toLowerCase().includes(q);
      const matchNotes = sub.notes?.toLowerCase().includes(q);
      const matchAmount = String(sub.amount)?.includes(q);
      const matchCurrency = sub.currency?.toLowerCase().includes(q);
      const matchCycle = sub.billingCycle?.toLowerCase().includes(q);
      return matchName || matchCategory || matchNotes || matchAmount || matchCurrency || matchCycle;
    });
  }, [subscriptions, searchQuery]);

  const upcomingPayments = useMemo(() => {
    if (!subscriptions) return [];
    return [...subscriptions]
      .filter(sub => !sub.isPaused)
      .sort((a, b) => {
        const dateA = a.renewalDate?.toMillis ? a.renewalDate.toMillis() : 0;
        const dateB = b.renewalDate?.toMillis ? b.renewalDate.toMillis() : 0;
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [subscriptions]);

  const listData = isSearching ? filteredSubscriptions : upcomingPayments;

  const metrics = useAnalytics(subscriptions);

  const totalMonthlySpend = useMemo(() => {
    let gross = 0;
    if (Array.isArray(subscriptions)) {
      subscriptions.forEach(sub => {
        if (sub.isPaused || sub.status === 'paused') return;
        const costs = calculateMonthlyCosts(sub, activeCurrency);
        gross += costs.gross;
      });
    }
    return gross;
  }, [subscriptions, activeCurrency]);

  const doomedList = useMemo(() => {
    if (!subscriptions) return [];
    return subscriptions
      .map(sub => {
        const doom = calculateDoomStatus(sub.contractEndDate);
        return {
          subId: sub.id,
          subName: sub.name,
          daysLeft: doom.daysLeft,
          severity: doom.severity,
        };
      })
      .filter(item => item.severity === 'warning' || item.severity === 'critical')
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [subscriptions]);

  const activeTrials = useMemo(() => {
    if (!subscriptions) return [];
    return subscriptions.filter(sub => {
      if (!sub.isTrial) return false;
      const hoursLeft = getTrialHoursLeft(sub.trialEndDate as string | null);
      return hoursLeft <= 72 && hoursLeft >= 0;
    });
  }, [subscriptions]);

  // Greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedWhole = Math.floor(totalMonthlySpend).toLocaleString('en-US');
  const formattedDecimals = (totalMonthlySpend % 1).toFixed(2).substring(1); // e.g. .34

  const categoryBreakdown = useMemo(() => {
    if (!metrics?.categoryBreakdown) return [];
    return metrics.categoryBreakdown.slice(0, 4);
  }, [metrics]);

  const categoryColors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={{ padding: 16, paddingTop }}>
          <SubscriptionSkeleton count={5} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background, paddingTop }]}>
      <FlatList
        data={listData}
        keyExtractor={(item, index) => item.id || `sub-${index}`}
        renderItem={({ item }) => (
          <SubscriptionCard subscription={item} compact={true} />
        )}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={{ gap: 20, marginBottom: 16 }}>
            {/* 1. PROFILE & GREETING HEADER */}
            <View style={styles.topHeader}>
              <TouchableOpacity
                style={styles.profileRow}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/settings')}
              >
                {profileImage || user?.photoURL ? (
                  <Image source={{ uri: profileImage || user?.photoURL || '' }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{userName ? userName.charAt(0).toUpperCase() : 'U'}</Text>
                  </View>
                )}
                <View>
                  <Text style={[styles.greetingText, { color: colors.text }]}>
                    {getGreeting()}, {userName.split(' ')[0]} 👋
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bellButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/settings')}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.text} />
                <View style={styles.badgeDot} />
              </TouchableOpacity>
            </View>

            {/* 2. SEARCH BAR */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search subscriptions, transactions..."
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

            {/* INSTANT SEARCH RESULTS CARD */}
            {searchQuery.trim().length > 0 && (
              <View style={[styles.searchResultsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.searchResultsHeader}>
                  <Text style={[styles.searchResultsTitle, { color: colors.text }]}>
                    Search Results ({filteredSubscriptions.length})
                  </Text>
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Clear</Text>
                  </TouchableOpacity>
                </View>

                {filteredSubscriptions.length > 0 ? (
                  <View style={{ gap: 10, marginTop: 10 }}>
                    {filteredSubscriptions.map((sub, idx) => (
                      <SubscriptionCard key={sub.id || `search-${idx}`} subscription={sub} compact={true} />
                    ))}
                  </View>
                ) : (
                  <View style={styles.noSearchBox}>
                    <Ionicons name="search-outline" size={32} color={colors.textSecondary} style={{ marginBottom: 6 }} />
                    <Text style={[styles.noSearchTitle, { color: colors.text }]}>No matching subscriptions</Text>
                    <Text style={[styles.noSearchSubtitle, { color: colors.textSecondary }]}>
                      We couldn't find anything matching "{searchQuery}"
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 3. HERO BALANCE GRADIENT CARD */}
            <LinearGradient
              colors={['#2563EB', '#1D4ED8', '#1E40AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              {/* Card Header Row */}
              <View style={styles.heroCardHeader}>
                <Text style={styles.heroCardTitle}>Total Monthly Spend</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity onPress={() => setShowBalance(!showBalance)} activeOpacity={0.7}>
                    <Ionicons name={showBalance ? 'eye-outline' : 'eye-off-outline'} size={20} color="#E0E7FF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} activeOpacity={0.7}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#E0E7FF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Amount Display */}
              <View style={styles.heroAmountRow}>
                {showBalance ? (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={styles.heroCurrencySymbol}>{currencySymbol}</Text>
                    <Text style={styles.heroAmountWhole}>{formattedWhole}</Text>
                    <Text style={styles.heroAmountDecimals}>{formattedDecimals}</Text>
                  </View>
                ) : (
                  <Text style={styles.heroAmountHidden}>••••••••</Text>
                )}
              </View>

              {/* Monthly Growth Badge */}
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="arrow-up" size={12} color="#10B981" />
                  <Text style={styles.heroBadgeText}>8.2% this month</Text>
                </View>
              </View>

              {/* Currency Selectors */}
              <View style={styles.currencyPillsRow}>
                {['USD', 'EUR', 'GBP', 'TRY'].map(curr => {
                  const isActive = activeCurrency === curr;
                  return (
                    <TouchableOpacity
                      key={curr}
                      onPress={() => {
                        triggerHaptic('light');
                        setBaseCurrency(curr);
                      }}
                      style={[
                        styles.currencyPill,
                        isActive ? styles.currencyPillActive : styles.currencyPillInactive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.currencyPillText, isActive ? styles.currencyPillTextActive : styles.currencyPillTextInactive]}>
                        {curr === 'USD' ? '🇺🇸 ' : curr === 'EUR' ? '🇪🇺 ' : curr === 'GBP' ? '🇬🇧 ' : '🇹🇷 '}
                        {curr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </LinearGradient>

            {/* 4. QUICK ACTION GRID */}
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/subscriptions/add')}
              >
                <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
                  <Ionicons name="add" size={22} color="#2563EB" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>Add Sub</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/subscriptions')}
              >
                <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <Ionicons name="swap-horizontal" size={20} color="#10B981" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>Split Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/wallet')}
              >
                <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                  <Ionicons name="card" size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>Cards</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/analytics')}
              >
                <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                  <Ionicons name="stats-chart" size={20} color="#8B5CF6" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>Analytics</Text>
              </TouchableOpacity>
            </View>

            {/* 5. DOOM BANNERS & TRIALS */}
            {doomedList.length > 0 && (
              <View style={{ gap: 8 }}>
                {doomedList.map(item => (
                  <DoomBanner
                    key={item.subId}
                    subName={item.subName}
                    daysLeft={item.daysLeft}
                    severity={item.severity as 'warning' | 'critical'}
                    onPress={() => router.push(`/(tabs)/subscriptions/${item.subId}` as any)}
                  />
                ))}
              </View>
            )}

            {/* 6. SPENDING OVERVIEW & DONUT CARD */}
            <View style={[styles.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.overviewHeader}>
                <Text style={[styles.overviewTitle, { color: colors.text }]}>Spending Overview</Text>
                <View style={styles.monthBadge}>
                  <Text style={styles.monthBadgeText}>This Month</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                </View>
              </View>

              <View style={styles.overviewContent}>
                {/* Left Side: Spend amount and budget progress */}
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.overviewAmount, { color: colors.text }]}>
                    {currencySymbol}{formattedWhole}{formattedDecimals}
                  </Text>
                  <Text style={[styles.overviewLimitText, { color: colors.textSecondary }]}>
                    of {currencySymbol}3,500 limit
                  </Text>

                  {/* Progress Bar */}
                  <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.round((totalMonthlySpend / 3500) * 100))}%`,
                          backgroundColor: '#2563EB',
                        },
                      ]}
                    />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB', marginTop: 4 }}>
                    {Math.min(100, Math.round((totalMonthlySpend / 3500) * 100))}% Used
                  </Text>
                </View>

                {/* Right Side: Category Legend Dots */}
                <View style={styles.categoryLegendBox}>
                  {categoryBreakdown.map((cat, idx) => (
                    <View key={cat.category} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: categoryColors[idx % categoryColors.length] }]} />
                      <Text style={[styles.legendLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                        {cat.category}
                      </Text>
                      <Text style={[styles.legendValue, { color: colors.text }]}>
                        {cat.percentage.toFixed(0)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <CategoryBreakdownCard breakdown={metrics.categoryBreakdown} monthlyTotal={metrics.monthlyTotal} subscriptions={subscriptions} />

            {/* 7. RECENT TRANSACTIONS / SEARCH RESULTS HEADER */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isSearching ? `Search Results (${filteredSubscriptions.length})` : 'Recent Transactions'}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/subscriptions')} activeOpacity={0.7}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          isSearching ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={44} color={colors.textSecondary} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                No subscriptions match "{searchQuery}"
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setSearchQuery('')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Subscriptions Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Tap the button below to add your first subscription!
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/subscriptions/add')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>+ Add Subscription</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      <FloatingActionButton onPress={() => router.push('/(tabs)/subscriptions/add')} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroCardTitle: {
    color: '#E0E7FF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  heroAmountRow: {
    marginTop: 12,
    marginBottom: 8,
  },
  heroCurrencySymbol: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginRight: 4,
  },
  heroAmountWhole: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroAmountDecimals: {
    color: '#C7D2FE',
    fontSize: 20,
    fontWeight: '700',
  },
  heroAmountHidden: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  heroBadgeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  currencyPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  currencyPillActive: {
    backgroundColor: '#FFFFFF',
  },
  currencyPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  currencyPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  currencyPillTextActive: {
    color: '#1E40AF',
  },
  currencyPillTextInactive: {
    color: '#FFFFFF',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 6,
  },
  quickActionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  overviewCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewAmount: {
    fontSize: 22,
    fontWeight: '800',
  },
  overviewLimitText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 10,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryLegendBox: {
    width: 130,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  legendValue: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  seeAllText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  searchResultsCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  searchResultsTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  noSearchBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSearchTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  noSearchSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
