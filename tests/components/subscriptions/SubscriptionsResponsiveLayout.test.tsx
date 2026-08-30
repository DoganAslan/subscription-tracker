import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import SubscriptionListScreen from '@/app/(tabs)/subscriptions';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
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
jest.mock('@/features/subscriptions/components/SubscriptionList', () => ({
  SubscriptionList: () => null,
}));
jest.mock('@/components/common/Header', () => ({ Header: () => null }));
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ colors: { background: '#000000', primary: '#3B82F6' } }),
}));
jest.mock('@/context/LanguageContext', () => ({
  useTranslation: () => ({ t: { subscriptionsPage: { title: 'My Subscriptions' } } }),
}));
jest.mock('@/utils/haptics', () => ({ triggerHaptic: jest.fn() }));

describe('Subscriptions responsive layout', () => {
  it('renders the main content inside the shared responsive shell', async () => {
    const result = await render(<SubscriptionListScreen />);

    expect(result.getByTestId('subscriptions-responsive-content')).toBeTruthy();
  });
});
