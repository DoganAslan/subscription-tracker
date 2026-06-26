import i18n from '@/locales/i18n';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SavingsTip } from '../utils/savingsEngine';

interface Props {
  tip: SavingsTip;
  currency: string;
}

export function SavingsTipCard({ tip, currency }: Props) {
  return (
    <View style={styles.cardContainer}>
      <Text style={styles.icon}>{i18n.t('global.symbol721')}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.message}>
          {tip.message}
        </Text>
        <Text style={styles.savingsHighlight}>
          Potential Savings: {tip.potentialSavings.toFixed(0)} {currency}/mo
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  savingsHighlight: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: 'bold',
  }
});