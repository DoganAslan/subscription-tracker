import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { triggerHaptic } from '@/utils/haptics';
import { useTranslation } from '@/context/LanguageContext';
import { SafeMarkdownText } from '@/components/common/SafeMarkdownText';

import { termsPolicies } from '@/constants/legalPolicies';
const languages = Object.keys(termsPolicies);

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentLanguage } = useTranslation();
  const currentLang = currentLanguage || 'en';
  const [activeLang, setActiveLang] = useState(languages.includes(currentLang) ? currentLang : 'en');

  const markdownContent = termsPolicies[activeLang] || termsPolicies['en'];

  const handleLanguageSelect = (lang: string) => {
    triggerHaptic('light');
    setActiveLang(lang);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.switcherContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.switcherContent}
          >
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langPill,
                  activeLang === lang ? styles.activeLangPill : styles.inactiveLangPill
                ]}
                onPress={() => handleLanguageSelect(lang)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.langText,
                  activeLang === lang ? styles.activeLangText : styles.inactiveLangText
                ]}>
                  {lang.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
          showsVerticalScrollIndicator={false}
        >
          <SafeMarkdownText
            text={markdownContent}
            color="#9CA3AF"
            headingColor="#FFFFFF"
            mutedColor="#6B7280"
            variant="document"
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#0B0F19',
    zIndex: 10,
  },
  backButton: {
    padding: 4,
  },
  switcherContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingBottom: 16,
  },
  switcherContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  langPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeLangPill: {
    backgroundColor: '#3B82F6',
  },
  inactiveLangPill: {
    backgroundColor: '#1F2937',
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeLangText: {
    color: '#FFFFFF',
  },
  inactiveLangText: {
    color: '#9CA3AF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  }
});
