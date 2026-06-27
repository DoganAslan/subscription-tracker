const fs = require('fs');
const content = \import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingRoute() {
  const router = useRouter();
  
  const handleComplete = async () => {
    await AsyncStorage.setItem('@has_onboarded', 'true');
    router.replace('/(tabs)');
  };

  return <OnboardingScreen onComplete={handleComplete} />;
}

const OnboardingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const { t } = useTranslation();
  const [step, setStep] = React.useState(0);

  const SLIDES = [
    { titleKey: 'onboarding.s1Title', descKey: 'onboarding.s1Desc', accentColor: '#3B82F6', icon: 'wallet-outline' as const },
    { titleKey: 'onboarding.s2Title', descKey: 'onboarding.s2Desc', accentColor: '#F59E0B', icon: 'pulse-outline' as const },
    { titleKey: 'onboarding.s3Title', descKey: 'onboarding.s3Desc', accentColor: '#10B981', icon: 'shield-checkmark-outline' as const }
  ];

  const handleNext = () => {
    if (step < SLIDES.length - 1) setStep(step + 1);
    else onComplete();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 480, paddingHorizontal: 24, paddingVertical: 32, justifyContent: 'space-between' }}>

        {/* Top Bar: Pagination Dots & Skip */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {SLIDES.map((_, i) => (
              <View key={i} style={{ height: 4, borderRadius: 8, width: i === step ? 24 : 8, backgroundColor: i === step ? SLIDES[step].accentColor : '#334155' }} />
            ))}
          </View>
          <TouchableOpacity onPress={onComplete}>
            <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '600' }}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Slide Canvas */}
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: \\\\\\15\\\, borderWidth: 1, borderColor: \\\\\\40\\\, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
            <Ionicons name={SLIDES[step].icon} size={48} color={SLIDES[step].accentColor} />
          </View>

          <Text style={{ color: '#F8FAFC', fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 16 }}>
            {t(SLIDES[step].titleKey)}
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 15, lineHeight: 22, textAlign: 'center' }}>
            {t(SLIDES[step].descKey)}
          </Text>
        </View>

        {/* Bottom CTA Button */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleNext} style={{ width: '100%', height: 54, borderRadius: 12, backgroundColor: SLIDES[step].accentColor, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
            {step === SLIDES.length - 1 ? t('onboarding.start') : t('onboarding.next')}
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};
\;

fs.writeFileSync('src/app/(onboarding)/index.tsx', content, 'utf8');
console.log('Onboarding UI built.');
