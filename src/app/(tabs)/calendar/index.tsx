import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { SubscriptionCard } from '@/features/subscriptions/components/SubscriptionCard';
import { getMonthlyCost } from '@/features/dashboard/utils/calculations';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { currencyService } from '@/services/currencyService';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);
  
  const { data: subscriptions } = useSubscriptions();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);

  const currentYear = selectedDate.getFullYear();
  const currentMonthIndex = selectedDate.getMonth();

  // Helper to get number of days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper to get first day of month (0 = Sun, 1 = Mon...)
  // We want to shift it so Monday = 0, Sunday = 6
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // shift Sunday to end
  };

  // Generate calendar grid data
  const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonthIndex);
  
  const calendarDays = useMemo(() => {
    const days = [];
    // Add empty padding for the first row
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [firstDay, daysInMonth]);

  // Which days have payments this month?
  const paymentDaysThisMonth = useMemo(() => {
    if (!subscriptions) return new Set<number>();
    const activeSubs = subscriptions.filter(s => s.status === 'active');
    
    const days = new Set<number>();
    activeSubs.forEach(sub => {
      // In a real app we'd map this more rigorously based on billing cycle
      // For this UI, we extract the day from the renewal date
      if (sub.renewalDate) {
         const day = sub.renewalDate.toDate().getDate();
         days.add(day);
      }
    });
    return days;
  }, [subscriptions]);

  // Calculate monthly total
  const monthlyTotal = useMemo(() => {
    if (!subscriptions) return 0;
    const activeSubs = subscriptions.filter(s => s.status === 'active');
    
    let sum = 0;
    activeSubs.forEach(sub => {
      const amountInBase = currencyService.convert(sub.amount, sub.currency, baseCurrency);
      sum += getMonthlyCost(amountInBase, sub.billingCycle);
    });
    return sum;
  }, [subscriptions, baseCurrency]);

  const activeCount = subscriptions?.filter(s => s.status === 'active').length || 0;

  // Filter subscriptions due on the exactly selected day
  const dailySubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    return subscriptions.filter(s => {
      if (s.status !== 'active') return false;
      const subDay = s.renewalDate.toDate().getDate();
      return subDay === selectedDate.getDate();
    });
  }, [subscriptions, selectedDate]);

  const handleMonthSelect = (index: number) => {
    const newDate = new Date(currentYear, index, 1);
    setSelectedDate(newDate);
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonthIndex, day);
    setSelectedDate(newDate);
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 40) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', paddingHorizontal: 10, marginBottom: 24 }}>
          
          {/* 1. Month Selector & Hero Header */}
          <View style={{ marginBottom: 15 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
              {MONTHS.map((month, index) => {
                const isSelected = index === currentMonthIndex;
                return (
                  <TouchableOpacity 
                    key={month}
                    style={[dynamicStyles.monthPill, isSelected && dynamicStyles.monthPillSelected]}
                    onPress={() => handleMonthSelect(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[dynamicStyles.monthText, isSelected && dynamicStyles.monthTextSelected]}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 }}>
              <View>
                <Text style={dynamicStyles.heroMonth}>{MONTHS[currentMonthIndex]} {currentYear}</Text>
                <View style={dynamicStyles.costRow}>
                  <Text style={dynamicStyles.heroCost}>
                    {baseCurrency} {monthlyTotal.toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={dynamicStyles.paymentsPill}>
                <Text style={dynamicStyles.paymentsText}>{activeCount} Payments</Text>
              </View>
            </View>
          </View>

          {/* 2. Days Header (Mon-Sun) - MUST be 7 columns */}
          <View style={{ flexDirection: 'row', width: '100%', marginBottom: 10 }}>
            {DAYS.map(day => (
              <Text key={day} style={{ flex: 1, textAlign: 'center', color: colors.textSecondary, fontSize: 12 }}>{day}</Text>
            ))}
          </View>

          {/* 3. Days Grid - MUST be 7 columns */}
          <View style={dynamicStyles.calendarGrid}>
            {calendarDays.map((day, index) => {
              if (day === null) {
                return (
                  <View key={`empty-${index}`} style={dynamicStyles.dayCell} />
                );
              }

              const isSelected = day === selectedDate.getDate();
              const hasPayment = paymentDaysThisMonth.has(day);

              return (
                <TouchableOpacity 
                  key={`day-${day}`} 
                  style={dynamicStyles.dayCell}
                  onPress={() => handleDaySelect(day)}
                  activeOpacity={0.7}
                >
                  <View style={isSelected ? dynamicStyles.selectedDayCell : undefined}>
                    <Text style={[dynamicStyles.dayNumber, isSelected && dynamicStyles.selectedDayText]}>
                      {day}
                    </Text>
                  </View>
                  {hasPayment && (
                    <View style={dynamicStyles.paymentDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

        </View>

        {/* Selected Date Header & Payment Section */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={[dynamicStyles.dailyHeader, { marginTop: 24, marginBottom: 16 }]}>
            {selectedDate.getDate()} {MONTHS[currentMonthIndex]} {DAYS[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1]?.toUpperCase() || 'SUN'}
          </Text>

          <View style={{ paddingBottom: 40 }}>
            {dailySubscriptions.length === 0 ? (
              <View style={dynamicStyles.emptyState}>
                <Text style={dynamicStyles.emptyStateText}>{t('calendar.noPayments')}</Text>
              </View>
            ) : (
              dailySubscriptions.map(sub => (
                <View key={sub.id} style={dynamicStyles.paymentCard}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ color: colors.text, fontWeight: 'bold' }}>{sub.name.charAt(0)}</Text>
                    </View>
                    <Text style={dynamicStyles.paymentText}>{sub.name}</Text>
                  </View>
                  <Text style={[dynamicStyles.paymentText, { color: colors.text }]}>
                    {sub.currency} {sub.amount.toFixed(2)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Premium Dark background
  },
  scrollContent: {
    paddingBottom: 100,
  },
  monthSelectorContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  monthPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  monthPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  monthTextSelected: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  heroMonth: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCost: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 16,
  },
  paymentsPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paymentsText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  calendarContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10,
  },
  dayHeaderText: {
    width: '14.28%',
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  dayCell: {
    width: '14.28%', // Exactly 1/7th
    minHeight: 50, // Proper minHeight to prevent squishing
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  selectedDayCell: {
    backgroundColor: colors.text,
    borderRadius: 8, // Smaller radius for a tighter look
    width: 36, // Fixed small width
    height: 36, // Fixed small height
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 14,
    color: colors.text,
  },
  selectedDayText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  paymentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FBBF24',
    position: 'absolute',
    bottom: 6,
  },
  dailyDetailsContainer: {
    paddingHorizontal: 20,
  },
  dailyHeader: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 1,
  },
  emptyState: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12, // Reduced padding
    borderRadius: 12,
    marginHorizontal: 0, // Using 0 because parent view has paddingHorizontal: 20
    marginBottom: 8,
    height: 60, // Fixed height to prevent overflow
  },
  paymentText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  }
});
