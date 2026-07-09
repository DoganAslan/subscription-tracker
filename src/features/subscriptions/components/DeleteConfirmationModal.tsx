import i18n, { t } from '@/locales/i18n';
import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCancelUrl } from '@/utils/cancelLinksDb';

interface Props {
  visible: boolean;
  onConfirm: (didSaveMoney?: boolean) => void;
  onCancel: () => void;
  isLoading?: boolean;
  subscriptionName?: string;
}

export function DeleteConfirmationModal({ visible, onConfirm, onCancel, isLoading, subscriptionName }: Props) {
  const handleOpenCancelUrl = () => {
    const url = getCancelUrl(subscriptionName);
    Linking.openURL(url).catch((err) => console.error('An error occurred', err));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 350, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>{t.global?.deleteSubscription || 'Delete Subscription?'}</Text>
          <Text style={{ color: '#64748b', marginBottom: 16, lineHeight: 22 }}>
            {t.features?.deleteDoesNotCancel || "Deleting this subscription from SubMate does not cancel your actual subscription."}
          </Text>

          <TouchableOpacity 
            onPress={handleOpenCancelUrl}
            style={{ 
              backgroundColor: '#EFF6FF', 
              paddingVertical: 12, 
              paddingHorizontal: 16, 
              borderRadius: 12, 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#BFDBFE',
              marginBottom: 24
            }}
          >
            <Ionicons name="link-outline" size={20} color="#2563EB" style={{ marginRight: 8 }} />
            <Text style={{ color: '#2563EB', fontWeight: '600', fontSize: 15 }}>{t.features?.goToCancelPage || 'Go to Cancel Page'}</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'column', gap: 12 }}>
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              onPress={() => onConfirm(true)}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#ffffff" /> : (
                <>
                  <Ionicons name="cash-outline" size={20} color="#FFF" />
                  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>{t.features?.cancelledToSave || 'I cancelled this to save money!'}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: '#EF4444', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
              onPress={() => onConfirm(false)}
              disabled={isLoading}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>{t.features?.justDelete || 'Just delete from app'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={{ color: '#475569', fontWeight: 'bold', fontSize: 15 }}>{t.common?.cancel || 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


