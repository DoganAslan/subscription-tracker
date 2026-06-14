import * as Haptics from 'expo-haptics';

export const triggerHaptic = (type: 'success' | 'error' | 'light' | 'selection') => {
  switch (type) {
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'light':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'selection':
      Haptics.selectionAsync();
      break;
  }
};
