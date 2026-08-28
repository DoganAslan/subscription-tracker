import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';
import { HERO_GRADIENT_PRESETS, saveHeroGradient } from '@/utils/heroTheme';
import { triggerHaptic } from '@/utils/haptics';

type HeroThemePickerModalProps = {
  visible: boolean;
  colors: ThemeColors;
  isTurkish: boolean;
  onClose: () => void;
  onSelect: (colors: [string, string, string]) => void;
};

export function HeroThemePickerModal({ visible, colors, isTurkish, onClose, onSelect }: HeroThemePickerModalProps) {
  const selectPreset = async (presetId: string) => {
    triggerHaptic('selection');
    onSelect(await saveHeroGradient(presetId));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="color-palette-outline" size={22} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>{isTurkish ? 'Kart teması seç' : 'Choose card theme'}</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={isTurkish ? 'Kapat' : 'Close'} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            {HERO_GRADIENT_PRESETS.map(preset => (
              <TouchableOpacity
                key={preset.id}
                activeOpacity={0.85}
                onPress={() => { void selectPreset(preset.id); }}
                style={[styles.option, { borderColor: colors.border }]}
              >
                <LinearGradient colors={preset.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
                  <Text style={styles.optionText}>{isTurkish ? preset.nameTr : preset.nameEn}</Text>
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { borderRadius: 20, padding: 20, width: '100%', maxWidth: 360, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  options: { gap: 10 },
  option: { borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  gradient: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
