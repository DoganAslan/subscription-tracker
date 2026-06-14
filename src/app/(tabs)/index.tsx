import React, { useMemo, useEffect } from 'react';
import { ScrollView, Text, SafeAreaView, RefreshControl, View, TouchableOpacity, StyleSheet, Platform, InteractionManager } from 'react-native';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { useAnalytics } from '@/hooks/useAnalytics';
import { FloatingActionButton } from '@/components/FloatingActionButton';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { SummaryWidget } from '@/widgets/SummaryWidget';
import { useTranslation } from 'react-i18next';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { data: subscriptions, isLoading, isError, refetch, isRefetching } = useSubscriptions();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const router = useRouter();
  const { colors } = useTheme();
  
  const dynamicStyles = useMemo(() => getStyles(colors), [colors]);

  const metrics = useAnalytics(subscriptions);

  const upcomingPayments = useMemo(() => {
    if (!subscriptions) return [];
    
    return [...subscriptions]
      .sort((a, b) => {
        // Safe check for renewalDate since it could potentially be missing in older records
        const dateA = a.renewalDate?.toMillis ? a.renewalDate.toMillis() : 0;
        const dateB = b.renewalDate?.toMillis ? b.renewalDate.toMillis() : 0;
        return dateA - dateB;
      })
      .slice(0, 3);
  }, [subscriptions]);

  useEffect(() => {
    const updateWidget = async () => {
      if (Platform.OS !== 'android') return;
      try {
        const nextPaymentName = upcomingPayments.length > 0 ? upcomingPayments[0].name : 'None';
        const nextPaymentDate = upcomingPayments.length > 0 
          ? upcomingPayments[0].renewalDate.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          : '--';
        const monthlyTotalFormatted = `${metrics.monthlyTotal.toFixed(2)} ${baseCurrency}`;

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
  }, [metrics, upcomingPayments, baseCurrency]);

  const hasSubscriptions = upcomingPayments.length > 0;

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
      <ScrollView 
        style={dynamicStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <Header title="SubMate" />
        
        <SummaryCard 
          monthlyTotal={metrics.monthlyTotal} 
          yearlyTotal={metrics.yearlyTotal} 
          activeCount={metrics.activeCount} 
        />
        
        {(!subscriptions || subscriptions.length === 0) ? (
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
        ) : (
          <>
            <CategoryBreakdownCard breakdown={metrics.categoryBreakdown} monthlyTotal={metrics.monthlyTotal} />
            <SpendingInsightsCard mostExpensive={metrics.mostExpensive} />
            
            {/* HYBRID SUBSCRIPTION LIST */}
            <View style={dynamicStyles.listHeaderRow}>
              <Text style={dynamicStyles.listTitle}>{t('home.upcomingPayments')}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/subscriptions')} activeOpacity={0.8}>
                <Text style={dynamicStyles.viewAllText}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            </View>

            {hasSubscriptions ? (
              upcomingPayments.map(sub => (
                <SubscriptionCard key={sub.id} subscription={sub} />
              ))
            ) : null}
          </>
        )}
        
      </ScrollView>
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
