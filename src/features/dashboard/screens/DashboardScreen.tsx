import { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  Text,
  RefreshControl,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { SubscriptionCard } from '@/features/subscriptions/components/SubscriptionCard';
import { SubscriptionSkeleton } from '@/features/subscriptions/components/SubscriptionSkeleton';
import { CategoryBreakdownCard } from '@/features/dashboard/components/CategoryBreakdownCard';
import { AiSummaryCard } from '@/features/ai/components/AiSummaryCard';
import { getSavedQuickActions, QuickActionItem, ALL_QUICK_ACTIONS } from '@/features/dashboard/services/quickActionsStore';
import { exportVaultBackup } from '@/utils/vault';
import { exportCsvReport } from '@/utils/reportExporter';
import { getSavedHeroGradient } from '@/utils/heroTheme';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProfileStore } from '@/store/useProfileStore';
import { triggerHaptic } from '@/utils/haptics';
import { getUnreadNotificationCount, requestNotificationPermissions } from '@/services/notificationService';
import { getMarketRatesWithDynamicCache, ExchangeRates, SUPPORTED_CURRENCIES } from '@/utils/currency';
import { useDashboardViewModel } from '@/features/dashboard/hooks/useDashboardViewModel';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { SubscriptionSearch } from '@/features/dashboard/components/SubscriptionSearch';
import { MonthlySpendHero } from '@/features/dashboard/components/MonthlySpendHero';
import { DashboardQuickActions } from '@/features/dashboard/components/DashboardQuickActions';
import { DashboardAlerts } from '@/features/dashboard/components/DashboardAlerts';
import { SpendingOverview } from '@/features/dashboard/components/SpendingOverview';
import { DashboardOverlays } from '@/features/dashboard/components/DashboardOverlays';
import { ResponsiveContent } from '@/components/layout/ResponsiveContent';


export default function DashboardScreen() {
  const [liveRates, setLiveRates] = useState<ExchangeRates | null>(null);
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [heroColors, setHeroColors] = useState<[string, string, string]>(['#2563EB', '#1D4ED8', '#1E40AF']);
  const [isHeroThemeModalVisible, setHeroThemeModalVisible] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickActionItem[]>(ALL_QUICK_ACTIONS);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isWrappedModalOpen, setIsWrappedModalOpen] = useState(false);
  const [isAiChatVisible, setIsAiChatVisible] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const { data: subscriptions, isLoading, refetch, isRefetching } = useSubscriptions();
  const { baseCurrency } = useCurrencyStore();
  const monthlyBudget = useBudgetStore(state => state.monthlyBudget);
  const user = useAuthStore(state => state.user);
  const { profileImage, displayName } = useProfileStore();
  const userName = displayName?.trim() || user?.displayName?.trim() || '';
  const router = useRouter();
  const { colors } = useTheme();

  const screenTopSpacing = Platform.OS === 'web' ? 16 : 6;

  useEffect(() => {
    requestNotificationPermissions();
    getMarketRatesWithDynamicCache().then(setLiveRates).catch(console.error);
    getSavedHeroGradient().then(setHeroColors);
    getSavedQuickActions().then(setQuickActions);

  }, [user]);

  const refreshNotificationBadge = useCallback(() => {
    getUnreadNotificationCount().then(setUnreadNotificationCount).catch(() => setUnreadNotificationCount(0));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshNotificationBadge();
    }, [refreshNotificationBadge]),
  );

  const activeCurrency = baseCurrency || 'USD';
  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === activeCurrency)?.symbol || activeCurrency;

  const dashboard = useDashboardViewModel(subscriptions, searchQuery, liveRates);
  const {
    isSearching,
    filteredSubscriptions,
    listSubscriptions: listData,
    monthlyTotal: totalMonthlySpend,
    contractAlerts: doomedList,
  } = dashboard;

  // Greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (isTurkish) {
      if (hour < 12) return 'Günaydın';
      if (hour < 18) return 'İyi günler';
      return 'İyi akşamlar';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedWhole = Math.floor(totalMonthlySpend).toLocaleString(isTurkish ? 'tr-TR' : 'en-US');
  const formattedDecimals = (totalMonthlySpend % 1).toFixed(2).substring(1); // e.g. .34

  const categoryBreakdown = dashboard.categoryBreakdown.slice(0, 4);

  const handleQuickAction = (action: QuickActionItem) => {
    triggerHaptic('impactLight');
    if (action.actionType === 'route' && action.routePath) {
      router.push(action.routePath as never);
      return;
    }
    if (action.actionType === 'action_vault') {
      void exportVaultBackup();
      return;
    }
    if (action.actionType === 'action_csv') {
      const reportSubscriptions = (subscriptions || []).map(subscription => ({
        name: subscription.name,
        category: subscription.category,
        amount: subscription.amount,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        status: subscription.status ?? 'active',
        notes: subscription.notes,
      }));
      void exportCsvReport(reportSubscriptions, baseCurrency);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: screenTopSpacing }]}
        edges={['top', 'left', 'right']}
      >
        <View style={{ padding: 16 }}>
          <SubscriptionSkeleton count={5} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: screenTopSpacing }]}
      edges={['top', 'left', 'right']}
    >
      <ResponsiveContent testID="dashboard-responsive-content" style={styles.responsiveContent}>
        <FlatList
          data={listData}
          keyExtractor={(item, index) => item.id || `sub-${index}`}
          renderItem={({ item }) => (
            <SubscriptionCard subscription={item} compact={true} />
          )}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: 160,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <View style={{ gap: 20, marginBottom: 16 }}>
            <DashboardHeader
              colors={colors}
              greeting={getGreeting()}
              userName={userName}
              userPhoto={profileImage || user?.photoURL}
              unreadNotificationCount={unreadNotificationCount}
              onOpenProfile={() => {
                triggerHaptic('impactLight');
                setIsProfileDrawerOpen(true);
              }}
              onOpenNotifications={() => {
                triggerHaptic('impactLight');
                router.push('/notifications');
              }}
            />

            <SubscriptionSearch
              colors={colors}
              isTurkish={isTurkish}
              query={searchQuery}
              results={filteredSubscriptions}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
            />

            <MonthlySpendHero
              colors={heroColors}
              isTurkish={isTurkish}
              showBalance={showBalance}
              currencySymbol={currencySymbol}
              formattedWhole={formattedWhole}
              formattedDecimals={formattedDecimals}
              onToggleBalance={() => setShowBalance(value => !value)}
              onOpenThemePicker={() => setHeroThemeModalVisible(true)}
            />

            <AiSummaryCard
              subscriptions={subscriptions || []}
              onPress={() => setIsAiChatVisible(true)}
            />

            <DashboardQuickActions actions={quickActions} colors={colors} isTurkish={isTurkish} onPress={handleQuickAction} />

            <DashboardAlerts
              alerts={doomedList}
              onPress={subscriptionId => router.push(`/(tabs)/subscriptions/${subscriptionId}` as never)}
            />

            <SpendingOverview
              colors={colors}
              isTurkish={isTurkish}
              currencySymbol={currencySymbol}
              formattedAmount={`${formattedWhole}${formattedDecimals}`}
              monthlyTotal={totalMonthlySpend}
              monthlyBudget={monthlyBudget}
              categories={categoryBreakdown}
            />

            <CategoryBreakdownCard
              breakdown={dashboard.categoryBreakdown}
              monthlyTotal={dashboard.monthlyTotal}
              subscriptions={subscriptions}
            />
            {/* 7. RECENT TRANSACTIONS / SEARCH RESULTS HEADER */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isSearching
                  ? (isTurkish ? `Arama Sonuçları (${filteredSubscriptions.length})` : `Search Results (${filteredSubscriptions.length})`)
                  : (isTurkish ? 'Son İşlemler' : 'Recent Transactions')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/subscriptions')} activeOpacity={0.7}>
                <Text style={styles.seeAllText}>{isTurkish ? 'Tümünü Gör' : 'See all'}</Text>
              </TouchableOpacity>
            </View>
            </View>
          }
          ListEmptyComponent={
            isSearching ? (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={44} color={colors.textSecondary} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {isTurkish ? 'Sonuç Bulunamadı' : 'No Results Found'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {isTurkish ? `"${searchQuery}" ile eşleşen abonelik bulunamadı` : `No subscriptions match "${searchQuery}"`}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setSearchQuery('')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>{isTurkish ? 'Aramayı Temizle' : 'Clear Search'}</Text>
              </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {isTurkish ? 'Henüz Abonelik Yok' : 'No Subscriptions Found'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {isTurkish ? 'İlk aboneliğinizi eklemek için aşağıdaki butona dokunun!' : 'Tap the button below to add your first subscription!'}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/subscriptions/add')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>{isTurkish ? '+ Abonelik Ekle' : '+ Add Subscription'}</Text>
              </TouchableOpacity>
              </View>
            )
          }
        />
      </ResponsiveContent>

      <DashboardOverlays
        colors={colors}
        isTurkish={isTurkish}
        user={user}
        userName={userName}
        profileImage={profileImage}
        subscriptions={subscriptions || []}
        baseCurrency={baseCurrency}
        isAiChatVisible={isAiChatVisible}
        isHeroThemePickerVisible={isHeroThemeModalVisible}
        isProfileDrawerVisible={isProfileDrawerOpen}
        isWrappedVisible={isWrappedModalOpen}
        onOpenAiChat={() => setIsAiChatVisible(true)}
        onCloseAiChat={() => setIsAiChatVisible(false)}
        onCloseHeroThemePicker={() => setHeroThemeModalVisible(false)}
        onSelectHeroTheme={setHeroColors}
        onCloseProfileDrawer={() => setIsProfileDrawerOpen(false)}
        onOpenWrapped={() => setIsWrappedModalOpen(true)}
        onCloseWrapped={() => setIsWrappedModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  responsiveContent: {
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
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  greetingCopy: {
    flex: 1,
    minWidth: 0,
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
    flexShrink: 1,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
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
    marginBottom: 0,
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
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 6,
    overflow: 'hidden',
  },
  quickActionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
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
