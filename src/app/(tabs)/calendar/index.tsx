import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { getMonthlyCost } from '@/features/dashboard/utils/calculations';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { convertCurrency, SUPPORTED_CURRENCIES } from '@/utils/currency';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getCategoryMeta = (cat: string) => {
  const c = String(cat || '').toLowerCase();
  if (c.includes('music') || c.includes('müzik') || c.includes('audio') || c.includes('spotify')) {
    return { icon: 'musical-notes-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
  }
  if (c.includes('entertain') || c.includes('eğlence') || c.includes('tv') || c.includes('video') || c.includes('stream') || c.includes('netflix')) {
    return { icon: 'film-outline', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
  }
  if (c.includes('product') || c.includes('üretken') || c.includes('work') || c.includes('cloud') || c.includes('software') || c.includes('tool')) {
    return { icon: 'briefcase-outline', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
  }
  if (c.includes('health') || c.includes('fit') || c.includes('spor') || c.includes('sağlık') || c.includes('gym')) {
    return { icon: 'fitness-outline', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
  }
  if (c.includes('game') || c.includes('oyun')) {
    return { icon: 'game-controller-outline', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' };
  }
  if (c.includes('finan') || c.includes('sigorta') || c.includes('bank')) {
    return { icon: 'wallet-outline', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
  }
  return { icon: 'sparkles-outline', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)' };
};

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, currentLanguage } = useTranslation();
  
  const { data: subscriptions } = useSubscriptions();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency)?.symbol || baseCurrency;

  const currentMonthIndex = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const localizedMonthName = 
    (Array.isArray(t.months) && t.months[currentMonthIndex]) || 
    selectedDate.toLocaleString(currentLanguage === 'tr' ? 'tr-TR' : 'en-US', { month: 'long' }).toUpperCase();

  // Helper to get number of days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper to get first day of month (0 = Sun, 1 = Mon...) shifted so Mon = 0
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonthIndex);
  
  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [firstDay, daysInMonth]);

  // Which days have payments this month?
  const paymentDaysMap = useMemo(() => {
    const map = new Map<number, number>(); // day -> count
    if (!subscriptions) return map;

    subscriptions.forEach(sub => {
      if (sub.status === 'paused') return;
      if (sub.renewalDate) {
        const ren = sub.renewalDate.toDate();
        if (ren.getMonth() === currentMonthIndex && ren.getFullYear() === currentYear) {
          const day = ren.getDate();
          map.set(day, (map.get(day) || 0) + 1);
        }
      }
    });
    return map;
  }, [subscriptions, currentMonthIndex, currentYear]);

  // Calculate monthly total
  const monthlyTotal = useMemo(() => {
    if (!subscriptions) return 0;
    let sum = 0;
    subscriptions.forEach(sub => {
      if (sub.status === 'paused') return;
      const amountInBase = convertCurrency(sub.amount, sub.currency || 'USD', baseCurrency);
      sum += getMonthlyCost(amountInBase, sub.billingCycle);
    });
    return sum;
  }, [subscriptions, baseCurrency]);

  const activeCount = subscriptions?.filter(s => s.status !== 'paused').length || 0;

  // Filter subscriptions due on the exactly selected day
  const dailySubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    return subscriptions.filter(s => {
      if (s.status === 'paused') return false;
      if (!s.renewalDate) return false;
      const ren = s.renewalDate.toDate();
      return (
        ren.getDate() === selectedDate.getDate() &&
        ren.getMonth() === selectedDate.getMonth() &&
        ren.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [subscriptions, selectedDate]);

  const handlePrevMonth = () => {
    triggerHaptic('selection');
    setSelectedDate(new Date(currentYear, currentMonthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    triggerHaptic('selection');
    setSelectedDate(new Date(currentYear, currentMonthIndex + 1, 1));
  };

  const handleDaySelect = (day: number) => {
    triggerHaptic('selection');
    const newDate = new Date(currentYear, currentMonthIndex, day);
    setSelectedDate(newDate);
  };

  const handleOpenSubscription = (id?: string) => {
    if (!id) return;
    triggerHaptic('impactLight');
    router.push(`/(tabs)/subscriptions/${id}`);
  };

  const paddingTop = Math.max(insets.top + 8, Platform.OS === 'web' ? 16 : 12);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background, paddingTop }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Renewal Calendar</Text>
          <View style={[styles.activePill, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
            <Ionicons name="calendar-outline" size={14} color="#3B82F6" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#3B82F6' }}>
              {activeCount} Active
            </Text>
          </View>
        </View>

        {/* 1. Summary Banner & Month Navigation */}
        <View style={[styles.calendarHeaderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.monthNavRow}>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {`${localizedMonthName} ${currentYear}`}
            </Text>

            <View style={[styles.chevronGroup, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.chevronBtn} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={18} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.chevronDivider} />
              <TouchableOpacity onPress={handleNextMonth} style={styles.chevronBtn} activeOpacity={0.7}>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.totalRow}>
            <View>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Monthly Due</Text>
              <Text style={[styles.totalAmount, { color: colors.text }]}>
                {currencySymbol}{monthlyTotal.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity 
              onPress={() => setSelectedDate(new Date())}
              style={[styles.todayBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.todayBtnText}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Days Header (Mon-Sun) */}
        <View style={styles.weekHeaderRow}>
          {DAYS.map(day => (
            <Text key={day} style={[styles.weekHeaderText, { color: colors.textSecondary }]}>{day}</Text>
          ))}
        </View>

        {/* 3. Days Grid */}
        <View style={[styles.calendarGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <View key={`empty-${index}`} style={[styles.dayCell, { borderColor: colors.border }]} />;
            }

            const isSelected = day === selectedDate.getDate();
            const paymentCount = paymentDaysMap.get(day) || 0;
            const hasPayment = paymentCount > 0;

            return (
              <TouchableOpacity 
                key={`day-${day}`} 
                style={[
                  styles.dayCell, 
                  { borderColor: colors.border },
                  isSelected && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }
                ]}
                onPress={() => handleDaySelect(day)}
                activeOpacity={0.75}
              >
                <View style={[styles.dayNumberCircle, isSelected && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.dayNumberText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                    {day}
                  </Text>
                </View>

                {hasPayment && (
                  <View style={styles.paymentDotRow}>
                    <View style={styles.paymentDot} />
                    {paymentCount > 1 && (
                      <Text style={styles.paymentDotCount}>{paymentCount}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Selected Day Payments Section */}
        <View style={styles.dailySection}>
          <View style={styles.dailyHeaderRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.dailyHeaderText, { color: colors.text }]}>
              {selectedDate.getDate()} {localizedMonthName} • Payments ({dailySubscriptions.length})
            </Text>
          </View>

          {dailySubscriptions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="checkmark-circle-outline" size={36} color="#10B981" style={{ marginBottom: 6 }} />
              <Text style={[styles.emptyTextTitle, { color: colors.text }]}>No Renewals Due Today</Text>
              <Text style={[styles.emptyTextSub, { color: colors.textSecondary }]}>
                No recurring subscription payments scheduled for this date.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {dailySubscriptions.map(sub => {
                const catMeta = getCategoryMeta(sub.category || sub.name);
                const convertedAmount = convertCurrency(sub.amount, sub.currency || 'USD', baseCurrency);
                const showConversion = (sub.currency || 'USD') !== baseCurrency;

                return (
                  <TouchableOpacity
                    key={sub.id}
                    onPress={() => handleOpenSubscription(sub.id)}
                    activeOpacity={0.75}
                    style={[styles.subItemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.subItemLeft}>
                      <View style={[styles.subItemIconBox, { backgroundColor: catMeta.bg }]}>
                        <Ionicons name={catMeta.icon as any} size={22} color={catMeta.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.subItemName, { color: colors.text }]} numberOfLines={1}>
                          {sub.name}
                        </Text>
                        <Text style={[styles.subItemCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                          {(t.categories as any)?.[sub.category] || sub.category} • {sub.billingCycle}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.subItemRight}>
                      {showConversion ? (
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.subItemPrice, { color: colors.text }]}>
                            {currencySymbol}{convertedAmount.toFixed(2)}
                          </Text>
                          <Text style={[styles.subItemConverted, { color: colors.textSecondary }]}>
                            ({sub.amount.toFixed(0)} {sub.currency})
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.subItemPrice, { color: colors.text }]}>
                          {sub.currency} {sub.amount.toFixed(2)}
                        </Text>
                      )}
                      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 140,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  calendarHeaderCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  chevronGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 2,
  },
  chevronBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chevronDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  todayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  todayBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekHeaderText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dayCell: {
    width: '14.28%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  paymentDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 4,
  },
  paymentDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
  },
  paymentDotCount: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
    marginLeft: 2,
  },
  dailySection: {
    marginTop: 4,
  },
  dailyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyHeaderText: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTextTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyTextSub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  subItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  subItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  subItemIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subItemName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  subItemCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  subItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subItemPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  subItemConverted: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
});

