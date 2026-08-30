import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Timestamp } from 'firebase/firestore';
import AddSubscriptionScreen from '@/app/(tabs)/subscriptions/add';
import EditSubscriptionScreen from '@/app/(tabs)/subscriptions/[id]';
import * as keyboardLayout from '@/components/layout/keyboardLayout';
import type { Subscription } from '@/services/firebase/types';

const mockReplace = jest.fn();
const mockAddSubscription = jest.fn(async () => undefined);
const mockUpdateSubscription = jest.fn(async () => undefined);

const mockSubscription: Subscription = {
  id: 'subscription-1',
  name: 'Existing subscription',
  category: 'Productivity',
  amount: 19.99,
  currency: 'USD',
  billingCycle: 'monthly',
  renewalDate: Timestamp.fromDate(new Date('2026-09-15T00:00:00.000Z')),
  notes: '',
  createdAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00.000Z')),
  updatedAt: Timestamp.fromDate(new Date('2026-08-01T00:00:00.000Z')),
};

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({ id: 'subscription-1' }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, style }: {
    children: React.ReactNode;
    style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
  }) => {
    const ReactModule = require('react') as typeof import('react');
    const { View: NativeView } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(NativeView, { style }, children);
  },
  useSafeAreaInsets: () => ({ top: 59, right: 0, bottom: 34, left: 0 }),
}));

jest.mock('@/features/subscriptions/hooks/useSubscriptions', () => ({
  useAddSubscription: () => ({ mutateAsync: mockAddSubscription, isPending: false }),
  useUpdateSubscription: () => ({ mutateAsync: mockUpdateSubscription, isPending: false }),
  useSubscriptions: () => ({ data: [mockSubscription], isLoading: false, isFetching: false }),
  useDeleteSubscription: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useTogglePauseSubscription: () => ({ mutate: jest.fn() }),
}));

jest.mock('@/features/subscriptions/components/SubscriptionForm', () => ({
  SubscriptionForm: ({
    isLoading,
    submitLabel,
  }: {
    isLoading: boolean;
    submitLabel: string;
  }) => {
    const ReactModule = require('react') as typeof import('react');
    const { Text: NativeText, TouchableOpacity: NativeTouchableOpacity } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(
      NativeTouchableOpacity,
      {
        accessibilityRole: 'button',
        accessibilityLabel: submitLabel,
        disabled: isLoading,
      },
      ReactModule.createElement(NativeText, null, submitLabel),
    );
  },
}));

jest.mock('@/features/subscriptions/components/PauseSubscriptionCard', () => ({ PauseSubscriptionCard: () => null }));
jest.mock('@/features/subscriptions/components/PaymentHistoryWidget', () => ({ PaymentHistoryWidget: () => null }));
jest.mock('@/features/subscriptions/components/SplitTrackerCard', () => ({ SplitTrackerCard: () => null }));
jest.mock('@/features/subscriptions/components/DeleteConfirmationModal', () => ({ DeleteConfirmationModal: () => null }));
jest.mock('@/features/ai/components/AiNegotiatorModal', () => ({ AiNegotiatorModal: () => null }));
jest.mock('@/components/common/AppLoader', () => ({ AppLoader: () => null }));
jest.mock('@/services/notificationService', () => ({ requestNotificationPermissions: jest.fn() }));
jest.mock('@/utils/haptics', () => ({ triggerHaptic: jest.fn() }));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#0F172A',
      border: '#334155',
      primary: '#3B82F6',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
    },
  }),
}));

jest.mock('@/context/LanguageContext', () => ({
  useTranslation: () => ({
    currentLanguage: 'en',
    t: {
      common: { cancel: 'Cancel' },
      form: { updateHeader: 'Update' },
      global: { goBack: 'Go back', subscriptionNotFound: 'Subscription not found' },
      subscriptionsPage: { addSub: 'Add Subscription', addSubscription: 'Add Subscription' },
    },
  }),
}));

describe('subscription iOS keyboard layout', () => {
  const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
  const keyboardLayoutSpy = jest.spyOn(keyboardLayout, 'getKeyboardLayout');

  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  });

  beforeEach(() => {
    keyboardLayoutSpy.mockClear();
    mockReplace.mockClear();
    mockAddSubscription.mockClear();
    mockUpdateSubscription.mockClear();
  });

  afterAll(() => {
    keyboardLayoutSpy.mockRestore();
    if (platformDescriptor) Object.defineProperty(Platform, 'OS', platformDescriptor);
  });

  it('keeps the add form and save action inside current safe-area keyboard geometry', async () => {
    const result = await render(<AddSubscriptionScreen />);

    expect(keyboardLayoutSpy).toHaveBeenCalledWith('ios', 59, 52);
    expect(StyleSheet.flatten(result.getByTestId('subscription-form-safe-content').props.style)).toEqual(
      expect.objectContaining({ paddingBottom: 34 }),
    );
    expect(result.getByRole('button', { name: 'Save subscription' }).props.accessibilityState).toEqual({
      disabled: false,
    });
  });

  it('keeps the edit form and update action inside current safe-area keyboard geometry', async () => {
    const result = await render(<EditSubscriptionScreen />);

    expect(keyboardLayoutSpy).toHaveBeenCalledWith('ios', 59, 52);
    expect(StyleSheet.flatten(result.getByTestId('subscription-form-safe-content').props.style)).toEqual(
      expect.objectContaining({ paddingBottom: 34 }),
    );
    expect(result.getByRole('button', { name: 'Update' }).props.accessibilityState).toEqual({
      disabled: false,
    });
  });
});
