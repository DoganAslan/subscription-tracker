import React from 'react';
import { StyleSheet, Animated, Pressable, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/utils/haptics';
import { useTheme } from '@/context/ThemeContext';

interface FABProps {
  onPress: () => void;
  style?: object;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingActionButton({ onPress, style }: FABProps) {
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const { colors } = useTheme();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 12,
      speed: 20,
    }).start();
  };

  const handlePress = () => {
    triggerHaptic('light');
    onPress();
  };

  return (
    <AnimatedPressable 
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[dynamicStyles.fab, style, { transform: [{ scale: scaleValue }] }]}
    >
      <Ionicons name="add" size={32} color="#FFFFFF" />
    </AnimatedPressable>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.4)' as any
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
      }
    }),
    zIndex: 999,
  }
});
