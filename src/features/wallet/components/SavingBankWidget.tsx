import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useSavingsStore } from '@/store/useSavingsStore';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

export const SavingBankWidget = () => {
  const { totalSaved, goals, setGoal, deleteGoal } = useSavingsStore();
  const activeGoal = goals?.[0];
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalAmount, setGoalAmount] = useState('');

  const handleSaveGoal = () => {
    const amount = parseFloat(goalAmount);
    if (goalTitle && !isNaN(amount) && amount > 0) {
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

  if (totalSaved <= 0) return null;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={isDark ? ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)'] : ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, { borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)' }]}
      >
        {/* Glow effect */}
        <View style={styles.glow} />
        
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#34D399', '#059669']}
            style={styles.iconBg}
          >
            <Ionicons name="cash" size={26} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{'Saving Bank'}</Text>
            {activeGoal && (
              <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                <Ionicons name="pencil" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.amount}>+{totalSaved.toFixed(0)}</Text>
          
          {activeGoal ? (
            <View style={styles.goalContainer}>
              <View style={styles.goalHeader}>
                <Text style={[styles.goalTitle, { color: colors.textSecondary }]}>{activeGoal.title}</Text>
                <Text style={[styles.goalTitle, { color: colors.textSecondary }]}>
                  {Math.min(100, (totalSaved / activeGoal.targetAmount) * 100).toFixed(0)}%
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <View style={[
                  styles.progressBar, 
                  { 
                    backgroundColor: '#10B981', 
                    width: `${Math.min(100, (totalSaved / activeGoal.targetAmount) * 100)}%` 
                  }
                ]} />
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.setGoalBtn} onPress={() => setIsModalVisible(true)}>
              <Text style={styles.setGoalText}>Set a Savings Goal</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Goal Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Set Savings Goal</Text>
            
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Goal (e.g. PS5, Vacation)"
              placeholderTextColor={colors.textSecondary}
              value={goalTitle}
              onChangeText={setGoalTitle}
            />
            
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Target Amount"
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
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#10B981' }]}
                onPress={handleSaveGoal}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Save</Text>
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
    marginHorizontal: 24,
    marginBottom: 8,
    marginTop: 8,
  },
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    filter: 'blur(20px)' as any,
  },
  iconContainer: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  goalContainer: {
    marginTop: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  setGoalBtn: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  setGoalText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
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
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  }
});


