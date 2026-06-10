import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { getMonthlyCost } from '../utils/calculations';

interface Props {
  mostExpensive: Subscription | null;
}

export function SpendingInsightsCard({ mostExpensive }: Props) {
  const hasData = mostExpensive !== null;
  const monthlyCost = hasData ? getMonthlyCost(mostExpensive.amount, mostExpensive.billingCycle) : 0;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="sparkles" size={24} color="#3B82F6" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.insightTitle}>Highest Expense</Text>
        {hasData === true ? (
          <Text style={styles.insightValue}>
            {mostExpensive.name} <Text style={styles.insightAmount}>— ${monthlyCost.toFixed(2)}/mo</Text>
          </Text>
        ) : (
          <Text style={styles.insightValue}>No active expenses this month</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  insightTitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  insightValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  insightAmount: {
    color: '#9CA3AF',
    fontWeight: 'normal',
  }
});
