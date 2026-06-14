import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { getMonthlyCost } from '../utils/calculations';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface Props {
  mostExpensive: Subscription | null;
}

export const SpendingInsightsCard = React.memo(function SpendingInsightsCard({ mostExpensive }: Props) {
  const hasData = mostExpensive !== null;
  const monthlyCost = hasData ? getMonthlyCost(mostExpensive.amount, mostExpensive.billingCycle) : 0;
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={dynamicStyles.cardContainer}>
      <View style={dynamicStyles.iconContainer}>
        <Ionicons name="sparkles" size={24} color={colors.primary} />
      </View>
      <View style={dynamicStyles.textContainer}>
        <Text style={dynamicStyles.insightTitle}>{t('home.highestExpense')}</Text>
        {hasData === true ? (
          <Text style={dynamicStyles.insightValue}>
            {mostExpensive.name} <Text style={dynamicStyles.insightAmount}>— ${monthlyCost.toFixed(2)}/mo</Text>
          </Text>
        ) : (
          <Text style={dynamicStyles.insightValue}>{t('calendar.noPayments')}</Text>
        )}
      </View>
    </View>
  );
});

const getStyles = (colors: any) => StyleSheet.create({
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
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  insightValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  insightAmount: {
    color: colors.textSecondary,
    fontWeight: 'normal',
  }
});
