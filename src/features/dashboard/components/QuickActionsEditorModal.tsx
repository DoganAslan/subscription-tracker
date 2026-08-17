import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { ALL_QUICK_ACTIONS, QuickActionItem, saveQuickActionIds } from '../services/quickActionsStore';
import { triggerHaptic } from '@/utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentActions: QuickActionItem[];
  onSave: (updatedActions: QuickActionItem[]) => void;
}

export function QuickActionsEditorModal({ visible, onClose, currentActions, onSave }: Props) {
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  const [actions, setActions] = useState<QuickActionItem[]>([]);

  useEffect(() => {
    if (visible) {
      setActions(currentActions.length > 0 ? currentActions : ALL_QUICK_ACTIONS);
    }
  }, [visible, currentActions]);

  const toggleAction = (id: string) => {
    triggerHaptic('selection');
    setActions(prev =>
      prev.map(item => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleSave = async () => {
    triggerHaptic('impactLight');
    const enabledIds = actions.filter(a => a.enabled).map(a => a.id);
    await saveQuickActionIds(enabledIds);
    onSave(actions);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="options-outline" size={20} color="#3B82F6" />
              <Text style={[styles.title, { color: colors.text }]}>
                {isTurkish ? 'Hızlı Eylemleri Düzenle' : 'Customize Quick Actions'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
            {isTurkish
              ? 'Ana ekranda görmek istediğiniz hızlı erişim butonlarını seçin ve sıralayın.'
              : 'Select which quick access buttons to feature on your home dashboard.'}
          </Text>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 10, paddingVertical: 6 }}>
              {actions.map(item => {
                const title = isTurkish ? item.titleTr : item.titleEn;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.actionRow,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[styles.iconBox, { backgroundColor: item.badgeColorBg }]}>
                        <Ionicons name={item.icon as any} size={18} color={item.color} />
                      </View>
                      <Text style={[styles.actionText, { color: colors.text }]}>{title}</Text>
                    </View>

                    <Switch
                      value={item.enabled}
                      onValueChange={() => toggleAction(item.id)}
                      trackColor={{ false: '#334155', true: '#3B82F6' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>{isTurkish ? 'Değişiklikleri Kaydet' : 'Save Configuration'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
