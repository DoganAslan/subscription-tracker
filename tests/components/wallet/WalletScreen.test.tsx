import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Card, Subscription } from '@/services/firebase/types';
import WalletRoute from '@/app/(tabs)/wallet';
import WalletScreen from '@/features/wallet/screens/WalletScreen';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockUpdateCard = jest.fn();
let mockCards: Card[] = [];
let mockSubscriptions: Subscription[] = [];
let mockLanguage = 'en';
const timestamp = (date: Date): Subscription['renewalDate'] => ({ toDate: () => new Date(date), toMillis: () => date.getTime() }) as Subscription['renewalDate'];
const card = (): Card => ({ id: 'card', userId: 'user', name: 'Main card', type: 'visa', expiryMonth: 12, expiryYear: 2030, monthlyLimit: 500, color: '#2563EB', currency: 'TRY', createdAt: timestamp(new Date()) as Card['createdAt'], updatedAt: timestamp(new Date()) as Card['updatedAt'] });
const subscription = (): Subscription => ({ id: 'sub', name: 'Yearly tool', category: 'Software', amount: 1200, currency: 'TRY', billingCycle: 'yearly', renewalDate: timestamp(new Date(2026, 8, 10)), cardId: 'card', notes: null, createdAt: timestamp(new Date()), updatedAt: timestamp(new Date()) });

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, navigate: mockNavigate }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }: { children: React.ReactNode }) => { const ReactModule = require('react') as typeof import('react'); const { View } = require('react-native') as typeof import('react-native'); return ReactModule.createElement(View, null, children); } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/features/cards/hooks/useCards', () => ({ useCards: () => ({ data: mockCards, isLoading: false }), useUpdateCard: () => ({ mutate: mockUpdateCard }) }));
jest.mock('@/features/subscriptions/hooks/useSubscriptions', () => ({ useSubscriptions: () => ({ data: mockSubscriptions, isLoading: false }) }));
jest.mock('@/features/cards/components/CardWidget', () => ({ CardWidget: ({ card: item, onTogglePin }: { card: Card; onTogglePin: () => void }) => { const ReactModule = require('react') as typeof import('react'); const { Text, TouchableOpacity, View } = require('react-native') as typeof import('react-native'); return ReactModule.createElement(View, null, ReactModule.createElement(Text, null, `card:${item.name}`), ReactModule.createElement(TouchableOpacity, { accessibilityRole: 'button', accessibilityLabel: 'Toggle pin', onPress: onTogglePin }, ReactModule.createElement(Text, null, 'pin'))); } }));
jest.mock('@/context/ThemeContext', () => ({ useTheme: () => ({ isDark: true, colors: { background: '#000', surface: '#111', border: '#333', primary: '#3B82F6', text: '#FFF', textSecondary: '#AAA' } }) }));
jest.mock('@/context/LanguageContext', () => ({ useTranslation: () => ({ currentLanguage: mockLanguage, t: { walletPage: {}, common: { edit: mockLanguage === 'tr' ? 'Düzenle' : 'Edit' } } }) }));
jest.mock('@/store/useCurrencyStore', () => ({ useCurrencyStore: (selector: (state: { baseCurrency: string }) => unknown) => selector({ baseCurrency: 'TRY' }) }));
jest.mock('@/utils/currency', () => ({ CURRENCY_RATES: { TRY: 1, USD: 0.03, EUR: 0.027 }, SUPPORTED_CURRENCIES: [{ code: 'TRY', symbol: '₺' }] }));
jest.mock('@/utils/haptics', () => ({ triggerHaptic: jest.fn() }));

describe('Wallet screen boundary', () => {
  beforeEach(() => { mockPush.mockReset(); mockNavigate.mockReset(); mockUpdateCard.mockReset(); mockCards = []; mockSubscriptions = []; mockLanguage = 'en'; });
  it('keeps the Expo route as the feature-screen facade', () => expect(WalletRoute).toBe(WalletScreen));
  it('opens the add-card route from the empty state', async () => { const result = await render(<WalletScreen />); await fireEvent.press(result.getByText('Add First Card')); expect(mockPush).toHaveBeenCalledWith('/(tabs)/wallet/add'); });
  it('expands a card with normalized monthly commitment and keeps edit navigation', async () => {
    mockCards = [card()]; mockSubscriptions = [subscription()];
    const result = await render(<WalletScreen />);
    await fireEvent.press(result.getByRole('button', { name: 'Open Main card details' }));
    await waitFor(() => expect(result.getByText('₺100.00/mo')).toBeTruthy());
    await fireEvent.press(result.getByText('Edit'));
    expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/(tabs)/wallet/[id]', params: { id: 'card' } });
  });
  it('keeps pin mutation behavior', async () => { mockCards = [card()]; const result = await render(<WalletScreen />); await fireEvent.press(result.getByRole('button', { name: 'Toggle pin' })); expect(mockUpdateCard).toHaveBeenCalledWith({ id: 'card', data: { isPinned: true } }); });
  it('localizes linked subscription metadata and edit action in Turkish', async () => {
    mockLanguage = 'tr'; mockCards = [card()]; mockSubscriptions = [subscription()];
    const result = await render(<WalletScreen />);
    await fireEvent.press(result.getByRole('button', { name: 'Open Main card details' }));
    await waitFor(() => expect(result.getByText('Yıllık • Üretkenlik & Yazılım')).toBeTruthy());
    expect(result.getByText('Düzenle')).toBeTruthy();
    expect(result.queryByText('yearly • Software')).toBeNull();
  });
});
