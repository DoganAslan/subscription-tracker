import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useSavingsStore } from '@/store/useSavingsStore';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { SUPPORTED_CURRENCIES } from '@/utils/currency';
import { triggerHaptic } from '@/utils/haptics';

export const SavingBankWidget = () => {
  const { totalSaved, goals, setGoal } = useSavingsStore();
  const activeGoal = goals?.[0];
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency)?.symbol || baseCurrency;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalAmount, setGoalAmount] = useState('');

  const handleSaveGoal = () => {
    const amount = parseFloat(goalAmount);
    if (goalTitle && !isNaN(amount) && amount > 0) {
      triggerHaptic('success');
      setGoal(goalTitle, amount);
      setIsModalVisible(false);
      setGoalTitle('');
      setGoalAmount('');
    }
  };

  useEffect(() => {
    if (totalSaved > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true })
      ]).start();
    }
  }, [totalSaved]);

  const targetAmount = activeGoal?.targetAmount || 1;
  const percentSaved = Math.min(100, (totalSaved / targetAmount) * 100);

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#F8FAFC', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}
      >
        {/* Glow orb background */}
        <View style={styles.glow} />

        <View style={styles.topRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={[styles.iconBg, { flexShrink: 0 }]}
            >
              <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[styles.widgetLabel, { color: colors.textSecondary }]}>{t.walletPage?.savingsBank || 'SAVINGS BANK'}</Text>
              <Text numberOfLines={1} style={[styles.totalAmountText, { color: '#10B981' }]}>
                +{currencySymbol}{totalSaved.toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              setIsModalVisible(true);
            }}
            style={[styles.setGoalBtn, { flexShrink: 0 }]}
            activeOpacity={0.8}
          >
            <Ionicons name="trophy-outline" size={14} color="#10B981" style={{ marginRight: 4, flexShrink: 0 }} />
            <Text numberOfLines={1} style={styles.setGoalText}>
              {activeGoal ? (t.walletPage?.editGoal || 'Hedef Düzenle') : (t.walletPage?.setGoal || 'Hedef Belirle')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Goal Section */}
        {activeGoal ? (
          <View style={styles.goalBox}>
            <View style={styles.goalHeaderRow}>
              <Text style={[styles.goalTitleText, { color: colors.text }]}>
                Target: {activeGoal.title} ({currencySymbol}{activeGoal.targetAmount})
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>
                {percentSaved.toFixed(0)}%
              </Text>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.progressBarFill, { width: `${percentSaved}%` }]} />
            </View>
          </View>
        ) : (
          <Text style={[styles.subHintText, { color: colors.textSecondary }]}>
            Money saved from cancelled subscriptions will accumulate in your Savings Bank!
          </Text>
        )}
      </LinearGradient>

      {/* Goal Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{(t.walletPage as any)?.setSavingsGoal || 'Set Savings Goal'}</Text>
            
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder={(t.walletPage as any)?.goalPlaceholder || 'Goal (e.g. Vacation, New Phone)'}
              placeholderTextColor={colors.textSecondary}
              value={goalTitle}
              onChangeText={setGoalTitle}
            />
            
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder={(t.walletPage as any)?.targetAmount || 'Target Amount'}
              placeholderTextColor={colors.textSecondary}
              value={goalAmount}
              onChangeText={setGoalAmount}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>{t.common?.cancel || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#10B981' }]}
                onPress={handleSaveGoal}
              >
                <Text style={{ color: '#FFF', fontWeight: '800' }}>{(t.walletPage as any)?.saveGoal || 'Save Goal'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  container: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  totalAmountText: {
    fontSize: 22,
    fontWeight: '900',
  },
  setGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    overflow: 'hidden',
  },
  setGoalText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  goalBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalTitleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  subHintText: {
    fontSize: 11,
    marginTop: 10,
    lineHeight: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    marginBottom: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
});

