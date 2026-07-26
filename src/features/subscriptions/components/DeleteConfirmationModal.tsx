import i18n, { t } from '@/locales/i18n';
import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCancelUrl } from '@/utils/cancelLinksDb';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  visible: boolean;
  onConfirm: (didSaveMoney?: boolean) => void;
  onCancel: () => void;
  isLoading?: boolean;
  subscriptionName?: string;
}

export function DeleteConfirmationModal({ visible, onConfirm, onCancel, isLoading, subscriptionName }: Props) {
  const { colors, isDark } = useTheme();

  const handleOpenCancelUrl = () => {
    const url = getCancelUrl(subscriptionName);
    Linking.openURL(url).catch((err) => console.error('An error occurred', err));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ 
          backgroundColor: isDark ? '#1E293B' : '#ffffff', 
          borderRadius: 20, 
          padding: 24, 
          width: '100%', 
          maxWidth: 360, 
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: 4 }, 
          shadowOpacity: 0.3, 
          shadowRadius: 8, 
          elevation: 8 
        }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
            {t.global?.deleteSubscription || 'Delete Subscription?'}
          </Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 18, lineHeight: 22, fontSize: 14 }}>
            {t.features?.deleteDoesNotCancel || "Deleting this subscription from SubMate does not cancel your actual subscription."}
          </Text>

          <TouchableOpacity 
            onPress={handleOpenCancelUrl}
            activeOpacity={0.8}
            style={{ 
              backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF', 
              paddingVertical: 12, 
              paddingHorizontal: 16, 
              borderRadius: 12, 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(37, 99, 235, 0.35)' : '#BFDBFE',
              marginBottom: 20
            }}
          >
            <Ionicons name="link-outline" size={20} color={isDark ? '#60A5FA' : '#2563EB'} style={{ marginRight: 8 }} />
            <Text style={{ color: isDark ? '#60A5FA' : '#2563EB', fontWeight: '600', fontSize: 15 }}>
              {t.features?.goToCancelPage || 'Go to Cancel Page'}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'column', gap: 10 }}>
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              onPress={() => onConfirm(true)}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? <ActivityIndicator color="#ffffff" /> : (
                <>
                  <Ionicons name="cash-outline" size={20} color="#FFF" />
                  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>
                    {t.features?.cancelledToSave || 'I cancelled this to save money!'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: '#EF4444', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
              onPress={() => onConfirm(false)}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>
                {t.features?.justDelete || 'Just delete from app'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ 
                flex: 1, 
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9', 
                paddingVertical: 12, 
                borderRadius: 12, 
                alignItems: 'center',
                borderWidth: isDark ? 1 : 0,
                borderColor: 'rgba(255,255,255,0.1)'
              }}
              onPress={onCancel}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                {t.common?.cancel || 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
