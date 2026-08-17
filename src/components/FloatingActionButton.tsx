import React from 'react';
import { StyleSheet, Animated, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/utils/haptics';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FABProps {
  onPress: () => void;
  style?: object;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  label?: string;
  color?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingActionButton({ onPress, style, icon = 'add', label, color }: FABProps) {
  const insets = useSafeAreaInsets();
  const fabBottom = Math.max(insets.bottom + 84, 90);
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
      style={[
        dynamicStyles.fab,
        label && dynamicStyles.fabWithLabel,
        { bottom: fabBottom, backgroundColor: color || colors.primary },
        style,
        { transform: [{ scale: scaleValue }] },
      ]}
    >
      <Ionicons name={icon} size={label ? 20 : 32} color="#FFFFFF" />
      {label ? <Animated.Text style={dynamicStyles.label}>{label}</Animated.Text> : null}
    </AnimatedPressable>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  fab: {
    position: 'absolute',
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
  },
  fabWithLabel: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 60,
    paddingHorizontal: 18,
    width: 'auto',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
