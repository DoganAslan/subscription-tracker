import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { SUPPORTED_CURRENCIES, convertCurrency } from '@/utils/currency';

import { useTranslation } from '@/context/LanguageContext';

interface Props {
  subscriptions: Subscription[];
}

export function AiRecommendationsCard({ subscriptions }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency)?.symbol || baseCurrency;

  const recommendations = useMemo(() => {
    const list: { id: string; icon: string; color: string; bg: string; title: string; desc: string; savingsText?: string }[] = [];
    if (!subscriptions || subscriptions.length === 0) return list;

    // 1. Check duplicate/heavy categories (Vampire alert)
    const categoryCounts: Record<string, number> = {};
    subscriptions.forEach(sub => {
      const cat = sub.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count >= 3) {
        list.push({
          id: `vampire-${cat}`,
          icon: 'flame',
          color: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.12)',
          title: isTurkish ? `Çoklu ${cat} Aboneliği (${count})` : `Multiple ${cat} Subscriptions (${count})`,
          desc: isTurkish
            ? `"${cat}" kategorisinde ${count} aktif servisiniz var. Kullanmadıklarınızı duraklatarak aylık %30'a varan tasarruf sağlayabilirsiniz.`
            : `You have ${count} active services in "${cat}". Consolidating or pausing unused ones could save up to 30% monthly.`,
          savingsText: isTurkish ? 'Potansiyel Tasarruf: ~%30' : 'Potential Savings: ~30%',
        });
      }
    });

    // 2. Check monthly subs that could be annual
    const monthlySubs = subscriptions.filter(s => s.billingCycle === 'monthly' && s.amount > 50 && s.status !== 'paused');
    if (monthlySubs.length > 0) {
      const sample = monthlySubs[0];
      const annualSaved = convertCurrency(sample.amount * 2, sample.currency || 'USD', baseCurrency);
      list.push({
        id: `annual-tip`,
        icon: 'calendar',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.12)',
        title: isTurkish ? 'Yıllık Ödemeye Geçiş Yapın' : 'Switch to Annual Billing',
        desc: isTurkish
          ? `"${sample.name}" servisini yıllık plana geçirmek genelde %15-20 indirim sağlar.`
          : `Switching "${sample.name}" to annual payment typically gives a 15-20% discount.`,
        savingsText: isTurkish ? `Yılda ~${currencySymbol}${annualSaved.toFixed(0)} Tasarruf` : `Save ~${currencySymbol}${annualSaved.toFixed(0)}/yr`,
      });
    }

    // 3. Check active free trials
    const activeTrials = subscriptions.filter(s => s.isTrial);
    if (activeTrials.length > 0) {
      const trial = activeTrials[0];
      list.push({
        id: `trial-alert`,
        icon: 'time',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.12)',
        title: isTurkish ? `Ücretsiz Deneme Aktif: ${trial.name}` : `Free Trial Active: ${trial.name}`,
        desc: isTurkish
          ? `Sürpriz çekimleri önlemek için deneme süresi bitmeden "${trial.name}" servisini değerlendirmeyi unutmayın.`
          : `Remember to evaluate "${trial.name}" before the trial period ends to avoid unexpected recurring charges.`,
      });
    }

    // 4. Check foreign currency exposure
    const foreignSubs = subscriptions.filter(s => (s.currency || 'USD') !== baseCurrency);
    if (foreignSubs.length > 0) {
      list.push({
        id: `currency-tip`,
        icon: 'globe',
        color: '#8B5CF6',
        bg: 'rgba(139, 92, 246, 0.12)',
        title: isTurkish ? 'Döviz Kuru Riski Maruziyeti' : 'Foreign Currency Exposure',
        desc: isTurkish
          ? `Kendi para biriminiz dışında ${foreignSubs.length} aboneliğiniz var. Kur dalgalanmaları bütçenizi etkileyebilir.`
          : `You have ${foreignSubs.length} subscription(s) in non-native currencies. Exchange rate fluctuations can alter your total monthly budget.`,
      });
    }

    // Default fallback AI recommendation if list is small
    if (list.length === 0) {
      list.push({
        id: `general-ai-tip`,
        icon: 'sparkles',
        color: '#6366F1',
        bg: 'rgba(99, 102, 241, 0.12)',
        title: isTurkish ? 'Harika Bütçe Yönetimi!' : 'Great Budget Management!',
        desc: isTurkish
          ? 'Abonelik portföyünüz oldukça optimize görünüyor. Az kullanılan servisleri tespit etmek için kullanım puanlarını takip edin.'
          : 'Your subscription portfolio looks well-optimized. Keep tracking usage scores to catch underused services early.',
      });
    }

    return list;
  }, [subscriptions, baseCurrency, currencySymbol, isTurkish]);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Title */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8, overflow: 'hidden' }}>
          <View style={[styles.aiBadgeIcon, { flexShrink: 0 }]}>
            <Ionicons name="hardware-chip-outline" size={18} color="#8B5CF6" />
          </View>
          <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text, flexShrink: 1 }]}>
            {isTurkish ? 'YZ Akıllı Tavsiyeleri' : 'AI Smart Recommendations'}
          </Text>
        </View>

        <View style={[styles.aiSparklePill, { flexShrink: 0 }]}>
          <Ionicons name="sparkles" size={12} color="#8B5CF6" style={{ marginRight: 4 }} />
          <Text style={styles.aiSparkleText}>AI Engine</Text>
        </View>
      </View>

      {/* Recommendations List */}
      <View style={{ gap: 12 }}>
        {recommendations.map(rec => (
          <View key={rec.id} style={[styles.recItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.itemIconBox, { backgroundColor: rec.bg }]}>
              <Ionicons name={rec.icon as any} size={20} color={rec.color} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{rec.title}</Text>
              <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{rec.desc}</Text>

              {rec.savingsText && (
                <View style={styles.savingsTag}>
                  <Ionicons name="trending-down" size={12} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.savingsTagText}>{rec.savingsText}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  aiBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  aiSparklePill: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiSparkleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  recItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  savingsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  savingsTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
});
