import React from 'react';
import { Dimensions, Platform, StyleSheet } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AiChatModal } from '@/features/ai/components/AiChatModal';
import { chatWithSubmateAi } from '@/services/ai/gemini';

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

  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  });

  beforeEach(() => {
    jest.mocked(chatWithSubmateAi).mockReset();
    jest.mocked(chatWithSubmateAi).mockResolvedValue('Budget answer');
  });

  afterAll(() => {
    if (platformDescriptor) Object.defineProperty(Platform, 'OS', platformDescriptor);
  });

  it('applies current and measured iOS keyboard geometry to the chat shell', async () => {
    const result = await render(<AiChatModal visible onClose={jest.fn()} />);

    expect(result.getByTestId('ai-chat-keyboard-view').props).toEqual(expect.objectContaining({
      behavior: 'padding',
      keyboardVerticalOffset: 111,
    }));
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

    await fireEvent(result.getByTestId('ai-chat-header'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 74 } },
    });

    expect(result.getByTestId('ai-chat-keyboard-view').props.keyboardVerticalOffset).toBe(133);

    await result.unmount();
  });

  it('submits a focused-input quick prompt through its tap-persistent scroll view', async () => {
    const result = await render(<AiChatModal visible onClose={jest.fn()} />);
    const quickPrompt = '💡 Where can I save money this month?';
    const quickPromptScroll = result.root?.queryAll(
      (instance) => instance.type === 'RCTScrollView' && instance.props.horizontal === true,
    )[0];
    if (!quickPromptScroll) throw new Error('Quick-prompt ScrollView was not rendered');

    expect(quickPromptScroll.props.keyboardShouldPersistTaps).toBe('handled');
    await fireEvent(result.getByPlaceholderText('Ask about your subscriptions...'), 'focus');
    await fireEvent.press(result.getByText(quickPrompt));

    await waitFor(() => expect(chatWithSubmateAi).toHaveBeenCalledWith(
      quickPrompt,
      expect.any(Array),
      [],
      'USD',
      false,
    ));

    await result.unmount();
  });
});
