import React, { useMemo, useEffect, useState } from 'react';
import { ScrollView, FlatList, Text, SafeAreaView, RefreshControl, View, TouchableOpacity, StyleSheet, Platform, InteractionManager, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { useCards } from '@/features/cards/hooks/useCards';
import { useAnalytics } from '@/hooks/useAnalytics';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DashboardFilterBar } from '@/features/dashboard/components/DashboardFilterBar';
import { SummaryCard } from '@/features/dashboard/components/SummaryCard';
import { SmartAlternativesCard } from '@/features/dashboard/components/SmartAlternativesCard';
import { BundleAlertCard } from '@/features/dashboard/components/BundleAlertCard';
import { CurrencyRiskCard } from '@/features/dashboard/components/CurrencyRiskCard';
import { PausedSubscriptionsCard } from '@/features/dashboard/components/PausedSubscriptionsCard';
import { CategoryBreakdownCard } from '@/features/dashboard/components/CategoryBreakdownCard';
import { SpendingInsightsCard } from '@/features/dashboard/components/SpendingInsightsCard';
import { CostPerUseCard } from '@/features/dashboard/components/CostPerUseCard';
import { SubscriptionCard } from '@/features/subscriptions/components/SubscriptionCard';
import { SubscriptionSkeleton } from '@/features/subscriptions/components/SubscriptionSkeleton';
import { Header } from '@/components/common/Header';
import { CardWidget } from '@/components/CardWidget';
import { DoomBanner } from '@/components/DoomBanner';
import { calculateDoomStatus, getTrialHoursLeft } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';

import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { requestNotificationPermissions } from '@/utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { SummaryWidget } from '@/widgets/SummaryWidget';
import { useTranslation } from '@/context/LanguageContext';
import { convertCurrency, getMarketRatesWithDynamicCache, ExchangeRates } from '@/utils/currency';
import { calculateMonthlyCosts } from '@/utils/calculations';
import { generate6MonthProjection } from '@/utils/projection';
import { getContractDoomStatus } from '@/features/dashboard/utils/calculations';
import { analyzeFinancialHealth } from '@/utils/healthScore';

import { getMidnight } from '@/utils/dateHelpers';

const getGaugeColor = (score: number) => {
  if (score >= 80) return '#10B981'; // Emerald Green
  if (score >= 50) return '#F59E0B'; // Amber Yellow
  return '#EF4444'; // Crimson Red
};

export default function DashboardScreen() {
  const [liveRates, setLiveRates] = React.useState<ExchangeRates | null>(null);

  useEffect(() => {
    requestNotificationPermissions();
    getMarketRatesWithDynamicCache().then(setLiveRates).catch(console.error);
  }, []);

  const { t } = useTranslation();
  const { data: subscriptions, isLoading, isError, refetch, isRefetching } = useSubscriptions();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const router = useRouter();
  const { colors } = useTheme();
  
  const dynamicStyles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, Platform.OS === 'web' ? 16 : 0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const { data: realCards = [] } = useCards();

  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    return subscriptions.filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || sub.category === selectedCategory;
      const matchesCurrency = !selectedCurrency || sub.currency === selectedCurrency;
      return matchesSearch && matchesCategory && matchesCurrency;
    });
  }, [subscriptions, searchQuery, selectedCategory, selectedCurrency]);

  const isFilterActive = searchQuery !== '' || selectedCategory !== null || selectedCurrency !== null;

  const metrics = useAnalytics(subscriptions);

  const upcomingPayments = useMemo(() => {
    if (!subscriptions) return [];
    
    return [...subscriptions]
      .sort((a, b) => {
        const dateA = a.renewalDate?.toMillis ? a.renewalDate.toMillis() : 0;
        const dateB = b.renewalDate?.toMillis ? b.renewalDate.toMillis() : 0;
        return dateA - dateB;
      })
      .slice(0, 3);
  }, [subscriptions]);

  const activeDashboardCurrency = selectedCurrency || baseCurrency || 'USD'; 

  const dashboardMetrics = useMemo(() => {
    let gross = 0;
    let net = 0;

    if (Array.isArray(filteredSubscriptions)) {
      filteredSubscriptions.forEach(sub => {
        const costs = calculateMonthlyCosts(sub, activeDashboardCurrency);
        gross += costs.gross;
        net += costs.net;
      });
    }

    return { 
      totalGross: gross, 
      totalNet: net, 
    };
  }, [filteredSubscriptions, activeDashboardCurrency]);

  const { totalGross, totalNet } = dashboardMetrics;

  const chartData = useMemo(() => {
    return generate6MonthProjection(subscriptions, liveRates, activeDashboardCurrency);
  }, [subscriptions, liveRates, activeDashboardCurrency]);

  const maxAmount = useMemo(() => {
    const rawMax = Math.max(...chartData.map(d => d.totalAmount), 0);
    return rawMax > 0 ? rawMax : 1;
  }, [chartData]);

  const displayGross = totalGross !== undefined ? Number(totalGross).toFixed(2) : "0.00";
  const displayNet = totalNet !== undefined ? Number(totalNet).toFixed(2) : "0.00";

  useEffect(() => {
    const updateWidget = async () => {
      if (Platform.OS !== 'android') return;
      try {
        const nextPaymentName = upcomingPayments.length > 0 ? upcomingPayments[0].name : 'None';
        const nextPaymentDate = upcomingPayments.length > 0 
          ? upcomingPayments[0].renewalDate.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          : '--';
        const monthlyTotalFormatted = `${displayGross} ${baseCurrency}`;

        const widgetData = {
          monthlyTotal: monthlyTotalFormatted,
          nextPaymentName,
          nextPaymentDate
        };
        await AsyncStorage.setItem('widget_data', JSON.stringify(widgetData));

        requestWidgetUpdate({
          widgetName: 'SummaryWidget',
          renderWidget: () => (
            <SummaryWidget 
              monthlyTotal={monthlyTotalFormatted} 
              nextPaymentName={nextPaymentName} 
              nextPaymentDate={nextPaymentDate} 
            />
          ),
        });
      } catch (error) {
        console.error('Failed to update widget', error);
      }
    };

    const task = InteractionManager.runAfterInteractions(() => {
      updateWidget();
    });

    return () => task.cancel();
  }, [displayGross, upcomingPayments, baseCurrency]);

  const doomedList = useMemo(() => {
    if (!subscriptions) return [];
    
    return subscriptions
      .map(sub => {
        const doom = calculateDoomStatus(sub.contractEndDate);
        return {
          subId: sub.id,
          subName: sub.name,
          daysLeft: doom.daysLeft,
          severity: doom.severity
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

  const hasSubscriptions = upcomingPayments.length > 0;

  const healthData = React.useMemo(() => {
    return analyzeFinancialHealth(subscriptions || []);
  }, [subscriptions]);

  // 1. RESOLVE LOCALIZED STATUS TEXT
  const getScoreStatusText = () => {
    if (healthData.score >= 80) return t.healthScore?.excellent || 'Excellent Budget';
    if (healthData.score >= 50) return t.healthScore?.good || 'Good Budget';
    return t.healthScore?.warning || 'Budget Warning';
  };

  // 2. RESOLVE LOCALIZED DYNAMIC DUPES DESCRIPTION
  const getVampirAlertMessage = () => {
    if (healthData.vampireStats) {
      if (typeof t.healthScore?.vampirWarning === 'function') {
        return t.healthScore.vampirWarning(healthData.vampireStats.category, healthData.vampireStats.count);
      }
      return `Vampire Alert: Multiple entries found in "${healthData.vampireStats.category}".`;
    }
    return null;
  };

  const pinnedCards = React.useMemo(() => {
    return realCards?.filter(c => c.isPinned) || [];
  }, [realCards]);

  if (isLoading) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea}>
        <ScrollView 
          style={dynamicStyles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={dynamicStyles.scrollContent}
        >
          <Header title="SubMate" />
          <SubscriptionSkeleton count={5} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={dynamicStyles.errorContainer}>
        <Text style={dynamicStyles.errorText}>{t.home?.failedToLoad || 'Failed to load'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={[dynamicStyles.safeArea, { paddingTop, flex: 1, backgroundColor: '#030712' }]}>
      <FlatList
        data={upcomingPayments}
        keyExtractor={(item, index) => item.id || `virtual-sub-${index}`}
        renderItem={({ item, index }) => (
          <SubscriptionCard key={item.id || `virtual-sub-${index}`} subscription={item} compact={true} />
        )}
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingHorizontal: 16, 
          paddingTop: 16,
          paddingBottom: 140, // High bottom padding ensures the last card clears the floating tab bar perfectly
          gap: 12 
        }}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <>
        <View style={{ paddingBottom: 16 }}>
          <Header title="SubMate" />
          {/* Master Dashboard Content Constraint */}
          <View style={{ width: '100%', maxWidth: 1024, alignSelf: 'center' }}>
            <View style={{ width: '100%', marginBottom: 20 }}>
              <Text style={{ color: '#94A3B8', fontWeight: '700', fontSize: 10, letterSpacing: 1, marginBottom: 10, paddingHorizontal: 4 }}>
                ACTIVE PAYMENT WALLET ({pinnedCards.length})
              </Text>

              {pinnedCards.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                  {pinnedCards.map((card) => (
                    <View key={card.id} style={{ width: 315, marginRight: 12 }}>
                      <CardWidget
                        card={{
                          id: card.id || '',
                          cardName: card.name,
                          color: card.color || '#1E293B',
                          last4: card.lastFourDigits || '••••',
                          currencySymbol: card.currency === 'USD' ? '$' : card.currency === 'EUR' ? '€' : card.currency === 'GBP' ? '£' : '₺',
                          totalCommitment: 0
                        }}
                        onPress={() => router.push('/(tabs)/wallet')}
                      />
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  onPress={() => router.push('/(tabs)/wallet')}
                  style={{
                    width: '100%',
                    paddingVertical: 18,
                    paddingHorizontal: 16,
                    backgroundColor: 'rgba(59, 130, 246, 0.06)',
                    borderWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.25)',
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="star-outline" size={18} color="#3B82F6" />
                  <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>
                    {t.walletPage?.pinToDashboard || "Pin cards from the Wallet to show them here"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
              {doomedList.length > 0 && (
                <View style={{ marginBottom: 16, marginHorizontal: 16 }}>
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

              {activeTrials.length > 0 && (
                <View style={{ width: '100%', marginBottom: 16, gap: 8, paddingHorizontal: 16 }}>
                  {activeTrials.map(trial => {
                    const hoursLeft = getTrialHoursLeft(trial.trialEndDate as string | null);
                    const isUrgent = hoursLeft <= 24; // Less than 1 day left!

                    return (
                      <View key={trial.id} style={{
                        width: '100%',
                        padding: 12,
                        backgroundColor: isUrgent ? 'rgba(239, 68, 68, 0.05)' : 'rgba(30, 41, 59, 0.5)',
                        borderWidth: 1,
                        borderColor: isUrgent ? '#EF4444' : '#334155',
                        borderRadius: 12,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Ionicons name="time-outline" size={20} color={isUrgent ? '#EF4444' : '#60A5FA'} />
                          <Text style={{ color: '#F8FAFC', fontSize: 13, fontWeight: '600' }}>
                            {trial.name} <Text style={{ color: '#94A3B8', fontWeight: '400' }}>{t.features?.trialVersionTag || 'Trial Version'}</Text>
                          </Text>
                        </View>

                        <View style={{
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          backgroundColor: isUrgent ? '#EF4444' : '#1E293B',
                          borderRadius: 6
                        }}>
                          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>
                            {isUrgent 
                              ? (t.features?.lastXHours?.replace('{{hours}}', String(hoursLeft)) || `🚨 FINAL ${hoursLeft} HOURS`) 
                              : (t.features?.xHoursLeft?.replace('{{hours}}', String(hoursLeft)) || `${hoursLeft} HOURS LEFT`)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            <SummaryCard 
              monthlyTotal={Number(displayGross)} 
              monthlyNetTotal={Number(displayNet) >= 0 ? Number(displayNet) : Number(displayGross)} 
            />

            <PausedSubscriptionsCard subscriptions={subscriptions || []} />
            <CurrencyRiskCard subscriptions={subscriptions || []} baseCurrency={baseCurrency} liveRates={liveRates} />
            <BundleAlertCard subscriptions={subscriptions || []} />
            <SmartAlternativesCard subscriptions={subscriptions || []} />

            {/* VAMPIRE METER CARD */}
            <View style={{
              width: '100%',
              backgroundColor: '#1E293B',
              borderWidth: 1,
              borderColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16
            }}>
              {/* Card Header Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                  {t.health?.meterTitle || 'FINANCIAL HEALTH SCORE'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={{ color: healthData.colorTheme, fontSize: 24, fontWeight: '800' }}>
                    {healthData.score}
                  </Text>
                  <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600', marginLeft: 2 }}>
                    / 100
                  </Text>
                </View>
              </View>

              {/* Status Title */}
              <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '600', marginBottom: 12 }}>
                {getScoreStatusText()}
              </Text>

              {/* Native Flexbox Progress Bar */}
              <View style={{
                width: '100%',
                height: 8,
                backgroundColor: '#334155',
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: healthData.insights.length > 0 ? 14 : 4
              }}>
                <View style={{
                  width: `${healthData.score}%`,
                  height: '100%',
                  backgroundColor: healthData.colorTheme,
                  borderRadius: 4
                }} />
              </View>

              {/* Actionable Advice Bullet Points */}
              {getVampirAlertMessage() && (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 }}>
                  <Text style={{ color: healthData.colorTheme, fontSize: 12, marginRight: 6 }}>•</Text>
                  <Text style={{ color: '#CBD5E1', fontSize: 12, flex: 1, lineHeight: 17 }}>
                    {getVampirAlertMessage()}
                  </Text>
                </View>
              )}
              {healthData.insights.filter(adv => !adv.startsWith('Vampir Uyarısı')).map((adv, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 }}>
                  <Text style={{ color: healthData.colorTheme, fontSize: 12, marginRight: 6 }}>•</Text>
                  <Text style={{ color: '#CBD5E1', fontSize: 12, flex: 1, lineHeight: 17 }}>
                    {adv}
                  </Text>
                </View>
              ))}
            </View>
            </View>

            {hasSubscriptions ? (
              <>
                <CategoryBreakdownCard breakdown={metrics.categoryBreakdown} monthlyTotal={metrics.monthlyTotal} />

                {/* 6-Month Projection Chart Component */}
                <View style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginTop: 16, marginBottom: 16 }}>
                  <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
                    {t.dashboard?.sixMonthOutlook || '6-Month Outlook'} ({activeDashboardCurrency})
                  </Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 180, paddingBottom: 8, paddingTop: 16 }}>
                    {chartData.map((item, index) => {
                      const barHeightPercent = maxAmount > 0 ? (Number(item.totalAmount || 0) / maxAmount) * 100 : 0;
                      const safeHeight = isNaN(barHeightPercent) ? 4 : Math.max(barHeightPercent, 4);
                      const isCurrentMonth = index === 0;

                      return (
                        <View key={index} style={{ alignItems: 'center', flex: 1, height: '100%' }}>
                          <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>
                            {isNaN(item.totalAmount) ? '0' : `${Math.round(item.totalAmount)}`}
                          </Text>
                          <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
                            <View style={{ 
                              width: 32, 
                              height: `${safeHeight}%`, 
                              backgroundColor: isCurrentMonth ? '#3B82F6' : '#334155', 
                              borderTopLeftRadius: 8, 
                              borderTopRightRadius: 8,
                              minHeight: 4
                            }} />
                          </View>
                          <Text style={{ color: isCurrentMonth ? '#3B82F6' : '#64748B', fontSize: 12, fontWeight: '700', marginTop: 10 }}>
                            {item.monthName}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <SpendingInsightsCard mostExpensive={metrics.mostExpensive} />
                <CostPerUseCard />

                {/* HYBRID SUBSCRIPTION LIST */}
                <View style={dynamicStyles.listHeaderRow}>
                  <Text style={dynamicStyles.listTitle}>{t.dashboard?.upcomingPayments || 'Upcoming Payments'}</Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/subscriptions')} activeOpacity={0.8}>
                    <Text style={dynamicStyles.viewAllText}>{t.dashboard?.viewAll || 'VIEW ALL'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>

          </>
        }
        ListEmptyComponent={
          <View style={dynamicStyles.emptyStateContainer}>
            <Ionicons name="wallet-outline" size={80} color={colors.border} style={dynamicStyles.emptyIcon} />
            <Text style={dynamicStyles.emptyStateTitle}>{t.home?.yourListIsEmpty || 'Your list is empty'}</Text>
            <Text style={dynamicStyles.emptyStateSubtitle}>{t.home?.addFirstSub || 'Add your first subscription'}</Text>
            <TouchableOpacity 
              style={dynamicStyles.emptyStateButton} 
              onPress={() => router.push('/(tabs)/subscriptions')}
              activeOpacity={0.8}
            >
              <Text style={dynamicStyles.emptyStateButtonText}>{t.home?.addSubscription || 'Add Subscription'}</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <FloatingActionButton onPress={() => router.push('/(tabs)/subscriptions/add')} />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 18,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  listTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  }
});
