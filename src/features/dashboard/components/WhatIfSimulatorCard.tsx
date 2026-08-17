import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { simulateWhatIfSavings } from '@/utils/whatIfSimulator';
import { triggerHaptic } from '@/utils/haptics';

interface Props {
  subscriptions: Subscription[];
  baseCurrency: string;
}

export function WhatIfSimulatorCard({ subscriptions, baseCurrency }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  const [pauseMonths, setPauseMonths] = useState<number>(0);
  const [familyUpgradeCount, setFamilyUpgradeCount] = useState<number>(0);

  const result = useMemo(() => {
    return simulateWhatIfSavings(subscriptions, pauseMonths, familyUpgradeCount, baseCurrency);
  }, [subscriptions, pauseMonths, familyUpgradeCount, baseCurrency]);

  if (!subscriptions || subscriptions.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)', flexShrink: 0 }]}>
            <Ionicons name="calculator-outline" size={18} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>
              {isTurkish ? '"Ya Şöyle Yaparsam?" Bütçe Simülatörü' : '"What-If?" Budget Simulator'}
            </Text>
            <Text numberOfLines={1} style={[styles.cardSub, { color: colors.textSecondary }]}>
              {isTurkish ? 'Canlı tasarruf simülasyonu ve yıllık birikim hesabı' : 'Live savings simulation & yearly projection'}
            </Text>
          </View>
        </View>

        {result.yearlySavings > 0 && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsBadgeText}>-%{result.savingsPercentage}</Text>
          </View>
        )}
      </View>

      {/* Preset Scenario 1-Tap Buttons */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.12)', paddingVertical: 6, borderRadius: 8, alignItems: 'center' }}
          onPress={() => {
            triggerHaptic('impactLight');
            setPauseMonths(6);
            setFamilyUpgradeCount(3);
          }}
        >
          <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '800' }}>🔥 {isTurkish ? 'Aşırı Tasarruf' : 'Extreme Save'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(59, 130, 246, 0.12)', paddingVertical: 6, borderRadius: 8, alignItems: 'center' }}
          onPress={() => {
            triggerHaptic('impactLight');
            setPauseMonths(3);
            setFamilyUpgradeCount(2);
          }}
        >
          <Text style={{ color: '#3B82F6', fontSize: 10, fontWeight: '800' }}>🎓 {isTurkish ? 'Öğrenci Modu' : 'Student Mode'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.12)', paddingVertical: 6, borderRadius: 8, alignItems: 'center' }}
          onPress={() => {
            triggerHaptic('impactLight');
            setPauseMonths(2);
            setFamilyUpgradeCount(1);
          }}
        >
          <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '800' }}>🌿 {isTurkish ? 'Minimalist' : 'Minimalist'}</Text>
        </TouchableOpacity>
      </View>

      {/* Live Result Display Box */}
      <View style={styles.resultBox}>
        <View>
          <Text style={styles.resultLabel}>{isTurkish ? 'Tahmini Yıllık Tasarruf' : 'Estimated Yearly Savings'}</Text>
          <Text style={styles.resultValue}>+{result.yearlySavings} {baseCurrency}</Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.resultSubLabel}>{isTurkish ? 'Yeni Yıllık Toplam' : 'New Yearly Total'}</Text>
          <Text style={[styles.resultSubValue, { color: colors.text }]}>{result.simulatedYearlyTotal} {baseCurrency}</Text>
        </View>
      </View>

      {/* Controls: 1. Pause Months Selector */}
      <View style={styles.controlSection}>
        <Text style={[styles.controlLabel, { color: colors.text }]}>
          {isTurkish ? `⏸️ Eğlence Servislerini ${pauseMonths} Ay Duraklat` : `⏸️ Pause Non-Essentials for ${pauseMonths} Months`}
        </Text>
        <View style={styles.pillSelectorRow}>
          {[0, 1, 2, 3, 6].map(m => (
            <TouchableOpacity
              key={m}
              style={[
                styles.pillBtn,
                {
                  backgroundColor: pauseMonths === m ? '#8B5CF6' : colors.background,
                  borderColor: pauseMonths === m ? '#8B5CF6' : colors.border,
                },
              ]}
              onPress={() => {
                triggerHaptic('selection');
                setPauseMonths(m);
              }}
            >
              <Text style={[styles.pillBtnText, { color: pauseMonths === m ? '#FFFFFF' : colors.text }]}>
                {m === 0 ? (isTurkish ? 'Kapalı' : 'Off') : `${m} Ay`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Controls: 2. Family Plan Upgrade Selector */}
      <View style={styles.controlSection}>
        <Text style={[styles.controlLabel, { color: colors.text }]}>
          {isTurkish ? `👨‍👩‍👧‍👦 ${familyUpgradeCount} Servisi Aile Paketine Geçir` : `👨‍👩‍👧‍👦 Upgrade ${familyUpgradeCount} Subs to Family Plan`}
        </Text>
        <View style={styles.pillSelectorRow}>
          {[0, 1, 2, 3].map(c => (
            <TouchableOpacity
              key={c}
              style={[
                styles.pillBtn,
                {
                  backgroundColor: familyUpgradeCount === c ? '#10B981' : colors.background,
                  borderColor: familyUpgradeCount === c ? '#10B981' : colors.border,
                },
              ]}
              onPress={() => {
                triggerHaptic('selection');
                setFamilyUpgradeCount(c);
              }}
            >
              <Text style={[styles.pillBtnText, { color: familyUpgradeCount === c ? '#FFFFFF' : colors.text }]}>
                {c === 0 ? (isTurkish ? 'Kapalı' : 'Off') : `${c} Servis`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    overflow: 'hidden',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  savingsBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  savingsBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  resultBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    marginBottom: 14,
  },
  resultLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
    textTransform: 'uppercase',
  },
  resultValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10B981',
    marginTop: 2,
  },
  resultSubLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  resultSubValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  controlSection: {
    marginTop: 10,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  pillSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  pillBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
