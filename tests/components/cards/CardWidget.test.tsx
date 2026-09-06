import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { CardWidget } from '@/features/cards/components/CardWidget';
import type { Card, Subscription } from '@/services/firebase/types';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null, FontAwesome: () => null }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => {
    const ReactModule = require('react') as typeof import('react');
    const { View } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(View, null, children);
  },
}));
jest.mock('@/context/LanguageContext', () => ({
  useTranslation: () => ({ currentLanguage: 'tr', t: { global: { exp: 'SON KULLANMA' } } }),
}));

const timestamp = (date: Date) => ({ toDate: () => date, toMillis: () => date.getTime() }) as Card['createdAt'];
const card: Card = { id: 'card', userId: 'user', name: 'Ana kart', type: 'visa', expiryMonth: 12, expiryYear: 2030, monthlyLimit: 1000, color: '#1E3A8A', currency: 'TRY', createdAt: timestamp(new Date()), updatedAt: timestamp(new Date()) };
const subscription: Subscription = { id: 'sub', name: 'Netflix', category: 'Entertainment', amount: 100, currency: 'TRY', billingCycle: 'monthly', renewalDate: timestamp(new Date()), cardId: 'card', notes: null, createdAt: timestamp(new Date()), updatedAt: timestamp(new Date()) };

describe('CardWidget localization', () => {
  it('renders linked-subscription and limit status without English leakage in Turkish', async () => {
    const result = await render(<CardWidget card={card} subscriptions={[subscription]} />);
    expect(result.getByText('1 bağlı abonelik')).toBeTruthy();
    expect(result.queryByText('1 Linked Sub')).toBeNull();
  });
});
