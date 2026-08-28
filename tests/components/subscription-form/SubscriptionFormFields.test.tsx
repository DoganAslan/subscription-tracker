import React from 'react';
import { fireEvent, render, type RenderResult } from '@testing-library/react-native';
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import { Platform, Text } from 'react-native';
import { describe, expect, it, jest } from '@jest/globals';
import type {
  SubscriptionFormData,
  SubscriptionFormInput,
} from '@/features/subscriptions/schemas/subscription.schema';
import { OptionPickerField } from '@/features/subscriptions/components/subscription-form/fields/OptionPickerField';
import { AmountCurrencyField } from '@/features/subscriptions/components/subscription-form/fields/AmountCurrencyField';
import { SubscriptionDateField } from '@/features/subscriptions/components/subscription-form/fields/SubscriptionDateField';

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#0F172A',
      surface: '#1E293B',
      border: '#334155',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      primary: '#6366F1',
      danger: '#EF4444',
    },
  }),
}));

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: ({ testID, onChange }: { testID?: string; onChange: (event: unknown, date?: Date) => void }) => {
    const mockReact = require('react');
    const mockView = require('react-native').View;
    return mockReact.createElement(mockView, { testID, onChange });
  },
}));

const defaultValues: SubscriptionFormInput = {
  name: 'Netflix',
  category: 'Entertainment',
  amount: 12,
  currency: 'USD',
  billingCycle: 'monthly',
  renewalDate: new Date(2026, 7, 28),
  status: 'active',
  reminderOffset: '1_day',
  isTrial: false,
  trialEndDate: null,
  hasContract: false,
  contractEndDate: null,
  notes: null,
  isSplit: false,
  splitMembers: [],
  priceHistory: [],
};

function renderInForm(
  field: React.ReactElement,
) {
  function FormStateProbe() {
    const { control } = useFormContext<SubscriptionFormInput, undefined, SubscriptionFormData>();
    const values = useWatch({ control });
    const renewalDate = values.renewalDate;
    const renewalValue = renewalDate instanceof Date
      ? `${renewalDate.getFullYear()}-${renewalDate.getMonth() + 1}-${renewalDate.getDate()}-${renewalDate.getHours()}`
      : null;
    return <Text testID="form-values">{JSON.stringify({
      amount: values.amount,
      category: values.category,
      currency: values.currency,
      renewalDate: renewalValue,
    })}</Text>;
  }

  function FormHarness() {
    const formMethods = useForm<SubscriptionFormInput, undefined, SubscriptionFormData>({ defaultValues });
    return <FormProvider {...formMethods}>{field}<FormStateProbe /></FormProvider>;
  }

  return render(<FormHarness />);
}

function formValues(result: RenderResult): { amount: unknown; category: string; currency: string; renewalDate: string | null } {
  return JSON.parse(String(result.getByTestId('form-values').props.children)) as {
    amount: unknown;
    category: string;
    currency: string;
    renewalDate: string | null;
  };
}

function AmountErrorTrigger() {
  const { setError } = useFormContext<SubscriptionFormInput, undefined, SubscriptionFormData>();
  React.useEffect(() => {
    setError('amount', { message: 'Amount is required' });
  }, [setError]);
  return null;
}

const categoryOptions = [
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Productivity', label: 'Productivity' },
] as const;

const currencyOptions = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
] as const;

describe('subscription form fields', () => {
  it('changes a picker value, exposes the selected option, and closes its modal', async () => {
    const result = await renderInForm(
      <OptionPickerField
        name="category"
        label="Category"
        modalTitle="Select category"
        closeLabel="Close"
        options={categoryOptions}
      />,
    );

    await fireEvent.press(result.getByRole('button', { name: 'Category: Entertainment' }));

    expect(result.getByText('Select category')).toBeTruthy();
    expect(result.getByRole('button', { name: 'Entertainment' }).props.accessibilityState).toEqual({ selected: true });

    await fireEvent.press(result.getByRole('button', { name: 'Productivity' }));

    expect(formValues(result).category).toBe('Productivity');
    expect(result.queryByText('Select category')).toBeNull();
    expect(result.getByRole('button', { name: 'Category: Productivity' }).props.accessibilityState).toEqual({ expanded: false });
  });

  it('updates a sanitized amount independently from the selected currency and surfaces amount errors', async () => {
    const result = await renderInForm(
      <React.Fragment>
        <AmountCurrencyField
          amountLabel="Amount"
          currencyLabel="Currency"
          currencyModalTitle="Select currency"
          closeLabel="Close"
          amountPlaceholder="0.00"
          currencyOptions={currencyOptions}
        />
        <AmountErrorTrigger />
      </React.Fragment>,
    );

    expect(result.getByText('Amount is required')).toBeTruthy();
    await fireEvent.changeText(result.getByLabelText('Amount'), '12,345');
    await fireEvent.press(result.getByRole('button', { name: 'Currency: USD' }));
    await fireEvent.press(result.getByRole('button', { name: 'EUR (€)' }));

    expect(formValues(result).amount).toBe('12.34');
    expect(formValues(result).currency).toBe('EUR');
  });

  it('normalizes native and web date selections to the same local calendar day', async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });

    const nativeRender = await renderInForm(
      <SubscriptionDateField
        name="renewalDate"
        label="Renewal date"
        doneLabel="Done"
        formatDate={(date) => date.toLocaleDateString('en-CA')}
      />,
    );

    await fireEvent.press(nativeRender.getByRole('button', { name: 'Renewal date' }));
    await fireEvent(nativeRender.getByTestId('renewalDate-native-picker'), 'onChange', {}, new Date(2027, 0, 5, 18, 30));

    expect(formValues(nativeRender).renewalDate).toBe('2027-1-5-0');

    await nativeRender.unmount();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const webRender = await renderInForm(
      <SubscriptionDateField
        name="renewalDate"
        label="Renewal date"
        doneLabel="Done"
        formatDate={(date) => date.toLocaleDateString('en-CA')}
      />,
    );

    await fireEvent(webRender.getByTestId('renewalDate-web-input'), 'change', { target: { value: '2027-01-05' } });

    expect(formValues(webRender).renewalDate).toBe('2027-1-5-0');

    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  });

  it('uses full-width, flexible field layouts without fixed horizontal widths', async () => {
    const result = await renderInForm(
      <AmountCurrencyField
        amountLabel="Amount"
        currencyLabel="Currency"
        currencyModalTitle="Select currency"
        closeLabel="Close"
        amountPlaceholder="0.00"
        currencyOptions={currencyOptions}
      />,
    );

    const rowStyle = result.getByTestId('amount-currency-row').props.style;
    expect(rowStyle).toEqual(expect.objectContaining({ width: '100%', flexDirection: 'row' }));
    expect(rowStyle.width).not.toEqual(expect.any(Number));
    expect(result.getByTestId('amount-input-container').props.style).toEqual(expect.objectContaining({ flex: 1, flexShrink: 1 }));
  });
});
