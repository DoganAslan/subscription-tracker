import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, FlatList, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useTranslation } from '@/context/LanguageContext';

const SLIDES = [
  {
    id: '1',
    title: 'FINANCIAL COMMAND',
    subtitle: 'Track active subscriptions, renewal dates, and cross-rate currency impacts in one unified dashboard.',
    icon: 'pulse',
    color: '#3B82F6', 
  },
  {
    id: '2',
    title: 'REVIEW UNUSED COSTS',
    subtitle: 'Use your own activity signals to spot subscriptions worth reviewing without misleading labels.',
    icon: 'search',
    color: '#8B5CF6', 
  },
  {
    id: '3',
    title: 'SPLIT & COLLECT',
    subtitle: 'Calculate shared costs automatically. Generate instant WhatsApp debt collection reminders with one tap.',
    icon: 'share-social',
    color: '#10B981', 
  },
];

const TURKISH_SLIDES = [
  {
    id: '1',
    title: 'FİNANSAL KONTROL',
    subtitle: 'Aktif abonelikleri, yenileme tarihlerini ve döviz etkilerini tek panelden takip et.',
    icon: 'pulse',
    color: '#3B82F6',
  },
  {
    id: '2',
    title: 'KULLANIMI DEĞERLENDİR',
    subtitle: 'Kendi kullanım bilgilerinle gözden geçirilmeye değer abonelikleri yanıltıcı etiketler olmadan bul.',
    icon: 'search',
    color: '#8B5CF6',
  },
  {
    id: '3',
    title: 'BÖLÜŞ VE TOPLA',
    subtitle: 'Ortak masrafları otomatik hesapla, WhatsApp ile ödeme hatırlatıcıları gönder.',
    icon: 'share-social',
    color: '#10B981',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef<any>(null);
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const slides = isTurkish ? TURKISH_SLIDES : SLIDES;

  const { completeOnboarding } = useOnboardingStore();
  const isCompact = height < 700 || width < 360;

  useEffect(() => {
    slidesRef.current?.scrollToOffset({
      offset: currentIndex * width,
      animated: false,
    });
  }, [currentIndex, width]);

  const handleLaunchApp = async () => {
    try {
      await AsyncStorage.setItem('@submate_launched_v1', 'true');
      completeOnboarding();
    } catch (e) {}

    if (Platform.OS === 'web') {
      window.location.replace('/');
    } else {
      router.replace('/');
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      
      // 1. STATE'I ZORLA GÜNCELLE: Tarayıcının momentum scroll insiyatifine bırakmıyoruz
      setCurrentIndex(nextIndex);

      // 2. ANIMASYONLU KAYDIRMA: Hem offset hem de index layout güvencesi
      slidesRef.current?.scrollToOffset({
        offset: nextIndex * width,
        animated: true
      });
    } else {
      handleLaunchApp();
    }
  };

  return (
    <View style={styles.container}>
      
      {/* BACKGROUND GLOW */}
      <View
        pointerEvents="none"
        style={[
          styles.glowOrb,
          {
            backgroundColor: slides[currentIndex].color,
            width: width * 1.2,
            height: width * 1.2,
            borderRadius: width * 0.6,
          },
        ]}
      />

      {/* HEADER CONTROLS */}
      <View
        style={[
          styles.header,
          {
            top: Math.max(insets.top + 10, 20),
            paddingLeft: Math.max(insets.left + 20, 24),
            paddingRight: Math.max(insets.right + 20, 24),
          },
        ]}
      >
        <View style={styles.brandContainer}>
          <Ionicons name="hardware-chip" size={20} color="#38BDF8" />
          <Text style={styles.brandText}>SUBMATE v2.0</Text>
        </View>
        <TouchableOpacity onPress={handleLaunchApp} style={styles.interactiveArea}>
          <Text style={styles.skipText}>{isTurkish ? 'GEÇ' : 'SKIP'}</Text>
        </TouchableOpacity>
      </View>

      {/* CAROUSEL BODY */}
      <View style={styles.sliderContainer}>
        <FlatList
          ref={slidesRef}
          data={slides}
          horizontal
          pagingEnabled
          scrollEnabled={Platform.OS !== 'web'} // Web'de mouse ile kaydırmanın çakışmasını önler
          showsHorizontalScrollIndicator={false}
          bounces={false}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(Math.max(0, Math.min(nextIndex, slides.length - 1)));
          }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width, height: height * (isCompact ? 0.6 : 0.65), paddingHorizontal: isCompact ? 24 : 40 }]}>
              <View style={[styles.iconRing, isCompact && styles.iconRingCompact, { borderColor: item.color, shadowColor: item.color }]}>
                <Ionicons name={item.icon as any} size={isCompact ? 48 : 64} color={item.color} />
              </View>
              <Text style={[styles.slideTitle, isCompact && styles.slideTitleCompact]}>{item.title}</Text>
              <Text style={[styles.slideSubtitle, isCompact && styles.slideSubtitleCompact]}>{item.subtitle}</Text>
            </View>
          )}
        />
      </View>

      {/* FOOTER CONTROLS */}
      <View
        style={[
          styles.footer,
          {
            bottom: Math.max(insets.bottom + 12, 20),
            paddingLeft: Math.max(insets.left + 20, 24),
            paddingRight: Math.max(insets.right + 20, 24),
          },
        ]}
      >
        <View style={styles.pagination}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot, 
                { 
                  width: i === currentIndex ? 32 : 8, 
                  opacity: i === currentIndex ? 1 : 0.3, 
                  backgroundColor: slides[currentIndex].color 
                }
              ]}
            />
          ))}
        </View>

        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={handleNext}
          style={[styles.button, { backgroundColor: slides[currentIndex].color }]}
        >
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1
              ? (isTurkish ? 'UYGULAMAYI AÇ 🚀' : 'LAUNCH SYSTEM 🚀')
              : (isTurkish ? 'DEVAM ET' : 'INITIALIZE NEXT')}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712', overflow: 'hidden' },
  glowOrb: {
    position: 'absolute', top: -100, alignSelf: 'center',
    opacity: 0.12, transform: [{ scale: 1.2 }]
  },
  header: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 10,
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { color: '#F8FAFC', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  skipText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  sliderContainer: { flex: 1, justifyContent: 'center' },
  slide: { alignItems: 'center', justifyContent: 'center' },
  iconRing: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: '#0B0F19',
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    marginBottom: 40, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 30
  },
  iconRingCompact: { width: 108, height: 108, borderRadius: 54, marginBottom: 24 },
  slideTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: 1, marginBottom: 16, textAlign: 'center' },
  slideTitleCompact: { fontSize: 23, marginBottom: 10 },
  slideSubtitle: { color: '#94A3B8', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  slideSubtitleCompact: { fontSize: 14, lineHeight: 20 },
  footer: { 
    position: 'absolute', left: 0, right: 0,
    zIndex: 10,
  },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 28 },
  dot: { height: 8, borderRadius: 4, transition: 'all 0.3s ease' } as any,
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: 16, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 15
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  interactiveArea: { padding: 10 }
});
