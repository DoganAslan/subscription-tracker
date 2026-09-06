import React from 'react';
import { Alert, Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { afterEach, describe, beforeEach, expect, it, jest } from '@jest/globals';
import { Timestamp } from 'firebase/firestore';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator } from 'expo-image-manipulator';
import { analyzeReceiptImage } from '@/services/ai/gemini';
import type { Subscription } from '@/services/firebase/types';
import type { SubscriptionFormData } from '@/features/subscriptions/schemas/subscription.schema';
import { SubscriptionForm } from '@/features/subscriptions/components/SubscriptionForm';

let mockMonthlyBudget: number | null = null;
let mockSubscriptions: Subscription[] = [];

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#0F172A',
      surface: '#1E293B',
      surfaceSubtle: '#111827',
      border: '#334155',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      primary: '#6366F1',
      primaryDark: '#4F46E5',
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
        posttrialPrice: 'Post-trial price',
        reminderOffset: 'Reminder offset',
        renewalDate: 'Renewal date',
        selectACard: 'Select a card',
        selectACategory: 'Select a category',
        selectCategory: 'Select category',
        selectCurrency: 'Select currency',
        selectPaymentMethod: 'Select payment method',
      },
    },
  }),
}));

jest.mock('@/features/subscriptions/hooks/useSubscriptions', () => ({
  useSubscriptions: () => ({ data: mockSubscriptions }),
}));

jest.mock('@/store/useBudgetStore', () => ({
  useBudgetStore: (selector?: (state: { monthlyBudget: number | null }) => unknown) => {
    const state = { monthlyBudget: mockMonthlyBudget };
    return selector ? selector(state) : state;
  },
}));

jest.mock('@/store/useCurrencyStore', () => ({
  useCurrencyStore: (selector: (state: { baseCurrency: string }) => unknown) => (
    selector({ baseCurrency: 'USD' })
  ),
}));

jest.mock('@/features/cards/hooks/useCards', () => ({
  useCards: () => ({
    data: [{
      id: 'card-1',
      userId: 'user-1',
      name: 'Everyday',
      type: 'visa',
      lastFourDigits: '4242',
      expiryMonth: 8,
      expiryYear: 2030,
      color: '#000000',
      currency: 'USD',
    }],
  }),
}));

jest.mock('@/utils/haptics', () => ({ triggerHaptic: jest.fn() }));
jest.mock('@/utils/whatsapp', () => ({ dispatchWhatsAppReminder: jest.fn() }));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

type MockReceiptImage = { uri: string; width: number; height: number; base64: string };
const mockSaveAsync = jest.fn<() => Promise<MockReceiptImage>>();
const mockRenderAsync = jest.fn(async () => ({ saveAsync: mockSaveAsync }));
const mockResize = jest.fn();

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: {
    manipulate: jest.fn(() => ({ resize: mockResize, renderAsync: mockRenderAsync })),
  },
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('@/services/ai/gemini', () => ({ analyzeReceiptImage: jest.fn() }));

const initialData: Subscription = {
  id: 'subscription-1',
  name: 'Netflix',
  category: 'Entertainment',
  amount: 18.99,
  currency: 'USD',
  billingCycle: 'monthly',
  renewalDate: Timestamp.fromDate(new Date('2026-09-15T00:00:00.000Z')),
  status: 'active',
  pauseEndDate: null,
  reminderOffset: '1_day',
  isTrial: false,
  trialEndDate: Timestamp.fromDate(new Date('2026-09-15T00:00:00.000Z')),
  hasContract: false,
  contractEndDate: new Date('2027-08-28T00:00:00.000Z'),
  notes: 'Family plan',
  cardId: null,
  isSplit: false,
  splitMembers: [],
  priceHistory: [{ amount: 17.99, date: '2026-08-01' }],
  createdAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00.000Z')),
  updatedAt: Timestamp.fromDate(new Date('2026-08-01T00:00:00.000Z')),
};

const renderForm = (props: Partial<React.ComponentProps<typeof SubscriptionForm>> = {}) => render(
  <SafeAreaProvider initialMetrics={{
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  }}>
    <SubscriptionForm
      onSubmit={async (_data: SubscriptionFormData) => undefined}
      isLoading={false}
      submitLabel="Save subscription"
      {...props}
    />
  </SafeAreaProvider>,
);

const pressSubmit = async (result: Awaited<ReturnType<typeof renderForm>>) => {
  await fireEvent.press(result.getByRole('button', { name: 'Save subscription' }));
};

describe('SubscriptionForm public facade', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mockMonthlyBudget = null;
    mockSubscriptions = [];
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({
      status: 'granted' as ImagePicker.PermissionStatus,
      granted: true,
      canAskAgain: true,
      expires: 'never',
      accessPrivileges: 'all',
    });
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///receipt.png', width: 1200, height: 1600 }],
    });
    mockSaveAsync.mockResolvedValue({
      uri: 'file:///receipt.jpg',
      width: 1200,
      height: 1600,
      base64: 'receipt-base64',
    });
    jest.mocked(analyzeReceiptImage).mockResolvedValue(null);
  });

  it('shows new-form defaults through the existing public import', async () => {
    const newForm = await renderForm();
    expect(newForm.getByLabelText('Name').props.value).toBe('');
    expect(newForm.getByLabelText('Amount').props.value).toBe('');
    expect(newForm.getByRole('button', { name: 'Currency: USD' })).toBeTruthy();
  });

  it('shows a visible validation message when required fields are missing', async () => {
    const result = await renderForm();

    await pressSubmit(result);

    await waitFor(() => expect(result.getByText('Please complete the required fields.')).toBeTruthy());
  });

  it('preserves category guidance in the category picker', async () => {
    const result = await renderForm();

    await fireEvent.press(result.getByRole('button', { name: 'Category: Select a category' }));

    expect(result.getByText('Netflix, Disney+, Cable')).toBeTruthy();
    expect(result.getByText('Notion, Claude, Github, Adobe')).toBeTruthy();
  });

  it('shows edit values through the existing public import', async () => {
    const editForm = await renderForm({ initialData, children: <Text>Existing subscription insights</Text> });
    expect(editForm.getByText('Existing subscription insights')).toBeTruthy();
    expect(editForm.getByLabelText('Name').props.value).toBe('Netflix');
    expect(editForm.getByLabelText('Amount').props.value).toBe('18.99');
    expect(editForm.getByRole('button', { name: 'Category: Entertainment' })).toBeTruthy();
    expect(editForm.getByRole('button', { name: 'Billing cycle: Monthly' })).toBeTruthy();
  });

  it('changes category and billing-cycle selectors in the real form', async () => {
    const result = await renderForm({ initialData });

    await fireEvent.press(result.getByRole('button', { name: 'Category: Entertainment' }));
    await fireEvent.press(result.getAllByRole('button', { name: 'Productivity & Tools' })[0]);
    await fireEvent.press(result.getByRole('button', { name: 'Billing cycle: Monthly' }));
    await fireEvent.press(result.getByRole('button', { name: 'Yearly' }));

    expect(result.getByRole('button', { name: 'Category: Productivity & Tools' })).toBeTruthy();
    expect(result.getByRole('button', { name: 'Billing cycle: Yearly' })).toBeTruthy();
  });

  it('owns split-member append and remove behavior inside the split section', async () => {
    const result = await renderForm();

    await fireEvent.press(result.getByRole('button', { name: 'Advanced options' }));
    await fireEvent(result.getByRole('switch', { name: 'Split subscription' }), 'valueChange', true);
    expect(result.getByLabelText('Partner 1 name')).toBeTruthy();

    await fireEvent.press(result.getByRole('button', { name: 'Add New Partner' }));
    expect(result.getByLabelText('Partner 2 name')).toBeTruthy();
    await fireEvent.press(result.getByRole('button', { name: 'Remove Partner 1' }));

    expect(result.queryByText('Partner 2')).toBeNull();
    expect(result.getByText('Partner 1')).toBeTruthy();
  });

  it('applies only fields present in a successful receipt patch', async () => {
    jest.mocked(analyzeReceiptImage).mockResolvedValue({
      name: 'Receipt subscription',
      amount: 42.5,
      currency: 'EUR',
      billingCycle: 'monthly',
    });
    const result = await renderForm();
    await fireEvent.changeText(result.getByLabelText('Name'), 'Keep this name');

    await fireEvent.press(result.getByRole('button', { name: 'Fill from a receipt with AI' }));

    await waitFor(() => expect(result.getByLabelText('Amount').props.value).toBe('42.5'));
    expect(result.getByLabelText('Name').props.value).toBe('Receipt subscription');
    expect(result.getByRole('button', { name: 'Currency: EUR' })).toBeTruthy();
    expect(jest.mocked(ImageManipulator.manipulate)).toHaveBeenCalledWith('file:///receipt.png');
  });

  it('syncs externalAmount through the typed form value and submits the parsed number', async () => {
    const onSubmit = jest.fn(async (_data: SubscriptionFormData) => undefined);
    const result = await renderForm({ initialData, externalAmount: 27.45, onSubmit });

    await waitFor(() => expect(result.getByLabelText('Amount').props.value).toBe('27.45'));
    await pressSubmit(result);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].amount).toBe(27.45);
  });

  it('submits the exact schema-parsed payload', async () => {
    const onSubmit = jest.fn(async (_data: SubscriptionFormData) => undefined);
    const result = await renderForm({ initialData, onSubmit });

    await fireEvent.changeText(result.getByLabelText('Name'), '  Netflix Family  ');
    await fireEvent.changeText(result.getByLabelText('Amount'), '20,50');
    await fireEvent.press(result.getByRole('button', { name: 'Category: Entertainment' }));
    await fireEvent.press(result.getAllByRole('button', { name: 'Productivity & Tools' })[0]);
    await fireEvent.press(result.getByRole('button', { name: 'Billing cycle: Monthly' }));
    await fireEvent.press(result.getByRole('button', { name: 'Yearly' }));
    await pressSubmit(result);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toStrictEqual({
      name: 'Netflix Family',
      category: 'Productivity',
      amount: 20.5,
      currency: 'USD',
      billingCycle: 'yearly',
      renewalDate: new Date('2026-09-15T00:00:00.000Z'),
      status: 'active',
      pauseEndDate: null,
      reminderOffset: '1_day',
      isTrial: false,
      trialEndDate: new Date('2026-09-15T00:00:00.000Z'),
      hasContract: false,
      contractEndDate: new Date('2027-08-28T00:00:00.000Z'),
      notes: 'Family plan',
      usageFrequency: undefined,
      lastUsedDate: undefined,
      usageScore: undefined,
      usageLogDates: undefined,
      cardId: null,
      isSplit: false,
      splitMembers: [],
      priceHistory: [{ amount: 17.99, date: '2026-08-01' }],
    });
  });

  it('keeps the form mounted when an over-budget save is cancelled', async () => {
    mockMonthlyBudget = 10;
    const onSubmit = jest.fn(async (_data: SubscriptionFormData) => undefined);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const result = await renderForm({ initialData, onSubmit });

    await pressSubmit(result);
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));
    await act(async () => {
      alert.mock.calls[0][2]?.[0].onPress?.();
      await Promise.resolve();
    });

    await waitFor(() => expect(result.getByLabelText('Name').props.value).toBe('Netflix'));
    await waitFor(() => expect(
      result.getByRole('button', { name: 'Save subscription' }).props.accessibilityState,
    ).toEqual({ disabled: false }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits once when an over-budget save is confirmed', async () => {
    mockMonthlyBudget = 10;
    const onSubmit = jest.fn(async (_data: SubscriptionFormData) => undefined);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const result = await renderForm({ initialData, onSubmit });

    await pressSubmit(result);
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));
    await act(async () => {
      alert.mock.calls[0][2]?.[1].onPress?.();
      await Promise.resolve();
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it('contains an async rejection, preserves values, and releases the submit lock for retry', async () => {
    const onSubmit = jest.fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(undefined);
    const result = await renderForm({ initialData, onSubmit });
    await fireEvent.changeText(result.getByLabelText('Name'), 'Still mounted');

    await pressSubmit(result);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.getByLabelText('Name').props.value).toBe('Still mounted'));
    await pressSubmit(result);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(result.getByLabelText('Name').props.value).toBe('Still mounted');
  });

  it('prevents duplicate submits during external loading and guard-owned pending work', async () => {
    const externallyLoadingSubmit = jest.fn(async () => undefined);
    const loadingForm = await renderForm({ initialData, isLoading: true, onSubmit: externallyLoadingSubmit });
    await pressSubmit(loadingForm);
    await pressSubmit(loadingForm);
    expect(externallyLoadingSubmit).not.toHaveBeenCalled();
    await loadingForm.unmount();

    let releaseSubmit: (() => void) | undefined;
    const pendingSubmit = jest.fn(() => new Promise<void>((resolve) => {
      releaseSubmit = resolve;
    }));
    const pendingForm = await renderForm({ initialData, onSubmit: pendingSubmit });
    await pressSubmit(pendingForm);
    await pressSubmit(pendingForm);
    await waitFor(() => expect(pendingSubmit).toHaveBeenCalledTimes(1));

    await act(async () => {
      releaseSubmit?.();
    });
  });
});
