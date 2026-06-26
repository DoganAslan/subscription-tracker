import React, { useMemo, useEffect, useState } from 'react';
import { FlatList, ScrollView, Text, SafeAreaView, RefreshControl, View, TouchableOpacity, StyleSheet, Platform, InteractionManager } from 'react-native';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { useAnalytics } from '@/hooks/useAnalytics';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DashboardFilterBar } from '@/features/dashboard/components/DashboardFilterBar';
import { SummaryCard } from '@/features/dashboard/components/SummaryCard';
import { CategoryBreakdownCard } from '@/features/dashboard/components/CategoryBreakdownCard';
import { SpendingInsightsCard } from '@/features/dashboard/components/SpendingInsightsCard';
import { SubscriptionCard } from '@/features/subscriptions/components/SubscriptionCard';
import { SubscriptionSkeleton } from '@/features/subscriptions/components/SubscriptionSkeleton';
import { Header } from '@/components/common/Header';
import { Ionicons } from '@expo/vector-icons';

import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { requestNotificationPermissions } from '@/utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { SummaryWidget } from '@/widgets/SummaryWidget';
import { useTranslation } from 'react-i18next';
import { convertCurrency } from '@/utils/currency';
import { calculateMonthlyCosts } from '@/utils/calculations';
import { getContractDoomStatus, calculateVampireScore } from '@/features/dashboard/utils/calculations';

import { getMidnight } from '@/utils/dateHelpers';

const generateSixMonthProjection = (subscriptions: any[], activeCurrency: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Safeguard: Clamp to the 1st of the current month to prevent Date() auto-roll on the 31st
  const safeBaseDate = getMidnight(new Date());
  safeBaseDate.setDate(1);
  const currentMonthIndex = safeBaseDate.getMonth();
  
  let projection = [];
  let maxAmount = 0;

  let activeMonthlyNet = 0;
  if (subscriptions) {
    subscriptions.forEach(sub => {
      activeMonthlyNet += calculateMonthlyCosts(sub, activeCurrency).net;
    });
  }

  for (let i = 0; i < 6; i++) {
    const targetMonthIndex = (currentMonthIndex + i) % 12;
    
    if (activeMonthlyNet > maxAmount) maxAmount = activeMonthlyNet;

    projection.push({
      label: months[targetMonthIndex],
      total: activeMonthlyNet,
    });
  }

  return { projection, maxAmount };
};

const getGaugeColor = (score: number) => {
  if (score >= 80) return '#10B981'; // Emerald Green
  if (score >= 50) return '#F59E0B'; // Amber Yellow
  return '#EF4444'; // Crimson Red
};

export default function DashboardScreen() {
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const { t } = useTranslation();
  const { data: subscriptions, isLoading, isError, refetch, isRefetching } = useSubscriptions();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const router = useRouter();
  const { colors } = useTheme();
  
  const dynamicStyles = useMemo(() => getStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);

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

    const { projection, maxAmount } = generateSixMonthProjection(
      subscriptions || [], 
      activeDashboardCurrency
    );

    return { 
      totalGross: gross, 
      totalNet: net, 
      projection, 
      maxAmount 
    };
  }, [filteredSubscriptions, subscriptions, activeDashboardCurrency]);

  const { totalGross, totalNet, projection, maxAmount } = dashboardMetrics;

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
    return subscriptions.filter(sub => getContractDoomStatus(sub.contractEndDate).isDoomed);
  }, [subscriptions]);

  const hasSubscriptions = upcomingPayments.length > 0;

  const healthData = React.useMemo(() => {
    return calculateVampireScore(subscriptions || [], Number(displayGross));
  }, [subscriptions, displayGross]);

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
        <Text style={dynamicStyles.errorText}>{t('home.failedToLoad')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <FlatList
        data={upcomingPayments}
        keyExtractor={(item, index) => item.id || `virtual-sub-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[dynamicStyles.scrollView, dynamicStyles.scrollContent]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        
        ListHeaderComponent={() => (
          <View style={{ paddingBottom: 16 }}>
            <Header title="SubMate" />
            {/* Master Dashboard Content Constraint */}
            <View style={{ width: '100%', maxWidth: 1024, alignSelf: 'center' }}>
              {doomedList.length > 0 && (
                <View style={{ borderWidth: 1, borderColor: '#F59E0B', backgroundColor: '#451A03', padding: 14, borderRadius: 12, marginBottom: 16, marginHorizontal: 16 }}>
                  <Text style={{ color: '#FCD34D', fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>
                    ⚠️ TAAHHÜT ALARMI ({doomedList.length} Abonelik)
                  </Text>
                  <Text style={{ color: '#FEF3C7', fontSize: 12 }}>
                    {doomedList.map(s => `${s.name} (Son ${getContractDoomStatus(s.contractEndDate).daysLeft} gün)`).join(', ')}
                  </Text>
                </View>
              )}
            <SummaryCard 
              monthlyTotal={Number(displayGross)} 
              monthlyNetTotal={Number(displayNet) >= 0 ? Number(displayNet) : Number(displayGross)} 
            />

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
                  {t('health.meterTitle')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={{ color: getGaugeColor(healthData.score), fontSize: 24, fontWeight: '800' }}>
                    {healthData.score}
                  </Text>
                  <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600', marginLeft: 2 }}>
                    / 100
                  </Text>
                </View>
              </View>

              {/* Status Title */}
              <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '600', marginBottom: 12 }}>
                {t(healthData.statusKey)}
              </Text>

              {/* Native Flexbox Progress Bar */}
              <View style={{
                width: '100%',
                height: 8,
                backgroundColor: '#334155',
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: healthData.adviceKeys.length > 0 ? 14 : 4
              }}>
                <View style={{
                  width: `${healthData.score}%`,
                  height: '100%',
                  backgroundColor: getGaugeColor(healthData.score),
                  borderRadius: 4
                }} />
              </View>

              {/* Actionable Advice Bullet Points */}
              {healthData.adviceKeys.map((advKey, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 }}>
                  <Text style={{ color: getGaugeColor(healthData.score), fontSize: 12, marginRight: 6 }}>•</Text>
                  <Text style={{ color: '#CBD5E1', fontSize: 12, flex: 1, lineHeight: 17 }}>
                    {t(advKey)}
                  </Text>
                </View>
              ))}
            </View>
            </View>

            {hasSubscriptions ? (
              <>
                <CategoryBreakdownCard breakdown={metrics.categoryBreakdown} monthlyTotal={metrics.monthlyTotal} />

                {/* 6-Month Projection Chart Component */}
                <View style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginTop: 16, marginBottom: 24 }}>
                  <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
                    6-Month Outlook ({activeDashboardCurrency})
                  </Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 180, paddingBottom: 8, paddingTop: 16 }}>
                    {projection.map((item, index) => {
                      const heightPercentage = maxAmount > 0 ? Math.max((item.total / maxAmount) * 100, 4) : 4;
                      const isCurrentMonth = index === 0;

                      return (
                        <View key={index} style={{ alignItems: 'center', flex: 1, height: '100%' }}>
                          <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>
                            {Math.round(item.total)}
                          </Text>
                          <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
                            <View style={{ 
                              width: 32, 
                              height: `${heightPercentage}%`, 
                              backgroundColor: isCurrentMonth ? '#3B82F6' : '#334155', 
                              borderTopLeftRadius: 8, 
                              borderTopRightRadius: 8,
                              minHeight: 4
                            }} />
                          </View>
                          <Text style={{ color: isCurrentMonth ? '#3B82F6' : '#64748B', fontSize: 12, fontWeight: '700', marginTop: 10 }}>
                            {item.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <SpendingInsightsCard mostExpensive={metrics.mostExpensive} />

                {/* HYBRID SUBSCRIPTION LIST */}
                <View style={dynamicStyles.listHeaderRow}>
                  <Text style={dynamicStyles.listTitle}>{t('home.upcomingPayments')}</Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/subscriptions')} activeOpacity={0.8}>
                    <Text style={dynamicStyles.viewAllText}>{t('home.viewAll')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        )}

        renderItem={({ item }) => (
          <SubscriptionCard subscription={item} />
        )}

        ListEmptyComponent={() => (
          <View style={dynamicStyles.emptyStateContainer}>
            <Ionicons name="wallet-outline" size={80} color={colors.border} style={dynamicStyles.emptyIcon} />
            <Text style={dynamicStyles.emptyStateTitle}>{t('home.yourListIsEmpty')}</Text>
            <Text style={dynamicStyles.emptyStateSubtitle}>{t('home.addFirstSub')}</Text>
            <TouchableOpacity 
              style={dynamicStyles.emptyStateButton} 
              onPress={() => router.push('/(tabs)/subscriptions')}
              activeOpacity={0.8}
            >
              <Text style={dynamicStyles.emptyStateButtonText}>{t('home.addSubscription')}</Text>
            </TouchableOpacity>
          </View>
        )}

        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={true}
      />
      <FloatingActionButton onPress={() => router.push('/(tabs)/subscriptions/add')} />
    </SafeAreaView>
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
