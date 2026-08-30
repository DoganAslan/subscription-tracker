import { getKeyboardLayout } from '@/components/layout/keyboardLayout';

describe('getKeyboardLayout', () => {
  it('uses padding and the safe header offset on iOS', () => {
    expect(getKeyboardLayout('ios', 59, 52)).toEqual({
      behavior: 'padding',
      keyboardVerticalOffset: 111,
    });
  });

  it('uses height without a synthetic offset on Android', () => {
    expect(getKeyboardLayout('android', 24, 52)).toEqual({
      behavior: 'height',
      keyboardVerticalOffset: 0,
    });
  });

  it('uses height without a synthetic offset on web', () => {
    expect(getKeyboardLayout('web', 0, 52)).toEqual({
      behavior: 'height',
      keyboardVerticalOffset: 0,
    });
  });
});
