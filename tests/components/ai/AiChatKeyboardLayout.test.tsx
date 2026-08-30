import React from 'react';
import { Dimensions, Platform, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { AiChatModal } from '@/features/ai/components/AiChatModal';
import * as keyboardLayout from '@/components/layout/keyboardLayout';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, style }: {
    children: React.ReactNode;
    style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
  }) => {
    const ReactModule = require('react') as typeof import('react');
    const { View } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(View, { style }, children);
  },
  useSafeAreaInsets: () => ({ top: 59, right: 0, bottom: 34, left: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#0F172A',
      surface: '#1E293B',
      border: '#334155',
      primary: '#6366F1',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
    },
  }),
}));

jest.mock('@/context/LanguageContext', () => ({
  useTranslation: () => ({ currentLanguage: 'en' }),
}));

jest.mock('@/features/subscriptions/hooks/useSubscriptions', () => ({
  useSubscriptions: () => ({ data: [] }),
}));

jest.mock('@/store/useCurrencyStore', () => ({
  useCurrencyStore: (selector: (state: { baseCurrency: string }) => unknown) => (
    selector({ baseCurrency: 'USD' })
  ),
}));

jest.mock('@/services/ai/gemini', () => ({ chatWithSubmateAi: jest.fn() }));
jest.mock('@/utils/haptics', () => ({ triggerHaptic: jest.fn() }));
jest.mock('@/components/common/SafeMarkdownText', () => ({
  SafeMarkdownText: ({ text }: { text: string }) => {
    const ReactModule = require('react') as typeof import('react');
    const { Text } = require('react-native') as typeof import('react-native');
    return ReactModule.createElement(Text, null, text);
  },
}));

describe('AI chat iOS keyboard layout', () => {
  const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
  const keyboardLayoutSpy = jest.spyOn(keyboardLayout, 'getKeyboardLayout');

  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  });

  afterAll(() => {
    keyboardLayoutSpy.mockRestore();
    if (platformDescriptor) Object.defineProperty(Platform, 'OS', platformDescriptor);
  });

  it('keeps chat scrolling and input controls inside current safe-area keyboard geometry', async () => {
    const result = await render(<AiChatModal visible onClose={jest.fn()} />);

    expect(keyboardLayoutSpy).toHaveBeenCalledWith('ios', 59, 52);
    expect(StyleSheet.flatten(result.getByTestId('ai-chat-keyboard-view').props.style)).toEqual(
      expect.objectContaining({
        maxHeight: Math.max(Dimensions.get('window').height - 59 - 34, 0),
      }),
    );
    expect(result.getByTestId('ai-chat-scroll').props.keyboardShouldPersistTaps).toBe('handled');
    expect(StyleSheet.flatten(result.getByTestId('ai-chat-input-bar').props.style)).toEqual(
      expect.objectContaining({ paddingBottom: 40 }),
    );
    expect(result.getByPlaceholderText('Ask about your subscriptions...')).toBeTruthy();

    await result.unmount();
  });
});
