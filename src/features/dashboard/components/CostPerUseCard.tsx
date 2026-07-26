import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { useTheme } from '@/context/ThemeContext';
import { getMonthlyCost } from '@/features/dashboard/utils/calculations';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const CostPerUseCard = () => {
  const { data: subscriptions } = useSubscriptions();
  const { colors, isDark } = useTheme();
  const router = useRouter();

  if (!subscriptions || subscriptions.length === 0) return null;

  // Find the subscription with the highest cost per use
  const subscriptionsWithUsage = subscriptions
    .filter(s => s.status !== 'paused' && (s.usageScore || 0) > 0)
    .map(s => {
      const monthlyCost = getMonthlyCost(s.amount, s.billingCycle);
      const costPerUse = monthlyCost / (s.usageScore || 1); // rough estimate if we assume usageScore is per month
      return { ...s, costPerUse };
    })
    .sort((a, b) => b.costPerUse - a.costPerUse);

  if (subscriptionsWithUsage.length === 0) return null;

  const highestCostSub = subscriptionsWithUsage[0];
  const lowestCostSub = subscriptionsWithUsage[subscriptionsWithUsage.length - 1];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name="analytics" size={20} color="#10B981" />
        <Text style={[styles.title, { color: colors.text }]}>Cost-per-Use Insights</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        onPress={() => router.push(`/(tabs)/subscriptions/${highestCostSub.id}`)}
      >
        <View style={styles.leftCol}>
          <Text style={[styles.subName, { color: colors.text }]}>{highestCostSub.name}</Text>
          <Text style={[styles.subDetail, { color: colors.textSecondary }]}>Highest cost per use</Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={[styles.costText, { color: '#EF4444' }]}>
            {highestCostSub.costPerUse.toFixed(2)} {highestCostSub.currency}
          </Text>
          <Text style={[styles.perUseLabel, { color: colors.textSecondary }]}>per use</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.row, { paddingTop: 12 }]}
        onPress={() => router.push(`/(tabs)/subscriptions/${lowestCostSub.id}`)}
      >
        <View style={styles.leftCol}>
          <Text style={[styles.subName, { color: colors.text }]}>{lowestCostSub.name}</Text>
          <Text style={[styles.subDetail, { color: colors.textSecondary }]}>Best value</Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={[styles.costText, { color: '#10B981' }]}>
            {lowestCostSub.costPerUse.toFixed(2)} {lowestCostSub.currency}
          </Text>
          <Text style={[styles.perUseLabel, { color: colors.textSecondary }]}>per use</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  leftCol: {
    flex: 1,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  subName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subDetail: {
    fontSize: 12,
  },
  costText: {
    fontSize: 16,
    fontWeight: '800',
  },
  perUseLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  }
});



