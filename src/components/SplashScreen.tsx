import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export function CustomSplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const { colors } = useTheme();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ]).start(() => {
      // Delay slightly after animation completes for a smooth transition
      setTimeout(() => {
        onAnimationComplete();
      }, 500);
    });
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={dynamicStyles.container}>
      <Animated.Image 
        source={require('../../assets/images/logo.png')} 
        style={[
          dynamicStyles.logo, 
          { 
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: rotate }
            ] 
          }
        ]} 
        resizeMode="cover"
      />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  }
});
