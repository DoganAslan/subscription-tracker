import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';

const SUPPORT_EMAIL = 'doganaslandevelopment@gmail.com';

export default function AboutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const copy = t.aboutPage;
  const version = Constants.expoConfig?.version ?? '1.5.0';

  const goBack = () => {
    triggerHaptic('light');
    router.replace('/(tabs)/settings');
  };

  const openFeedback = () => {
    triggerHaptic('light');
    const subject = currentLanguage === 'tr' ? 'SubMate Geri Bildirim' : 'SubMate Feedback';
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.7} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerBarTitle, { color: colors.text }]}>{t.settings.about}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <Ionicons name="sparkles" size={28} color="#A78BFA" />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>SubMate</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>{copy.tagline}</Text>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>{copy.version.replace('{{version}}', version)}</Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="wallet-outline" size={21} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{copy.trackingDescription}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.contact}</Text>
        <TouchableOpacity
          style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={openFeedback}
          activeOpacity={0.7}
          accessibilityLabel={SUPPORT_EMAIL}
        >
          <View style={[styles.menuIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.14)' }]}>
            <Ionicons name="mail-outline" size={19} color="#A78BFA" />
          </View>
          <View style={styles.contactCopy}>
            <Text numberOfLines={2} style={[styles.rowText, { color: colors.text }]}>{copy.contactDescription}</Text>
            <Text numberOfLines={1} style={[styles.emailText, { color: colors.primary }]}>{SUPPORT_EMAIL}</Text>
          </View>
          <Ionicons name="open-outline" size={17} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.supportAndLegal}</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(tabs)/settings/privacy')} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
              </View>
              <Text numberOfLines={2} style={[styles.rowText, { color: colors.text }]}>{copy.privacyPolicy}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(tabs)/settings/terms')} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                <Ionicons name="document-text-outline" size={18} color="#6366F1" />
              </View>
              <Text numberOfLines={2} style={[styles.rowText, { color: colors.text }]}>{copy.terms}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.footer, { color: colors.textSecondary }]}>{copy.madeBy}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  headerBarTitle: { fontSize: 18, fontWeight: '800' },
  headerSpacer: { width: 28 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 56 },
  hero: { alignItems: 'center', marginBottom: 26 },
  logoContainer: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(139, 92, 246, 0.14)', marginBottom: 12 },
  appName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.4, marginBottom: 6 },
  versionText: { fontSize: 12, fontWeight: '600', marginTop: 10 },
  tagline: { fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 300 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 9, marginTop: 4 },
  cardGroup: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 22 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 22 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 65 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, marginRight: 10 },
  menuIconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowText: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  contactCard: { minHeight: 76, borderRadius: 16, borderWidth: 1, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  contactCopy: { flex: 1, minWidth: 0, gap: 4 },
  emailText: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  footer: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 6 },
});
