import * as Haptics from 'expo-haptics';

export type HapticType =
  | 'success'
  | 'error'
  | 'warning'
  | 'light'
  | 'impactLight'
  | 'impactMedium'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'notificationSuccess'
  | 'notificationWarning';

export const triggerHaptic = (type: HapticType) => {
  switch (type) {
    case 'success':
    case 'notificationSuccess':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'warning':
    case 'notificationWarning':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'light':
    case 'impactLight':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
    case 'impactMedium':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'selection':
      Haptics.selectionAsync();
      break;
  }
};

