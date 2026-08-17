import { useMemo, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/context/LanguageContext';

type Slide = {
  icon: keyof typeof Ionicons.glyphMap;
  accent: readonly [string, string];
  title: string;
  description: string;
  eyebrow: string;
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  const slides = useMemo<Slide[]>(() => (
    isTurkish
      ? [
          {
            icon: 'layers-outline',
            accent: ['#7C3AED', '#4F46E5'],
            eyebrow: 'TEK BAKIŞTA KONTROL',
            title: 'Aboneliklerin tek yerde.',
            description: 'Düzenli ödemelerini, bağlı kartlarını ve yenilenme tarihlerini sade bir listede gör.',
          },
          {
            icon: 'calendar-clear-outline',
            accent: ['#2563EB', '#06B6D4'],
            eyebrow: 'SÜRPRİZ ÖDEME YOK',
            title: 'Sıradaki ödemeyi önceden bil.',
            description: 'Takvim ve hatırlatmalarla yaklaşan yenilemeleri takip et; bütçeni önceden planla.',
          },
          {
            icon: 'sparkles-outline',
            accent: ['#9333EA', '#EC4899'],
            eyebrow: 'SUBMATE YZ',
            title: 'Daha net kararlar al.',
            description: 'Aboneliklerini ve harcama düzenini sor; tasarruf fırsatlarını anlaşılır önerilerle keşfet.',
          },
        ]
      : [
          {
            icon: 'layers-outline',
            accent: ['#7C3AED', '#4F46E5'],
            eyebrow: 'CONTROL AT A GLANCE',
            title: 'All your subscriptions, together.',
            description: 'See recurring payments, linked cards, and renewal dates in one calm, clear list.',
          },
          {
            icon: 'calendar-clear-outline',
            accent: ['#2563EB', '#06B6D4'],
            eyebrow: 'NO SURPRISE CHARGES',
            title: 'Know what is due next.',
            description: 'Use your calendar and reminders to plan for renewals before they reach your account.',
          },
          {
            icon: 'sparkles-outline',
            accent: ['#9333EA', '#EC4899'],
            eyebrow: 'SUBMATE AI',
            title: 'Make clearer money decisions.',
            description: 'Ask about subscriptions and spending, then find savings opportunities with plain-language guidance.',
          },
        ]
  ), [isTurkish]);

  const currentSlide = slides[step];
  const isFinalStep = step === slides.length - 1;

  const continueOnboarding = () => {
    if (isFinalStep) {
      router.push('/(onboarding)/templates');
      return;
    }
    setStep((current) => current + 1);
  };

  return (
    <LinearGradient colors={['#080B18', '#111735', '#0B1020']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <View style={styles.brandMark}>
            <Ionicons name="sparkles" size={16} color="#C4B5FD" />
            <Text style={styles.brandText}>SUBMATE</Text>
          </View>
          {!isFinalStep && (
            <TouchableOpacity onPress={() => router.push('/(onboarding)/templates')} hitSlop={10}>
              <Text style={styles.skipText}>{isTurkish ? 'Atla' : 'Skip'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <LinearGradient colors={currentSlide.accent} style={styles.iconFrame}>
            <View style={styles.iconInner}>
              <Ionicons name={currentSlide.icon} size={48} color="#FFFFFF" />
            </View>
          </LinearGradient>

          <Text style={styles.eyebrow}>{currentSlide.eyebrow}</Text>
          <Text style={styles.title}>{currentSlide.title}</Text>
          <Text style={styles.description}>{currentSlide.description}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {slides.map((slide, index) => (
              <View key={slide.title} style={[styles.dot, index === step && styles.dotActive]} />
            ))}
          </View>
          <Button
            title={isFinalStep ? (isTurkish ? 'Başlayalım' : 'Get started') : (isTurkish ? 'Devam et' : 'Continue')}
            onPress={continueOnboarding}
            style={styles.button}
          />
          <Text style={styles.footerHint}>
            {isTurkish ? 'Dilediğin zaman ayarlardan düzenleyebilirsin.' : 'You can adjust these choices anytime in Settings.'}
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 24 },
  topBar: {
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandMark: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandText: { color: '#E9E7FF', fontSize: 12, fontWeight: '800', letterSpacing: 1.8 },
  skipText: { color: '#A5B4D6', fontSize: 14, fontWeight: '700', paddingVertical: 8 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  iconFrame: {
    width: 132,
    height: 132,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 38,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.36,
    shadowRadius: 24,
    elevation: 10,
  },
  iconInner: {
    width: 106,
    height: 106,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 11, 24, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  eyebrow: { color: '#C4B5FD', fontSize: 11, fontWeight: '800', letterSpacing: 1.7, marginBottom: 14 },
  title: { color: '#F8FAFC', fontSize: 32, lineHeight: 39, fontWeight: '800', textAlign: 'center', letterSpacing: -0.7 },
  description: { color: '#AEB9D2', fontSize: 16, lineHeight: 25, textAlign: 'center', marginTop: 18, maxWidth: 330 },
  footer: { paddingBottom: 30 },
  pagination: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#33415F' },
  dotActive: { width: 30, backgroundColor: '#A78BFA' },
  button: { borderRadius: 16, paddingVertical: 15 },
  footerHint: { color: '#71809E', fontSize: 12, textAlign: 'center', marginTop: 16 },
});
