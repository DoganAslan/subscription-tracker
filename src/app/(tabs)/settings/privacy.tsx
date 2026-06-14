import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { triggerHaptic } from '@/utils/haptics';
import Markdown from 'react-native-markdown-display';
import { useTranslation } from 'react-i18next';

import privacyPoliciesRaw from '@/constants/privacyPolicies.json';

const privacyPolicies: Record<string, string> = privacyPoliciesRaw;
const languages = Object.keys(privacyPolicies);

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const [activeLang, setActiveLang] = useState(languages.includes(currentLang) ? currentLang : 'en');

  const markdownContent = privacyPolicies[activeLang] || privacyPolicies['en'];

  const handleLanguageSelect = (lang: string) => {
    triggerHaptic('light');
    setActiveLang(lang);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 50 : 20) }]}>
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
          <Markdown style={markdownStyles}>
            {markdownContent}
          </Markdown>
        </ScrollView>
      </View>
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
    fontFamily: 'Hanken Grotesk',
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

const markdownStyles = {
  body: {
    color: '#9CA3AF',
    fontFamily: 'Hanken Grotesk',
    fontSize: 15,
    lineHeight: 24,
  },
  heading1: {
    color: '#FFFFFF',
    fontFamily: 'Hanken Grotesk',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 0,
  },
  heading2: {
    color: '#FFFFFF',
    fontFamily: 'Hanken Grotesk',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  strong: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  em: {
    color: '#6B7280',
    fontStyle: 'italic',
    fontSize: 14,
    marginBottom: 24,
    display: 'flex',
  },
  blockquote: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#374151',
    borderLeftWidth: 1,
  },
  link: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
  }
};
