import React, { useMemo } from 'react';
import { ScrollView, Text, SafeAreaView, RefreshControl, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { calculateMetrics } from '@/features/dashboard/utils/calculations';
import { SummaryCard } from '@/features/dashboard/components/SummaryCard';
import { CategoryBreakdownCard } from '@/features/dashboard/components/CategoryBreakdownCard';
import { SpendingInsightsCard } from '@/features/dashboard/components/SpendingInsightsCard';
import { SubscriptionCard } from '@/features/subscriptions/components/SubscriptionCard';
import { AppLoader } from '@/components/common/AppLoader';
import { Header } from '@/components/common/Header';
import { Ionicons } from '@expo/vector-icons';

import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { data: subscriptions, isLoading, isError, refetch, isRefetching } = useSubscriptions();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const router = useRouter();

  const metrics = useMemo(() => {
    return calculateMetrics(subscriptions || [], baseCurrency);
  }, [subscriptions, baseCurrency]);

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

  const hasSubscriptions = upcomingPayments.length > 0;

  if (isLoading) return <AppLoader />;

  if (isError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load dashboard data.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />
        }
      >
        <Header title="Vault" />
        
        <SummaryCard 
          monthlyTotal={metrics.monthlyTotal} 
          yearlyTotal={metrics.yearlyTotal} 
          activeCount={metrics.activeCount} 
        />
        {(!subscriptions || subscriptions.length === 0) ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="wallet-outline" size={80} color="#374151" style={styles.emptyIcon} />
            <Text style={styles.emptyStateTitle}>Your Vault is Empty</Text>
            <Text style={styles.emptyStateSubtitle}>Add your first subscription to start tracking your expenses.</Text>
            <TouchableOpacity 
              style={styles.emptyStateButton} 
              onPress={() => router.push('/(tabs)/subscriptions')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyStateButtonText}>Add Subscription</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CategoryBreakdownCard breakdown={metrics.categoryBreakdown} monthlyTotal={metrics.monthlyTotal} />
            <SpendingInsightsCard mostExpensive={metrics.mostExpensive} />
            
            {/* HYBRID SUBSCRIPTION LIST */}
            <View style={styles.listHeaderRow}>
              <Text style={styles.listTitle}>Upcoming Payments</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/subscriptions')} activeOpacity={0.8}>
                <Text style={styles.viewAllText}>VIEW ALL</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F19',
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
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  emptyText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
    backgroundColor: '#111827',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginTop: 16,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
