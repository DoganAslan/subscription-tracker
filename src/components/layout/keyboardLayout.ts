import type { KeyboardAvoidingViewProps } from 'react-native';

export const getKeyboardLayout = (
  platform: 'ios' | 'android' | 'web',
  topInset: number,
  headerHeight: number,
): Pick<KeyboardAvoidingViewProps, 'behavior' | 'keyboardVerticalOffset'> => ({
  behavior: platform === 'ios' ? 'padding' : 'height',
  keyboardVerticalOffset: platform === 'ios' ? topInset + headerHeight : 0,
});
