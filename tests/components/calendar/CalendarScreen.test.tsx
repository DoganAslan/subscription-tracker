import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Subscription } from '@/services/firebase/types';
import CalendarRoute from '@/app/(tabs)/calendar';
import CalendarScreen from '@/features/calendar/screens/CalendarScreen';

const mockPush = jest.fn<(path: string) => void>();
const mockSubscription: Subscription = {
  id: 'calendar-subscription',
  name: 'Calendar Service',
  category: 'Entertainment',
  amount: 120,
  currency: 'TRY',
  billingCycle: 'monthly',
  renewalDate: {
    toDate: () => new Date(2026, 7, 18, 12),
    toMillis: () => new Date(2026, 7, 18, 12).getTime(),
  } as Subscription['renewalDate'],
  notes: null,
  createdAt: {} as Subscription['createdAt'],
  updatedAt: {} as Subscription['updatedAt'],
};

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => {
    const ReactModule = require('react') as typeof import('react');
    const { View } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(View, null, children);
  },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/features/subscriptions/hooks/useSubscriptions', () => ({
  useSubscriptions: () => ({ data: [mockSubscription] }),
}));
jest.mock('@/store/useCurrencyStore', () => ({
  useCurrencyStore: (selector?: (state: { baseCurrency: string }) => unknown) => {
    const state = { baseCurrency: 'TRY' };
    return selector ? selector(state) : state;
  },
}));
jest.mock('@/utils/currency', () => ({
  CURRENCY_RATES: { TRY: 1, USD: 0.03, EUR: 0.027 },
  SUPPORTED_CURRENCIES: [{ code: 'TRY', symbol: '₺' }],
}));
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#000000', surface: '#111111', surfaceSubtle: '#161616', border: '#333333',
      primary: '#3B82F6', primaryDark: '#2563EB', text: '#FFFFFF', textSecondary: '#AAAAAA',
      danger: '#EF4444', success: '#10B981', warning: '#F59E0B', heroGradient: ['#1', '#2', '#3'], cardBg: '#111111',
    },
  }),
}));
jest.mock('@/context/LanguageContext', () => ({
  useTranslation: () => ({
    currentLanguage: 'en',
    t: {
      months: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'],
      categories: {},
    },
  }),
}));
jest.mock('@/utils/haptics', () => ({ triggerHaptic: jest.fn() }));

describe('Calendar screen boundary', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it('keeps the Expo route as the feature-screen facade', () => {
    expect(CalendarRoute).toBe(CalendarScreen);
  });

  it('moves between months and exposes the selected day payment', async () => {
    const result = await render(<CalendarScreen initialDate={new Date(2026, 7, 15, 12)} />);

    expect(result.getByText('AUGUST 2026')).toBeTruthy();
    fireEvent.press(result.getByRole('button', { name: 'Select day 18' }));
    await waitFor(() => expect(result.getByText('Calendar Service')).toBeTruthy());

    fireEvent.press(result.getByRole('button', { name: 'Next month' }));
    await waitFor(() => expect(result.getByText('SEPTEMBER 2026')).toBeTruthy());
  });
});
