import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Timestamp } from 'firebase/firestore';
import type { Subscription } from '@/services/firebase/types';
import type { SubscriptionFormData } from '@/features/subscriptions/schemas/subscription.schema';
import { triggerHaptic } from '@/utils/haptics';
import AddSubscriptionScreen from '@/app/(tabs)/subscriptions/add';
import EditSubscriptionScreen from '@/app/(tabs)/subscriptions/[id]';

type AddMutationMock = {
  mutate: jest.Mock<(data: SubscriptionFormData) => void>;
  mutateAsync: jest.Mock<(data: SubscriptionFormData) => Promise<unknown>>;
  isPending: boolean;
};

type UpdateMutationInput = { id: string; data: SubscriptionFormData };
type UpdateMutationMock = {
  mutate: jest.Mock<(input: UpdateMutationInput) => void>;
  mutateAsync: jest.Mock<(input: UpdateMutationInput) => Promise<unknown>>;
  isPending: boolean;
};

interface MockSubscriptionFormProps {
  initialData?: Subscription;
  onSubmit: (data: SubscriptionFormData) => void | Promise<void>;
}

let mockAddMutation: AddMutationMock;
let mockUpdateMutation: UpdateMutationMock;
let mockSubscription: Subscription;
const mockReplace = jest.fn<(path: string) => void>();

const mockSubmittedFormData: SubscriptionFormData = {
  name: 'Route test',
  category: 'Productivity',
  amount: 19.99,
  currency: 'USD',
  billingCycle: 'monthly',
  renewalDate: new Date('2026-09-15T00:00:00.000Z'),
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
};

const expectedFormData = (): SubscriptionFormData => ({
  name: 'Route test',
  category: 'Productivity',
  amount: 19.99,
  currency: 'USD',
  billingCycle: 'monthly',
  renewalDate: new Date('2026-09-15T00:00:00.000Z'),
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
});

const createDeferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({ id: 'subscription-1' }),
}));

jest.mock('@/features/subscriptions/hooks/useSubscriptions', () => ({
  useAddSubscription: () => mockAddMutation,
  useUpdateSubscription: () => mockUpdateMutation,
  useSubscriptions: () => ({ data: [mockSubscription], isLoading: false, isFetching: false }),
  useDeleteSubscription: () => ({ mutate: jest.fn(), isPending: false }),
  useTogglePauseSubscription: () => ({ mutate: jest.fn() }),
}));

jest.mock('@/features/subscriptions/components/SubscriptionForm', () => ({
  SubscriptionForm: ({ initialData, onSubmit }: MockSubscriptionFormProps) => {
    const ReactModule = require('react') as typeof import('react');
    const { Text: NativeText, TouchableOpacity, View } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(
      View,
      { accessibilityLabel: initialData ? 'Edit subscription form' : 'Add subscription form' },
      ReactModule.createElement(NativeText, null, initialData ? 'Edit form ready' : 'Add form ready'),
      ReactModule.createElement(
        TouchableOpacity,
        {
          accessibilityRole: 'button',
          accessibilityLabel: 'Submit route form',
          onPress: () => { void onSubmit(mockSubmittedFormData); },
        },
        ReactModule.createElement(NativeText, null, 'Submit'),
      ),
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

describe('subscription add/edit routes', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    jest.mocked(triggerHaptic).mockReset();
    mockAddMutation = {
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isPending: false,
    };
    mockUpdateMutation = {
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isPending: false,
    };
    mockSubscription = {
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
  });

  it('waits for add mutation success before navigating exactly once', async () => {
    const pending = createDeferred();
    mockAddMutation.mutateAsync.mockReturnValue(pending.promise);
    const result = await render(<AddSubscriptionScreen />);

    fireEvent.press(result.getByRole('button', { name: 'Submit route form' }));

    await waitFor(() => expect(mockAddMutation.mutateAsync).toHaveBeenCalledTimes(1));
    expect(mockAddMutation.mutateAsync.mock.calls[0][0]).toStrictEqual(expectedFormData());
    expect(mockReplace).not.toHaveBeenCalled();

    await act(async () => { pending.resolve(); });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/subscriptions'));
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(triggerHaptic).not.toHaveBeenCalled();
  });

  it('keeps the add route rendered and does not navigate after rejection', async () => {
    mockAddMutation.mutateAsync.mockRejectedValue(new Error('add failed'));
    const result = await render(<AddSubscriptionScreen />);

    fireEvent.press(result.getByRole('button', { name: 'Submit route form' }));

    await waitFor(() => expect(mockAddMutation.mutateAsync).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.getByText('Add form ready')).toBeTruthy());
    expect(mockReplace).not.toHaveBeenCalled();
    expect(triggerHaptic).not.toHaveBeenCalled();
  });

  it('waits for update mutation success before navigating exactly once', async () => {
    const pending = createDeferred();
    mockUpdateMutation.mutateAsync.mockReturnValue(pending.promise);
    const result = await render(<EditSubscriptionScreen />);

    fireEvent.press(result.getByRole('button', { name: 'Submit route form' }));

    await waitFor(() => expect(mockUpdateMutation.mutateAsync).toHaveBeenCalledTimes(1));
    expect(mockUpdateMutation.mutateAsync.mock.calls[0][0]).toStrictEqual({
      id: 'subscription-1',
      data: expectedFormData(),
    });
    expect(mockReplace).not.toHaveBeenCalled();

    await act(async () => { pending.resolve(); });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/subscriptions'));
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(triggerHaptic).not.toHaveBeenCalled();
  });

  it('keeps the edit route rendered and does not navigate after rejection', async () => {
    mockUpdateMutation.mutateAsync.mockRejectedValue(new Error('update failed'));
    const result = await render(<EditSubscriptionScreen />);

    fireEvent.press(result.getByRole('button', { name: 'Submit route form' }));

    await waitFor(() => expect(mockUpdateMutation.mutateAsync).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.getByText('Edit form ready')).toBeTruthy());
    expect(mockReplace).not.toHaveBeenCalled();
    expect(triggerHaptic).not.toHaveBeenCalled();
  });
});
