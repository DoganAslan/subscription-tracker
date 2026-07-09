import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, StyleSheet, Platform, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { t } from '@/locales/i18n';

const { width, height } = Dimensions.get('window');

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
    title: 'HUNT ZOMBIE SUBS',
    subtitle: 'Detect forgotten free trials and passive money drains. Deep-link directly to official cancellation portals.',
    icon: 'skull',
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

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<any>(null);

  const { completeOnboarding } = useOnboardingStore();

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
    if (currentIndex < SLIDES.length - 1) {
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
      <View pointerEvents="none" style={[styles.glowOrb, { backgroundColor: SLIDES[currentIndex].color }]} />

      {/* HEADER CONTROLS */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Ionicons name="hardware-chip" size={20} color="#38BDF8" />
          <Text style={styles.brandText}>SUBMATE v2.0</Text>
        </View>
        <TouchableOpacity onPress={handleLaunchApp} style={styles.interactiveArea}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* CAROUSEL BODY */}
      <View style={styles.sliderContainer}>
        <FlatList
          ref={slidesRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          scrollEnabled={Platform.OS !== 'web'} // Web'de mouse ile kaydırmanın çakışmasını önler
          showsHorizontalScrollIndicator={false}
          bounces={false}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={[styles.iconRing, { borderColor: item.color, shadowColor: item.color }]}>
                <Ionicons name={item.icon as any} size={64} color={item.color} />
              </View>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          )}
        />
      </View>

      {/* FOOTER CONTROLS */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot, 
                { 
                  width: i === currentIndex ? 32 : 8, 
                  opacity: i === currentIndex ? 1 : 0.3, 
                  backgroundColor: SLIDES[currentIndex].color 
                }
              ]}
            />
          ))}
        </View>

        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={handleNext}
          style={[styles.button, { backgroundColor: SLIDES[currentIndex].color }]}
        >
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'LAUNCH SYSTEM 🚀' : 'INITIALIZE NEXT'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  glowOrb: {
    position: 'absolute', top: -100, alignSelf: 'center',
    width: width * 1.2, height: width * 1.2, borderRadius: width * 0.6,
    opacity: 0.12, transform: [{ scale: 1.2 }]
  },
  header: {
    position: 'absolute', top: 40, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, zIndex: 999999 
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { color: '#F8FAFC', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  skipText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  sliderContainer: { flex: 1, justifyContent: 'center' },
  slide: { width, height: height * 0.65, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconRing: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: '#0B0F19',
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    marginBottom: 40, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 30
  },
  slideTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: 1, marginBottom: 16, textAlign: 'center' },
  slideSubtitle: { color: '#94A3B8', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  footer: { 
    position: 'absolute', bottom: 40, left: 0, right: 0,
    paddingHorizontal: 24, zIndex: 999999 
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


