import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Timestamp } from 'firebase/firestore';
import AddSubscriptionScreen from '@/app/(tabs)/subscriptions/add';
import EditSubscriptionScreen from '@/app/(tabs)/subscriptions/[id]';
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
  status: 'active',
  pauseEndDate: null,
  reminderOffset: '1_day',
  isTrial: false,
  trialEndDate: null,
  hasContract: false,
  contractEndDate: null,
  notes: '',
  cardId: null,
  isSplit: false,
  splitMembers: [],
  priceHistory: [],
  createdAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00.000Z')),
  updatedAt: Timestamp.fromDate(new Date('2026-08-01T00:00:00.000Z')),
};

jest.mock('react-native/Libraries/Components/Keyboard/KeyboardAvoidingView', () => ({
  __esModule: true,
  default: ({ children, testID, ...props }: import('react-native').KeyboardAvoidingViewProps) => {
    const ReactModule = require('react') as typeof import('react');
    const NativeView = require('react-native/Libraries/Components/View/View').default;
    return ReactModule.createElement(
      NativeView,
      { ...props, testID: testID ?? 'keyboard-avoiding-view' },
      children,
    );
  },
}));

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

jest.mock('@/store/useBudgetStore', () => ({
  useBudgetStore: (selector: (state: { monthlyBudget: number | null }) => unknown) => (
    selector({ monthlyBudget: null })
  ),
}));

jest.mock('@/store/useCurrencyStore', () => ({
  useCurrencyStore: (selector: (state: { baseCurrency: string }) => unknown) => (
    selector({ baseCurrency: 'USD' })
  ),
}));

jest.mock('@/features/cards/hooks/useCards', () => ({
  useCards: () => ({ data: [] }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/services/ai/gemini', () => ({ analyzeReceiptImage: jest.fn() }));
jest.mock('@/utils/whatsapp', () => ({ dispatchWhatsAppReminder: jest.fn() }));
jest.mock('@/utils/haptics', () => ({ triggerHaptic: jest.fn() }));
jest.mock('@/features/subscriptions/components/PauseSubscriptionCard', () => ({ PauseSubscriptionCard: () => null }));
jest.mock('@/features/subscriptions/components/PaymentHistoryWidget', () => ({ PaymentHistoryWidget: () => null }));
jest.mock('@/features/subscriptions/components/SplitTrackerCard', () => ({ SplitTrackerCard: () => null }));
jest.mock('@/features/subscriptions/components/DeleteConfirmationModal', () => ({ DeleteConfirmationModal: () => null }));
jest.mock('@/features/ai/components/AiNegotiatorModal', () => ({ AiNegotiatorModal: () => null }));
jest.mock('@/components/common/AppLoader', () => ({ AppLoader: () => null }));
jest.mock('@/services/notificationService', () => ({ requestNotificationPermissions: jest.fn() }));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#0F172A',
      surface: '#1E293B',
      surfaceSubtle: '#111827',
      border: '#334155',
      primary: '#6366F1',
      primaryDark: '#4F46E5',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      danger: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      heroGradient: ['#6366F1', '#4F46E5', '#312E81'],
      cardBg: '#1E293B',
    },
  }),
}));

jest.mock('@/context/LanguageContext', () => ({
  useTranslation: () => ({
    currentLanguage: 'en',
    t: {
      common: { cancel: 'Cancel' },
      healthScore: { warning: 'Budget warning' },
      subs: {
        name: 'Name',
        category: 'Category',
        billingCycle: 'Billing cycle',
        notes: 'Notes',
      },
      form: {
        updateHeader: 'Update',
        splitTitle: 'Split',
        splitSubtitle: 'Share costs with others',
        partner: 'Partner',
        name: 'Name',
        phone: 'Phone',
        amount: 'Split amount',
        sendReminder: 'Send WhatsApp Reminder',
        trialTitle: 'Trial Version',
        trialSubtitle: 'Track expiration and avoid sudden charges',
        addPartner: 'Add New Partner',
      },
      global: {
        '000': '0.00',
        close: 'Close',
        deleteSubscription: 'Delete Subscription',
        done: 'Done',
        egNetflix: 'e.g. Netflix',
        egSharedWithFamily: 'e.g. Shared with family',
        goBack: 'Go back',
        posttrialPrice: 'Post-trial price',
        reminderOffset: 'Reminder offset',
        renewalDate: 'Renewal date',
        selectACard: 'Select a card',
        selectACategory: 'Select a category',
        selectCategory: 'Select category',
        selectCurrency: 'Select currency',
        selectPaymentMethod: 'Select payment method',
        subscriptionNotFound: 'Subscription not found',
      },
      subscriptionsPage: { addSub: 'Add Subscription', addSubscription: 'Add Subscription' },
    },
  }),
}));

const findRouteHeader = (result: Awaited<ReturnType<typeof render>>) => {
  return result.getByTestId('subscription-route-header');
};

const findVerticalFormScroll = (result: Awaited<ReturnType<typeof render>>) => {
  const scroll = result.root?.queryAll(
    (instance) => instance.type === 'RCTScrollView' && instance.props.horizontal !== true,
  )[0];
  if (!scroll) throw new Error('Subscription form ScrollView was not rendered');
  return scroll;
};

describe('subscription iOS keyboard layout', () => {
  const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');

  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  });

  beforeEach(() => {
    mockReplace.mockClear();
    mockAddSubscription.mockClear();
    mockUpdateSubscription.mockClear();
  });

  afterAll(() => {
    if (platformDescriptor) Object.defineProperty(Platform, 'OS', platformDescriptor);
  });

  it('applies current and measured iOS keyboard geometry to the add route', async () => {
    const result = await render(<AddSubscriptionScreen />);

    expect(result.getByTestId('keyboard-avoiding-view').props).toEqual(expect.objectContaining({
      behavior: 'padding',
      keyboardVerticalOffset: 111,
    }));
    expect(StyleSheet.flatten(result.getByTestId('subscription-form-safe-content').props.style)).toEqual(
      expect.objectContaining({ paddingBottom: 34 }),
    );

    await fireEvent(findRouteHeader(result), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 72 } },
    });

    expect(result.getByTestId('keyboard-avoiding-view').props.keyboardVerticalOffset).toBe(131);
  });

  it('keeps the real valid edit form scroll and actions reachable with measured geometry', async () => {
    const result = await render(<EditSubscriptionScreen />);

    expect(result.getByTestId('keyboard-avoiding-view').props).toEqual(expect.objectContaining({
      behavior: 'padding',
      keyboardVerticalOffset: 111,
    }));
    expect(findVerticalFormScroll(result).props.keyboardShouldPersistTaps).toBe('handled');
    expect(result.getByRole('button', { name: 'Update' }).props.accessibilityState).toEqual({
      disabled: false,
    });
    expect(result.getByRole('button', { name: 'Delete Subscription' }).props.accessibilityState).toEqual({
      disabled: false,
    });

    await fireEvent(findRouteHeader(result), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 68 } },
    });

    expect(result.getByTestId('keyboard-avoiding-view').props.keyboardVerticalOffset).toBe(127);
  });
});
