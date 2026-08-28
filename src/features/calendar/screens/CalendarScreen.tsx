import React, { useState } from 'react';
import { StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { SUPPORTED_CURRENCIES } from '@/utils/currency';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';
import { useCalendarViewModel } from '@/features/calendar/hooks/useCalendarViewModel';
import { CalendarHeader } from '@/features/calendar/components/CalendarHeader';
import { MonthNavigator } from '@/features/calendar/components/MonthNavigator';
import { CalendarGrid } from '@/features/calendar/components/CalendarGrid';
import { PaymentDayList } from '@/features/calendar/components/PaymentDayList';

const WEEK_DAYS = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
};

type CalendarScreenProps = {
  initialDate?: Date;
};

export default function CalendarScreen({ initialDate }: CalendarScreenProps = {}) {
  const [selectedDate, setSelectedDate] = useState(() => initialDate ? new Date(initialDate) : new Date());
  const router = useRouter();
  const { colors } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const weekDays = isTurkish ? WEEK_DAYS.tr : WEEK_DAYS.en;
  
  const { data: subscriptions } = useSubscriptions();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);
  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency)?.symbol || baseCurrency;
  const calendar = useCalendarViewModel(subscriptions, selectedDate);
  const {
    monthIndex: currentMonthIndex,
    year: currentYear,
    calendarDays,
    paymentCountByDay: paymentDaysMap,
    monthlyTotal,
    activeCount,
    dailyPayments,
  } = calendar;

  const localizedMonthName = 
    (Array.isArray(t.months) && t.months[currentMonthIndex]) || 
    selectedDate.toLocaleString(currentLanguage === 'tr' ? 'tr-TR' : 'en-US', { month: 'long' }).toUpperCase();
  const categoryNames = t.categories as Record<string, string>;

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

  const handleOpenSubscription = (id: string) => {
    triggerHaptic('impactLight');
    router.push(`/(tabs)/subscriptions/${id}`);
  };

  const screenTopSpacing = Platform.OS === 'web' ? 16 : 8;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: screenTopSpacing }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CalendarHeader colors={colors} isTurkish={isTurkish} activeCount={activeCount} />
        <MonthNavigator
          colors={colors}
          isTurkish={isTurkish}
          title={`${localizedMonthName} ${currentYear}`}
          currencySymbol={currencySymbol}
          monthlyTotal={monthlyTotal}
          onPrevious={handlePrevMonth}
          onNext={handleNextMonth}
          onToday={() => setSelectedDate(new Date())}
        />
        <CalendarGrid
          colors={colors}
          weekDays={weekDays}
          days={calendarDays}
          selectedDay={selectedDate.getDate()}
          paymentCountByDay={paymentDaysMap}
          onSelectDay={handleDaySelect}
        />
        <PaymentDayList
          colors={colors}
          isTurkish={isTurkish}
          selectedDay={selectedDate.getDate()}
          monthName={localizedMonthName}
          payments={dailyPayments}
          baseCurrency={baseCurrency}
          currencySymbol={currencySymbol}
          categoryNames={categoryNames}
          onOpenSubscription={handleOpenSubscription}
        />
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
});
