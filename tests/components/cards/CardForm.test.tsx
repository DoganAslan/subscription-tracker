import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { CardForm } from '@/features/cards/components/CardForm';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 24, left: 0 }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('@/utils/haptics', () => ({ triggerHaptic: jest.fn() }));
jest.mock('@/components/ui/KeyboardAccessory', () => ({
  KeyboardAccessory: () => null,
  KEYBOARD_ACCESSORY_ID: 'DONE_BAR',
}));
jest.mock('@/features/cards/components/CardWidget', () => ({ CardWidget: () => null }));
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: true,
    colors: { background: '#000', surface: '#111', border: '#333', primary: '#3B82F6', text: '#FFF', textSecondary: '#AAA', danger: '#F44' },
  }),
}));
jest.mock('@/context/LanguageContext', () => ({
  useTranslation: () => ({
    currentLanguage: 'tr',
    t: {
      global: {
        cardName: 'Kart adı', cardType: 'Kart türü', lastFourDigits: 'Son 4 hane', currency: 'Para birimi',
        expiryMonth: 'Son kullanma ayı', expiryYear: 'Son kullanma yılı', cardColor: 'Kart rengi',
        monthlyLimit: 'Aylık kart limiti', monthlyLimitPlaceholder: 'Örn. 5000', selectCardType: 'Kart türünü seç',
        selectCurrency: 'Para birimini seç', close: 'Kapat',
      },
    },
  }),
}));

describe('CardForm', () => {
  it('submits an optional monthly card limit and only exposes card types allowed by Firestore rules', async () => {
    const onSubmit = jest.fn();
    const result = await render(<CardForm onSubmit={onSubmit} isLoading={false} submitLabel="Kart Ekle" />);

    await fireEvent.changeText(result.getByPlaceholderText('e.g., Virtual Shopping Card'), 'Günlük kart');
    await fireEvent.changeText(result.getByPlaceholderText('e.g. 4321'), '4321');
    await fireEvent.changeText(result.getByPlaceholderText('Örn. 5000'), '5000,50');
    await fireEvent.press(result.getByText('KART TÜRÜ').parent?.parent?.parent as never);
    expect(result.queryByText('UnionPay')).toBeNull();
    await fireEvent.press(result.getByText('Troy'));
    await fireEvent.press(result.getByText('Kart Ekle'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      type: 'troy',
      monthlyLimit: 5000.5,
    })));
  });

  it('shows localized color names in Turkish', async () => {
    const result = await render(<CardForm onSubmit={jest.fn()} isLoading={false} submitLabel="Kart Ekle" />);
    expect(result.getByText('Gece siyahı')).toBeTruthy();
    expect(result.getByText('Kraliyet mavisi')).toBeTruthy();
    expect(result.queryByText('Slate Black')).toBeNull();
  });
});
