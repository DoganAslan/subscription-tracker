import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';

interface Props {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmationModal({ visible, onConfirm, onCancel, isLoading }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 350, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>
            Delete Subscription?
          </Text>
          <Text style={{ color: '#64748b', marginBottom: 24, lineHeight: 22 }}>
            Are you sure you want to delete this subscription? This action cannot be undone and will be removed from your tracking immediately.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              onPress={onCancel}
              disabled={isLoading}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onConfirm}
              disabled={isLoading}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ fontWeight: '600', color: '#ffffff', fontSize: 16 }}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
