import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerHaptic } from '@/utils/haptics';

export default function AboutScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const dynamicStyles = React.useMemo(() => getStyles(colors, isDark, insets), [colors, isDark, insets]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/settings');
    }
  };

  const handlePressItem = () => {
    triggerHaptic('light');
    // Implement navigation or external links here
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Header Bar */}
      <View style={dynamicStyles.headerBar}>
        <TouchableOpacity onPress={handleGoBack} style={dynamicStyles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={28} color={isDark ? '#FFFFFF' : colors.text} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerBarTitle}>{t('settings.about')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView 
        style={dynamicStyles.scrollContainer} 
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Title Section */}
        <View style={dynamicStyles.titleSection}>
          <View style={dynamicStyles.logoContainer}>
            <Image 
              source={require('../../../../assets/images/logo.png')} 
              style={dynamicStyles.logoImage} 
              resizeMode="cover"
            />
          </View>
          <Text style={dynamicStyles.appName}>{t('global.submate')}</Text>
          <Text style={dynamicStyles.appVersion}>{t('global.version100')}</Text>
        </View>

        {/* Action Cards */}
        <View style={dynamicStyles.cardGroup}>
          <TouchableOpacity style={dynamicStyles.cardRow} onPress={handlePressItem} activeOpacity={0.7}>
            <View style={dynamicStyles.rowLeft}>
              <Ionicons name="star-outline" size={22} color={isDark ? '#FFFFFF' : colors.text} />
              <Text style={dynamicStyles.rowText}>{t('global.rateSubmate')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={dynamicStyles.separator} />
          
          <TouchableOpacity style={dynamicStyles.cardRow} onPress={() => router.push('/(tabs)/settings/privacy')} activeOpacity={0.7}>
            <View style={dynamicStyles.rowLeft}>
              <Ionicons name="shield-checkmark-outline" size={22} color={isDark ? '#FFFFFF' : colors.text} />
              <Text style={dynamicStyles.rowText}>{t('global.privacyPolicy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={dynamicStyles.separator} />
          
          <TouchableOpacity style={dynamicStyles.cardRow} onPress={() => router.push('/(tabs)/settings/terms')} activeOpacity={0.7}>
            <View style={dynamicStyles.rowLeft}>
              <Ionicons name="document-text-outline" size={22} color={isDark ? '#FFFFFF' : colors.text} />
              <Text style={dynamicStyles.rowText}>{t('global.termsOfService')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Signature Footer */}
        <View style={dynamicStyles.footer}>
          <Text style={dynamicStyles.signatureText}>{t('global.createdByDoanAslan')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0B0F19' : colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 50 : 20),
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1F2937' : colors.border,
    backgroundColor: isDark ? '#0B0F19' : colors.surface,
    zIndex: 10,
  },
  backButton: {
    padding: 4,
  },
  headerBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#FFFFFF' : colors.text,
    fontFamily: 'Hanken Grotesk',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: insets.bottom + 40,
    flexGrow: 1,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 22,
    backgroundColor: '#1F2937', // Elegant placeholder backing
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: isDark ? '#FFFFFF' : colors.text,
    fontFamily: 'Hanken Grotesk',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 15,
    color: isDark ? '#9CA3AF' : colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 1,
  },
  cardGroup: {
    backgroundColor: isDark ? '#1F2937' : colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
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
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
    color: isDark ? '#FFFFFF' : colors.text,
    marginLeft: 14,
    fontFamily: 'Hanken Grotesk',
  },
  separator: {
    height: 1,
    backgroundColor: isDark ? '#374151' : colors.border,
    marginLeft: 52, // Aligns exactly with the start of the text
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 60,
  },
  signatureText: {
    fontSize: 15,
    fontWeight: '500',
    color: isDark ? '#9CA3AF' : colors.textSecondary,
    fontFamily: 'Hanken Grotesk',
    letterSpacing: 0.5,
  }
});
