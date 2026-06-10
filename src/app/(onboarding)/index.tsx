import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
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
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <View className="flex-1 justify-center items-center px-6">
        <View className="mb-12">
          <View className="w-64 h-64 bg-slate-50 dark:bg-slate-800/50 rounded-full items-center justify-center border-4 border-blue-50 dark:border-blue-900/20">
            <Text className="text-8xl">{step === 0 ? '✨' : step === 1 ? '📊' : '🔔'}</Text>
          </View>
        </View>
        
        <Text className="text-3xl font-extrabold text-slate-900 dark:text-white text-center mb-4">
          {SLIDES[step].title}
        </Text>
        <Text className="text-lg text-slate-500 dark:text-slate-400 text-center px-4 leading-relaxed">
          {SLIDES[step].description}
        </Text>
      </View>
      
      <View className="px-6 pb-12 pt-6">
        <View className="flex-row justify-center items-center mb-10 gap-2">
          {SLIDES.map((_, i) => (
            <View 
              key={i} 
              className={`h-2 rounded-full ${i === step ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} 
            />
          ))}
        </View>
        <Button 
          title={step === SLIDES.length - 1 ? "Get Started" : "Next"} 
          onPress={handleNext} 
        />
        <TouchableOpacity 
          className="mt-6 items-center p-2" 
          onPress={() => router.push('/(onboarding)/templates')}
        >
          <Text className="text-slate-500 dark:text-slate-400 font-medium text-base">Skip Intro</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
