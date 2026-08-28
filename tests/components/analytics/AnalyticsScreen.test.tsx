import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Subscription } from '@/services/firebase/types';
import AnalyticsRoute from '@/app/(tabs)/analytics';
import AnalyticsScreen from '@/features/analytics/screens/AnalyticsScreen';

const mockPush = jest.fn<(path: string) => void>();
const mockUpdate = jest.fn();
let mockSubscriptions: Subscription[] = [];

const timestamp = (date: Date): Subscription['renewalDate'] => ({
  toDate: () => new Date(date),
  toMillis: () => date.getTime(),
}) as Subscription['renewalDate'];
const subscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'subscription',
  name: 'Netflix',
  category: 'Entertainment',
  amount: 120,
  currency: 'TRY',
  billingCycle: 'monthly',
  renewalDate: timestamp(new Date(2026, 8, 10, 12)),
  notes: null,
  createdAt: timestamp(new Date(2026, 0, 1)),
  updatedAt: timestamp(new Date(2026, 0, 1)),
  ...overrides,
});

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => {
    const ReactModule = require('react') as typeof import('react');
    const { View } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(View, null, children);
  },
}));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => {
    const ReactModule = require('react') as typeof import('react');
    const { View } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(View, null, children);
  },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/features/ai/components/AiChatModal', () => ({ AiChatModal: () => null }));
jest.mock('@/features/analytics/components/FinancialDecisionTools', () => ({
  FinancialDecisionTools: ({ subscriptions, onLogUsage }: { subscriptions: Subscription[]; onLogUsage: (item: Subscription) => void }) => {
    const ReactModule = require('react') as typeof import('react');
    const { Text, TouchableOpacity } = require('react-native') as typeof import('react-native');
    if (!subscriptions[0]) return null;
    return ReactModule.createElement(TouchableOpacity, { accessibilityRole: 'button', accessibilityLabel: 'Log usage', onPress: () => onLogUsage(subscriptions[0]) }, ReactModule.createElement(Text, null, 'Log usage'));
  },
}));
jest.mock('@/features/subscriptions/hooks/useSubscriptions', () => ({
  useSubscriptions: () => ({ data: mockSubscriptions, isLoading: false, isRefetching: false, refetch: jest.fn() }),
  useUpdateSubscription: () => ({ mutate: mockUpdate }),
}));
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ colors: { background: '#000', surface: '#111', surfaceSubtle: '#171717', border: '#333', primary: '#3B82F6', text: '#FFF', textSecondary: '#AAA' } }),
}));
jest.mock('@/context/LanguageContext', () => ({ useTranslation: () => ({ currentLanguage: 'en' }) }));
jest.mock('@/store/useCurrencyStore', () => ({ useCurrencyStore: (selector: (state: { baseCurrency: string }) => unknown) => selector({ baseCurrency: 'TRY' }) }));
jest.mock('@/store/useBudgetStore', () => ({ useBudgetStore: (selector: (state: { monthlyBudget: number | null }) => unknown) => selector({ monthlyBudget: 1000 }) }));
jest.mock('@/utils/currency', () => ({
  CURRENCY_RATES: { TRY: 1, USD: 0.03, EUR: 0.027 },
  getMarketRatesWithDynamicCache: () => new Promise<never>(() => undefined),
}));
jest.mock('@/utils/haptics', () => ({ triggerHaptic: jest.fn() }));

describe('Analytics screen boundary', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockUpdate.mockReset();
    mockSubscriptions = [];
  });

  it('keeps the Expo route as the feature-screen facade', () => {
    expect(AnalyticsRoute).toBe(AnalyticsScreen);
  });

  it('keeps the empty state action reachable', async () => {
    const result = await render(<AnalyticsScreen />);
    fireEvent.press(result.getByText('Add subscription'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/subscriptions/add');
  });

  it('reveals the selected month payments from the cash-flow chart', async () => {
    mockSubscriptions = [subscription()];
    const result = await render(<AnalyticsScreen initialDate={new Date(2026, 7, 29, 12)} />);
    const beforeSelection = result.getAllByText('Netflix').length;
    fireEvent.press(result.getByRole('button', { name: /Show Sep payments/i }));
    await waitFor(() => expect(result.getAllByText('Netflix').length).toBeGreaterThan(beforeSelection));
  });

  it('delegates usage logging to the typed mutation action', async () => {
    mockSubscriptions = [subscription()];
    const result = await render(<AnalyticsScreen initialDate={new Date(2026, 7, 29, 12)} />);
    fireEvent.press(result.getByRole('button', { name: 'Log usage' }));

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      id: 'subscription',
      data: expect.objectContaining({ usageScore: 1 }),
    }), expect.any(Object));
  });
});
