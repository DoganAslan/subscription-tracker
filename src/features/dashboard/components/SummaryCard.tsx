import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface Props {
  monthlyTotal: number;
  yearlyTotal: number;
  activeCount: number;
}

export const SummaryCard = React.memo(function SummaryCard({ monthlyTotal, yearlyTotal }: Props) {
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.label}>{t('home.totalMonthlySpend')}</Text>
      <Text style={dynamicStyles.amount}>
        {monthlyTotal.toFixed(2)} {baseCurrency}
      </Text>
      <Text style={dynamicStyles.yearlyLabel}>
        {t('home.estimatedYearlySpend')}: {yearlyTotal.toFixed(2)} {baseCurrency}
      </Text>
    </View>
  );
});

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  amount: {
    color: colors.text,
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1,
  },
  yearlyLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  }
});
