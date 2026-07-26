import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { useTranslation } from '../../context/LanguageContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LanguagePickerScreen() {
  const { currentLanguage, changeLanguage, t } = useTranslation();

  // The 20 fully-supported global language matrix codes
  const languageList = [
    { code: 'en', name: 'English' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'pl', name: 'Polski' },
    { code: 'ru', name: 'Русский' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '简体中文' },
    { code: 'ko', name: '한국어' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'sv', name: 'Svenska' },
    { code: 'no', name: 'Norsk' },
    { code: 'da', name: 'Dansk' },
    { code: 'fi', name: 'Suomi' },
    { code: 'el', name: 'Ελληνικά' }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.settingsPage?.language || 'Language'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {languageList.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.langRow, currentLanguage === lang.code && styles.activeRow]}
            onPress={async () => {
              await changeLanguage(lang.code);
              router.back();
            }}
          >
            <Text style={[styles.langText, currentLanguage === lang.code && styles.activeText]}>
              {lang.name}
            </Text>
            {currentLanguage === lang.code && (
              <Ionicons name="checkmark" size={20} color="#3B82F6" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#030712' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#1E293B' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scrollContainer: { padding: 16 },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8, backgroundColor: '#0F172A' },
  activeRow: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 1, borderColor: '#3B82F6' },
  langText: { color: '#94A3B8', fontSize: 16, fontWeight: '500' },
  activeText: { color: '#FFF', fontWeight: 'bold' }
});



