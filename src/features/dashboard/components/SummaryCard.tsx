import { t } from '@/locales/i18n';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useTheme } from '@/context/ThemeContext';

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

  const { monthlyBudget, setMonthlyBudget } = useBudgetStore();
  const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState(monthlyBudget ? monthlyBudget.toString() : '');

  const handleSaveBudget = () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val > 0) {
      setMonthlyBudget(val);
    } else {
      setMonthlyBudget(null);
    }
    setIsBudgetModalVisible(false);
  };

  const budgetUsagePercent = monthlyBudget ? (monthlyGross / monthlyBudget) * 100 : 0;
  const isOverBudget = monthlyBudget ? monthlyGross > monthlyBudget : false;

  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.cardsWrapper}>
        {/* Card A (Left - Gross Spend) */}
        <View style={[styles.glassCard, styles.leftCard]}>
          <Text numberOfLines={1} style={styles.label}>{t.global.grossCommitted}</Text>
          <View style={{ marginBottom: 6 }}>
            <Text numberOfLines={1} style={styles.primaryAmount}>{monthlyGross.toFixed(2)} {baseCurrency} <Text style={styles.moSuffix}>{t.global.Mo}</Text></Text>
          </View>
          <View>
            <Text numberOfLines={1} style={styles.secondaryAmount}>{annualGross.toFixed(2)} {baseCurrency} <Text style={styles.yrSuffix}>{t.global.Yr}</Text></Text>
          </View>
        </View>

        {/* Card B (Right - Net Burden) */}
        <View style={[styles.glassCard, styles.rightCard]}>
          <Text numberOfLines={1} style={[styles.label, styles.netLabel]}>{t.global.netOutofpocket}</Text>
          <View style={{ marginBottom: 6 }}>
            <Text numberOfLines={1} style={styles.netPrimaryAmount}>{monthlyNet.toFixed(2)} {baseCurrency} <Text style={[styles.moSuffix, { color: '#A7F3D0' }]}>{t.global.Mo}</Text></Text>
          </View>
          <View>
            <Text numberOfLines={1} style={styles.netSecondaryAmount}>{annualNet.toFixed(2)} {baseCurrency} <Text style={[styles.yrSuffix, { color: '#A7F3D0' }]}>{t.global.Yr}</Text></Text>
          </View>
        </View>
      </View>

      {/* Monthly Budget Bar */}
      <TouchableOpacity 
        style={styles.budgetContainer} 
        activeOpacity={0.8}
        onPress={() => {
          setBudgetInput(monthlyBudget ? monthlyBudget.toString() : '');
          setIsBudgetModalVisible(true);
        }}
      >
        {monthlyBudget ? (
          <>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetTitle}>{(t.dashboard as any)?.monthlyBudgetLimit || 'Monthly Budget Limit'}</Text>
              <Text style={[styles.budgetPercent, { color: isOverBudget ? '#EF4444' : '#10B981' }]}>
                {monthlyGross.toFixed(0)} / {monthlyBudget} {baseCurrency} ({budgetUsagePercent.toFixed(0)}%)
              </Text>
            </View>
            <View style={styles.budgetTrack}>
              <View style={[styles.budgetBar, { width: `${Math.min(budgetUsagePercent, 100)}%`, backgroundColor: isOverBudget ? '#EF4444' : '#10B981' }]} />
            </View>
          </>
        ) : (
          <Text style={styles.setBudgetText}>{(t.dashboard as any)?.tapToSetLimit || 'Tap to set a monthly limit'}</Text>
        )}
      </TouchableOpacity>

      <Modal visible={isBudgetModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{(t.dashboard as any)?.setMonthlyBudget || 'Set Monthly Budget'}</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="e.g. 500"
              placeholderTextColor={colors.textSecondary}
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}
                onPress={() => {
                  setMonthlyBudget(null);
                  setIsBudgetModalVisible(false);
                }}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>{(t.common as any)?.clear || 'Clear'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#10B981' }]}
                onPress={handleSaveBudget}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>{(t.global as any)?.saveChanges || 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    overflow: 'hidden',
    minWidth: 0,
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
  },
  budgetContainer: {
    marginTop: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  budgetTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  budgetText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  budgetPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  budgetTrack: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetBar: {
    height: '100%',
    borderRadius: 3,
  },
  setBudgetText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  }
});



