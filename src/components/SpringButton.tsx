import React from 'react';
import { Animated, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { triggerHaptic } from '@/utils/haptics';

interface SpringButtonProps extends TouchableOpacityProps {
  scaleTo?: number;
  haptic?: 'light' | 'selection' | 'medium';
  children: React.ReactNode;
}

export function SpringButton({
  scaleTo = 0.95,
  haptic = 'selection',
  children,
  onPress,
  style,
  ...props
}: SpringButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scaleTo,
      tension: 320,
      friction: 18,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 320,
      friction: 14,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={(e) => {
          if (haptic === 'light') triggerHaptic('impactLight');
          else if (haptic === 'medium') triggerHaptic('medium');
          else triggerHaptic('selection');
          if (onPress) onPress(e);
        }}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
