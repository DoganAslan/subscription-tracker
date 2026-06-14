import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { triggerHaptic } from '@/utils/haptics';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

export function EmptyState() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  const handlePress = () => {
    triggerHaptic('heavy');
    router.push('/(tabs)/subscriptions/add');
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Watermark Logo */}
      <Image 
        source={require('../../assets/images/logo.png')} 
        style={dynamicStyles.watermark} 
        resizeMode="contain"
      />
      
      <Text style={dynamicStyles.title}>{t('home.yourListIsEmpty')}</Text>
      
      <Text style={dynamicStyles.subtext}>
        {t('home.addFirstSub')}
      </Text>

      <TouchableOpacity 
        style={dynamicStyles.button} 
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={dynamicStyles.buttonText}>{t('home.addSubscription')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.background,
    minHeight: 400,
  },
  watermark: {
    width: 120,
    height: 120,
    tintColor: colors.border,
    opacity: 0.8,
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});
