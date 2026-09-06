import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it } from '@jest/globals';
import type { Subscription } from '@/services/firebase/types';
import SubscriptionListScreen from '@/app/(tabs)/subscriptions';

type SubscriptionQueryState = {
  data: Subscription[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: jest.Mock;
};

const mockPush = jest.fn<void, [string]>();
const mockRefetch = jest.fn();
let mockSubscriptionState: SubscriptionQueryState;
let mockLanguage = 'en';

jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  const mockedReactNative = Object.create(reactNative);

  Object.defineProperty(mockedReactNative, 'useWindowDimensions', {
    enumerable: true,
    value: jest.fn(),
  });

  return mockedReactNative;
});

const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<typeof useWindowDimensions>;

jest.mock('expo-router', () => ({
  router: { push: mockPush },
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => {
    const ReactModule = require('react') as typeof import('react');
    const { View } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(View, null, children);
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/features/subscriptions/hooks/useSubscriptions', () => ({
  useSubscriptions: () => mockSubscriptionState,
}));
jest.mock('@/features/subscriptions/components/SubscriptionCard', () => ({
  SubscriptionCard: () => null,
}));
jest.mock('@/components/common/AppLoader', () => ({
  AppLoader: () => null,
}));
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#000000',
      surface: '#111111',
      border: '#333333',
      primary: '#3B82F6',
      text: '#FFFFFF',
      textSecondary: '#AAAAAA',
    },
  }),
}));
jest.mock('@/context/LanguageContext', () => ({
  useTranslation: () => ({
    currentLanguage: mockLanguage,
    t: {
      common: { error: 'Error' },
      home: { failedToLoad: 'Failed to load subscriptions' },
      subscriptionsPage: { title: 'My Subscriptions' },
    },
  }),
}));
jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => ({ user: { displayName: 'Test User', photoURL: null } }),
}));
jest.mock('@/store/useProfileStore', () => ({
  useProfileStore: () => ({ profileImage: null }),
}));
jest.mock('@/store/useCurrencyStore', () => ({
  useCurrencyStore: (selector: (state: { baseCurrency: string }) => unknown) => selector({ baseCurrency: 'TRY' }),
}));
jest.mock('@/utils/currency', () => ({
  CURRENCY_RATES: { TRY: 1 },
  SUPPORTED_CURRENCIES: [{ code: 'TRY', symbol: '₺' }],
}));
jest.mock('@/utils/haptics', () => ({ triggerHaptic: jest.fn() }));

describe('Subscriptions responsive layout', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockRefetch.mockReset();
    mockUseWindowDimensions.mockReturnValue({
      width: 820,
      height: 1180,
      scale: 2,
      fontScale: 1,
    });
    mockSubscriptionState = {
      data: [],
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch,
    };
    mockLanguage = 'en';
  });

  it('localizes every empty-list message in Turkish', async () => {
    mockLanguage = 'tr';
    const result = await render(<SubscriptionListScreen />);

    expect(result.getByText('Henüz abonelik yok')).toBeTruthy();
    expect(result.getByText('İlk aboneliğini aşağıdaki düğmeyle ekleyebilirsin.')).toBeTruthy();
    expect(result.queryByText('No Subscriptions')).toBeNull();
  });

  it('uses one shared gutter around the loaded subscription list', async () => {
    const result = await render(<SubscriptionListScreen />);

    const boundary = result.getByTestId('subscriptions-responsive-content');
    const boundaryStyle = StyleSheet.flatten(boundary.props.style);
    const [list] = boundary.queryAll(instance => instance.type === 'RCTScrollView');
    const listContentStyle = StyleSheet.flatten(list.props.contentContainerStyle);

    expect(boundaryStyle).toEqual(expect.objectContaining({
      maxWidth: 1180,
      paddingHorizontal: 24,
      width: '100%',
    }));
    expect(listContentStyle).toEqual(expect.objectContaining({ paddingBottom: 180 }));
    expect(listContentStyle.paddingHorizontal).toBeUndefined();
    expect(boundary.queryAll(instance => instance.type === 'RCTScrollView')).toHaveLength(1);
    expect(boundary.queryAll(instance => instance.props.children === 'My Subscriptions')).toHaveLength(0);
  });

  it.each([
    ['loading', { isLoading: true, isError: false }],
    ['error', { isLoading: false, isError: true }],
  ])('keeps the %s state outside the loaded responsive boundary', async (_stateName, state) => {
    mockSubscriptionState = { ...mockSubscriptionState, ...state, data: undefined };

    const result = await render(<SubscriptionListScreen />);

    expect(result.queryByTestId('subscriptions-responsive-content')).toBeNull();
    expect(result.getByText('My Subscriptions')).toBeTruthy();
  });
});
