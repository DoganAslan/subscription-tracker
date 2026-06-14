import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { triggerHaptic } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    titleKey: 'onboarding.takeControl',
    descKey: 'onboarding.takeControlDesc',
    icon: 'list-circle-outline' as const,
  },
  {
    id: '2',
    titleKey: 'onboarding.smartInsights',
    descKey: 'onboarding.smartInsightsDesc',
    icon: 'pie-chart-outline' as const,
  },
  {
    id: '3',
    titleKey: 'onboarding.alwaysUpdated',
    descKey: 'onboarding.alwaysUpdatedDesc',
    icon: 'grid-outline' as const,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const completeOnboarding = useOnboardingStore(state => state.completeOnboarding);

  const handleNext = async () => {
    triggerHaptic('medium');
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
      triggerHaptic('heavy');
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    triggerHaptic('medium');
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <TouchableOpacity style={dynamicStyles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
        <Text style={dynamicStyles.skipText}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          if (index !== currentIndex) {
            setCurrentIndex(index);
            triggerHaptic('light');
          }
        }}
        renderItem={({ item }) => (
          <View style={dynamicStyles.slide}>
            <View style={dynamicStyles.iconContainer}>
              <Ionicons name={item.icon} size={140} color={colors.primary} />
            </View>
            <View style={dynamicStyles.textContainer}>
              <Text style={dynamicStyles.title}>{t(item.titleKey)}</Text>
              <Text style={dynamicStyles.description}>{t(item.descKey)}</Text>
            </View>
          </View>
        )}
      />

      <View style={dynamicStyles.footer}>
        <View style={dynamicStyles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                dynamicStyles.dot,
                currentIndex === index && dynamicStyles.activeDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={dynamicStyles.button} onPress={handleNext} activeOpacity={0.8}>
          <Text style={dynamicStyles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? t('onboarding.getStarted') : t('onboarding.next')}
          </Text>
          <Ionicons 
            name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'} 
            size={20} 
            color={colors.background} 
            style={dynamicStyles.buttonIcon} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Match dark theme
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
