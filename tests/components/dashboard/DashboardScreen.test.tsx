import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Subscription } from '@/services/firebase/types';
import DashboardRoute from '@/app/(tabs)';
import DashboardScreen from '@/features/dashboard/screens/DashboardScreen';

const mockPush = jest.fn<(path: string) => void>();
let mockSubscriptions: Subscription[] = [];
const mockUser = { displayName: 'Test User', photoURL: null };

jest.mock('react-native/Libraries/Lists/FlatList', () => {
  const ReactModule = require('react') as typeof import('react');
  function MockFlatList({
    data,
    renderItem,
    ListHeaderComponent,
  }: {
    data: Subscription[];
    renderItem: (input: { item: Subscription; index: number }) => React.ReactElement | null;
    ListHeaderComponent?: React.ReactElement | null;
  }) {
    return ReactModule.createElement(
      ReactModule.Fragment,
      null,
      ListHeaderComponent,
      ...data.map((item, index) => ReactModule.cloneElement(
        renderItem({ item, index }) as React.ReactElement,
        { key: item.id ?? index },
      )),
    );
  }

  return { __esModule: true, default: MockFlatList };
});

const timestamp = (date: Date): Subscription['renewalDate'] => ({
  toDate: () => new Date(date),
  toMillis: () => date.getTime(),
}) as Subscription['renewalDate'];

const subscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'subscription',
  name: 'Netflix',
  category: 'Entertainment',
  amount: 100,
  currency: 'TRY',
  billingCycle: 'monthly',
  renewalDate: timestamp(new Date(2026, 8, 10)),
  notes: null,
  createdAt: timestamp(new Date(2026, 0, 1)),
  updatedAt: timestamp(new Date(2026, 0, 1)),
  ...overrides,
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => void) => callback(),
}));

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
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: () => new Promise<string | null>(() => undefined),
}));

jest.mock('@/features/subscriptions/hooks/useSubscriptions', () => ({
  useSubscriptions: () => ({
    data: mockSubscriptions,
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/features/cards/hooks/useCards', () => ({ useCards: () => ({ data: [] }) }));
jest.mock('@/features/subscriptions/components/SubscriptionCard', () => ({
  SubscriptionCard: ({ subscription: item }: { subscription: Subscription }) => {
    const ReactModule = require('react') as typeof import('react');
    const { Text } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(Text, null, `subscription:${item.name}`);
  },
}));
jest.mock('@/features/subscriptions/components/SubscriptionSkeleton', () => ({
  SubscriptionSkeleton: () => {
    const ReactModule = require('react') as typeof import('react');
    const { Text } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(Text, null, 'loading');
  },
}));
jest.mock('@/components/FloatingActionButton', () => ({ FloatingActionButton: () => null }));
jest.mock('@/components/DoomBanner', () => ({ DoomBanner: () => null }));
jest.mock('@/features/dashboard/components/CategoryBreakdownCard', () => ({ CategoryBreakdownCard: () => null }));
jest.mock('@/components/ProfileDrawerModal', () => ({ ProfileDrawerModal: () => null }));
jest.mock('@/features/analytics/components/SubmateWrappedModal', () => ({ SubmateWrappedModal: () => null }));
jest.mock('@/features/ai/components/AiChatModal', () => ({ AiChatModal: () => null }));
jest.mock('@/features/ai/components/AiSummaryCard', () => ({ AiSummaryCard: () => null }));
jest.mock('@/features/dashboard/services/quickActionsStore', () => ({
  ALL_QUICK_ACTIONS: [],
  getSavedQuickActions: () => new Promise<never>(() => undefined),
}));
jest.mock('@/utils/vault', () => ({ exportVaultBackup: jest.fn() }));
jest.mock('@/utils/reportExporter', () => ({ exportCsvReport: jest.fn() }));
jest.mock('@/hooks/useAnalytics', () => ({ useAnalytics: () => ({ categoryBreakdown: [] }) }));
jest.mock('@/utils/heroTheme', () => ({
  HERO_GRADIENT_PRESETS: [],
  getSavedHeroGradient: () => new Promise<never>(() => undefined),
  saveHeroGradient: jest.fn(),
}));
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: true,
    colors: {
      background: '#000000',
      surface: '#111111',
      surfaceSubtle: '#161616',
      border: '#333333',
      primary: '#3B82F6',
      text: '#FFFFFF',
      textSecondary: '#AAAAAA',
    },
  }),
}));
jest.mock('@/context/LanguageContext', () => ({
  useTranslation: () => ({ currentLanguage: 'en', t: {} }),
}));
jest.mock('@/components/SpringButton', () => ({
  SpringButton: ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => {
    const ReactModule = require('react') as typeof import('react');
    const { TouchableOpacity } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(TouchableOpacity, { onPress }, children);
  },
}));
jest.mock('@/store/useCurrencyStore', () => ({
  useCurrencyStore: (selector?: (state: { baseCurrency: string; setBaseCurrency: jest.Mock }) => unknown) => {
    const state = { baseCurrency: 'TRY', setBaseCurrency: jest.fn() };
    return selector ? selector(state) : state;
  },
}));
jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: { user: typeof mockUser }) => unknown) => selector({ user: mockUser }),
}));
jest.mock('@/store/useProfileStore', () => ({ useProfileStore: () => ({ profileImage: null }) }));
jest.mock('@/utils/haptics', () => ({ triggerHaptic: jest.fn() }));
jest.mock('@/services/notificationService', () => ({
  getUnreadNotificationCount: () => new Promise<never>(() => undefined),
  requestNotificationPermissions: jest.fn(),
}));
jest.mock('@/utils/currency', () => ({
  CURRENCY_RATES: { TRY: 1, USD: 0.03, EUR: 0.027 },
  SUPPORTED_CURRENCIES: [{ code: 'TRY', symbol: '₺' }],
  getMarketRatesWithDynamicCache: () => new Promise<never>(() => undefined),
}));

describe('Dashboard screen boundary', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSubscriptions = [
      subscription({ id: 'netflix', name: 'Netflix' }),
      subscription({ id: 'spotify', name: 'Spotify', category: 'Audio' }),
    ];
  });

  it('keeps the Expo route as the feature-screen facade', () => {
    expect(DashboardRoute).toBe(DashboardScreen);
  });

  it('renders the main content inside the shared responsive shell', async () => {
    const result = await render(<DashboardScreen />);

    expect(result.getByTestId('dashboard-responsive-content')).toBeTruthy();
  });

  it('filters subscription output from the search field', async () => {
    const result = await render(<DashboardScreen />);

    fireEvent.changeText(result.getByPlaceholderText('Search subscriptions, transactions...'), 'spotify');

    await waitFor(() => {
      expect(result.getAllByText('subscription:Spotify').length).toBeGreaterThan(0);
      expect(result.queryByText('subscription:Netflix')).toBeNull();
    });
  });

  it('opens notification history from the header action', async () => {
    const result = await render(<DashboardScreen />);

    fireEvent.press(result.getByRole('button', { name: 'Open notifications' }));

    expect(mockPush).toHaveBeenCalledWith('/notifications');
  });
});
