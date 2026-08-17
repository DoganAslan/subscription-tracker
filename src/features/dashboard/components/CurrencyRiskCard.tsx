import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { convertCurrency, ExchangeRates } from '@/utils/currency';

interface Props {
  subscriptions: Subscription[];
  baseCurrency: string;
  liveRates: ExchangeRates | null;
}

export const CurrencyRiskCard = ({ subscriptions, baseCurrency, liveRates }: Props) => {
  useTheme();
  const { t, currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  
  if (!subscriptions || !liveRates || !baseCurrency) return null;

  const foreignSubs = subscriptions.filter(
    (s) => s.status !== 'paused' && s.currency !== baseCurrency
  );

  if (foreignSubs.length === 0) return null;

  let totalForeignCostInBase = 0;
  foreignSubs.forEach(sub => {
    // We assume 1 month cost for simplicity
    totalForeignCostInBase += convertCurrency(sub.amount, sub.currency, baseCurrency);
  });

  const formatter = new Intl.NumberFormat(isTurkish ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: baseCurrency,
    maximumFractionDigits: 0,
  });

  const formattedAmount = formatter.format(totalForeignCostInBase);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="warning" size={24} color="#F59E0B" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {isTurkish ? 'Döviz Kuru Riski Uyarısı' : (t.features?.currencyRiskTitle || 'Currency Risk Alert')}
        </Text>
        <Text style={styles.description}>
          {isTurkish
            ? `${foreignSubs.length} adet yabancı para birimli aboneliğiniz var (aylık ~${formattedAmount}). Kur dalgalanmaları maliyetinizi yükseltebilir.`
            : (t.features?.currencyRiskDesc?.replace('{{count}}', String(foreignSubs.length)).replace('{{amount}}', formattedAmount) || 
               `You have ${foreignSubs.length} foreign subscriptions costing ~${formattedAmount}/mo. Exchange rate fluctuations may suddenly increase your costs.`)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    padding: 8,
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#D4D4D8', // Light gray for readability on dark backgrounds
    fontSize: 13,
    lineHeight: 18,
  }
});


