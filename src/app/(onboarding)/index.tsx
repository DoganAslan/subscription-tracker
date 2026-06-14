import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';

const SLIDES = [
  { title: "Welcome to Subscription Tracker", description: "Take control of your recurring expenses and never pay for a subscription you don't use." },
  { title: "Track all your subscriptions", description: "See everything you pay for in one unified dashboard, organized by category." },
  { title: "Never miss a renewal again", description: "Get timely push notifications before you get charged, saving you money." }
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      setStep(step + 1);
    } else {
      router.push('/(onboarding)/templates');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.emojiContainer}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emojiText}>
              {step === 0 ? '✨' : step === 1 ? '📊' : '🔔'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.title}>
          {SLIDES[step].title}
        </Text>
        <Text style={styles.description}>
          {SLIDES[step].description}
        </Text>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.paginationContainer}>
          {SLIDES.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot,
                i === step ? styles.dotActive : styles.dotInactive
              ]} 
            />
          ))}
        </View>
        <Button 
          title={step === SLIDES.length - 1 ? "Get Started" : "Next"} 
          onPress={handleNext} 
        />
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => router.push('/(onboarding)/templates')}
        >
          <Text style={styles.skipText}>Skip Intro</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emojiContainer: {
    marginBottom: 48,
  },
  emojiCircle: {
    width: 160,
    height: 160,
    backgroundColor: '#1F2937',
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(59, 130, 246, 0.2)', // Subtle blue border
  },
  emojiText: {
    fontSize: 72,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 32,
    backgroundColor: '#3B82F6',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#1F2937',
  },
  skipButton: {
    marginTop: 24,
    alignItems: 'center',
    padding: 8,
  },
  skipText: {
    color: '#9CA3AF',
    fontWeight: '500',
    fontSize: 16,
  },
});
