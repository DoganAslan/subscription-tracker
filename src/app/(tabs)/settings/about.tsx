import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';

export default function AboutScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const handleGoBack = () => {
    triggerHaptic('light');
    router.replace('/(tabs)/settings');
  };

  const handlePressItem = () => {
    triggerHaptic('light');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerBarTitle, { color: colors.text }]}>{t.settings?.about || 'SubMate Hakkında'}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Title Section */}
        <View style={styles.titleSection}>
          <View style={[styles.logoContainer, { backgroundColor: 'rgba(59, 130, 246, 0.12)', borderColor: colors.border }]}>
            <Image 
              source={require('../../../../assets/images/logo.png')} 
              style={styles.logoImage} 
              resizeMode="cover"
            />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>SubMate Pro</Text>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>v1.0.0 (Build 2026)</Text>
          <Text style={[styles.appDesc, { color: colors.textSecondary }]}>
            Your ultimate privacy-first subscription tracker & financial shield.
          </Text>
        </View>

        {/* Action Cards Group */}
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.cardRow} onPress={handlePressItem} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Ionicons name="star-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.rowText, { color: colors.text }]}>{t.global?.rateSubmate || 'SubMate\'i Değerlendirin'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity style={styles.cardRow} onPress={() => router.push('/(tabs)/settings/privacy')} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
              </View>
              <Text style={[styles.rowText, { color: colors.text }]}>{t.global?.privacyPolicy || 'Gizlilik Politikası'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity style={styles.cardRow} onPress={() => router.push('/(tabs)/settings/terms')} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                <Ionicons name="document-text-outline" size={18} color="#6366F1" />
              </View>
              <Text style={[styles.rowText, { color: colors.text }]}>{t.global?.termsOfService || 'Kullanım Koşulları'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Signature Footer */}
        <View style={styles.footer}>
          <Text style={[styles.signatureText, { color: colors.textSecondary }]}>
            Crafted with ❤️ by <Text style={{ color: colors.text, fontWeight: '800' }}>Doğan Aslan</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerBarTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 140,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    padding: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  appDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
  },
  cardGroup: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 32,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    fontSize: 14,
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  signatureText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

