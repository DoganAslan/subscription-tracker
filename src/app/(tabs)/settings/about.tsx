import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';

const SUPPORT_EMAIL = 'doganaslan.dev@gmail.com';

export default function AboutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const copy = t.aboutPage;
  const version = Constants.expoConfig?.version ?? '1.5.0';

  const goBack = () => {
    triggerHaptic('light');
    router.replace('/(tabs)/settings');
  };

  const openFeedback = () => {
    triggerHaptic('light');
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=SubMate%20Geri%20Bildirim`);
  };

  const features = [
    { icon: 'repeat-outline' as const, color: '#3B82F6', title: copy.trackingTitle, description: copy.trackingDescription },
    { icon: 'notifications-outline' as const, color: '#F59E0B', title: copy.remindersTitle, description: copy.remindersDescription },
    { icon: 'sparkles-outline' as const, color: '#8B5CF6', title: copy.aiTitle, description: copy.aiDescription },
  ];

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
          <View style={[styles.logoContainer, { backgroundColor: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.28)' }]}>
            <Image source={require('../../../../assets/images/logo.png')} style={styles.logoImage} resizeMode="cover" />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>SubMate</Text>
          <View style={[styles.versionBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>{copy.version.replace('{{version}}', version)}</Text>
          </View>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>{copy.tagline}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.whatItDoes}</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {features.map((feature, index) => (
            <View key={feature.title}>
              {index > 0 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}1F` }]}>
                  <Ionicons name={feature.icon} size={19} color={feature.color} />
                </View>
                <View style={styles.featureCopy}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{feature.description}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.privacyCard, { backgroundColor: 'rgba(16, 185, 129, 0.10)', borderColor: 'rgba(16, 185, 129, 0.24)' }]}>
          <View style={styles.privacyHeading}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
            <Text style={[styles.privacyTitle, { color: colors.text }]}>{copy.privacyTitle}</Text>
          </View>
          <Text style={[styles.privacyDescription, { color: colors.textSecondary }]}>{copy.privacyDescription}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.supportAndLegal}</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(tabs)/settings/privacy')} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
              </View>
              <Text style={[styles.rowText, { color: colors.text }]}>{copy.privacyPolicy}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(tabs)/settings/terms')} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                <Ionicons name="document-text-outline" size={18} color="#6366F1" />
              </View>
              <Text style={[styles.rowText, { color: colors.text }]}>{copy.terms}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.linkRow} onPress={openFeedback} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
                <Ionicons name="mail-outline" size={18} color="#EC4899" />
              </View>
              <View>
                <Text style={[styles.rowText, { color: colors.text }]}>{copy.contact}</Text>
                <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>{copy.contactDescription}</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={17} color={colors.textSecondary} />
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 56 },
  hero: { alignItems: 'center', marginBottom: 30 },
  logoContainer: { width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, padding: 4, marginBottom: 14 },
  logoImage: { width: '100%', height: '100%', borderRadius: 19 },
  appName: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
  versionBadge: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12 },
  versionText: { fontSize: 12, fontWeight: '700' },
  tagline: { fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 300 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10, marginTop: 8 },
  cardGroup: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 15 },
  featureIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureCopy: { flex: 1, gap: 3 },
  featureTitle: { fontSize: 14, fontWeight: '800' },
  featureDescription: { fontSize: 12, lineHeight: 17 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 65 },
  privacyCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 22, gap: 8 },
  privacyHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  privacyTitle: { fontSize: 14, fontWeight: '800' },
  privacyDescription: { fontSize: 12, lineHeight: 18 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  menuIconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowText: { fontSize: 14, fontWeight: '700' },
  rowDescription: { fontSize: 11, marginTop: 2 },
  footer: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 6 },
});
