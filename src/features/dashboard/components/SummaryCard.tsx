import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCurrencyStore } from '@/store/useCurrencyStore';

interface Props {
  monthlyTotal: number;
  yearlyTotal: number;
  activeCount: number;
}

export function SummaryCard({ monthlyTotal }: Props) {
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>TOTAL MONTHLY SPEND</Text>
      <Text style={styles.amount}>
        {monthlyTotal.toFixed(2)} {baseCurrency}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1,
  }
});
