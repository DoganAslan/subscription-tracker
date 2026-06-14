import React, { useState, useRef } from 'react';
import { View, TextInput, Text, Animated, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface HeroInputProps {
  amount: string;
  onChangeAmount: (value: string) => void;
  currency: string;
}

export function HeroInput({ amount, onChangeAmount, currency }: HeroInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const bgColorAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const { colors } = useTheme();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(bgColorAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(bgColorAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const backgroundColor = bgColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.surface]
  });

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <Animated.View style={[dynamicStyles.container, { backgroundColor }]}>
        <View style={dynamicStyles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={dynamicStyles.input}
            value={amount}
            onChangeText={onChangeAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.primary + '80'}
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={8}
            selectionColor={colors.primary}
          />
          <Text style={dynamicStyles.currency}>{currency}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    height: '25%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  input: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
    borderWidth: 0,
    padding: 0,
    margin: 0,
    textAlign: 'center',
    minWidth: 100,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
    marginBottom: Platform.OS === 'ios' ? 8 : 4,
  }
});
