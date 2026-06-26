import i18n from '@/locales/i18n';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCurrencyStore } from '@/store/useCurrencyStore';

interface Props {
  monthlyTotal: number;
  monthlyNetTotal: number;
}

export const SummaryCard = React.memo(function SummaryCard({ monthlyTotal, monthlyNetTotal }: Props) {
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);

  const safeGross = typeof monthlyTotal === 'number' && !isNaN(monthlyTotal) ? monthlyTotal : 0;
  const safeNet = typeof monthlyNetTotal === 'number' && !isNaN(monthlyNetTotal) ? monthlyNetTotal : 0;

  const monthlyGross = safeGross;
  const monthlyNet = safeNet;

  const annualGross = monthlyGross * 12;
  const annualNet = monthlyNet * 12;

  return (
    <View style={styles.container}>
      <View style={styles.cardsWrapper}>
        {/* Card A (Left - Gross Spend) */}
        <View style={[styles.glassCard, styles.leftCard]}>
          <Text style={styles.label}>{i18n.t('global.grossCommitted')}</Text>
          <View style={{ marginBottom: 6 }}>
            <Text style={styles.primaryAmount}>{monthlyGross.toFixed(2)} {baseCurrency} <Text style={styles.moSuffix}>{i18n.t('global.Mo')}</Text></Text>
          </View>
          <View>
            <Text style={styles.secondaryAmount}>{annualGross.toFixed(2)} {baseCurrency} <Text style={styles.yrSuffix}>{i18n.t('global.Yr')}</Text></Text>
          </View>
        </View>

        {/* Card B (Right - Net Burden) */}
        <View style={[styles.glassCard, styles.rightCard]}>
          <Text style={[styles.label, styles.netLabel]}>{i18n.t('global.netOutofpocket')}</Text>
          <View style={{ marginBottom: 6 }}>
            <Text style={styles.netPrimaryAmount}>{monthlyNet.toFixed(2)} {baseCurrency} <Text style={[styles.moSuffix, { color: '#A7F3D0' }]}>{i18n.t('global.Mo')}</Text></Text>
          </View>
          <View>
            <Text style={styles.netSecondaryAmount}>{annualNet.toFixed(2)} {baseCurrency} <Text style={[styles.yrSuffix, { color: '#A7F3D0' }]}>{i18n.t('global.Yr')}</Text></Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  cardsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  glassCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  leftCard: {
    backgroundColor: '#1E293B',
  },
  rightCard: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  label: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  netLabel: {
    color: '#A7F3D0',
  },
  primaryAmount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  moSuffix: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
  },
  secondaryAmount: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  yrSuffix: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
  },
  netPrimaryAmount: {
    color: '#34D399',
    fontSize: 18,
    fontWeight: '700',
  },
  netSecondaryAmount: {
    color: '#A7F3D0',
    fontSize: 14,
    fontWeight: '500',
  }
});
