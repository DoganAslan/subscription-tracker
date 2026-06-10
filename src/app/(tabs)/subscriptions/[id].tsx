import React, { useState } from 'react';
import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SubscriptionForm } from '@/features/subscriptions/components/SubscriptionForm';
import { DeleteConfirmationModal } from '@/features/subscriptions/components/DeleteConfirmationModal';
import { useSubscriptions, useUpdateSubscription, useDeleteSubscription } from '@/features/subscriptions/hooks/useSubscriptions';
import { AppLoader } from '@/components/common/AppLoader';
import { SubscriptionFormData } from '@/features/subscriptions/schemas/subscription.schema';

const DESIGN_TOKENS = {
  colors: {
    background: '#0f131d',
    surface: '#1c1f2a',
    surfaceHigh: '#262a35',
    onSurface: '#dfe2f1',
    onSurfaceVariant: '#c2c6d6',
    primary: '#adc6ff',
    onPrimary: '#002e6a',
    error: '#ffb4ab',
    outline: '#424754',
  }
};

export default function EditSubscriptionScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const router = useRouter();
  
  const { data: subscriptions, isLoading: isLoadingSubs, isFetching } = useSubscriptions();
  const { mutateAsync: updateSubscription, isPending: isUpdating } = useUpdateSubscription();
  const { mutateAsync: deleteSubscription, isPending: isDeleting } = useDeleteSubscription();
  
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  if (isLoadingSubs || (isFetching && !subscriptions)) {
    return <AppLoader />;
  }

  const subscription = subscriptions?.find(s => String(s.id) === String(id));

  if (!subscription) {
    if (isFetching) return <AppLoader />;
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Subscription not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackButton}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleUpdate = async (data: SubscriptionFormData) => {
    await updateSubscription({ id, data });
    router.back();
  };

  const handleDelete = async () => {
    await deleteSubscription(id);
    setIsDeleteModalVisible(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
             <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Subscription</Text>
          <View style={{ width: 60 }} />{/* Spacer */}
        </View>
        
        <SubscriptionForm 
          initialData={subscription}
          onSubmit={handleUpdate} 
          isLoading={isUpdating} 
          submitLabel="Save Changes"
          onDelete={() => setIsDeleteModalVisible(true)}
        />
        
        <DeleteConfirmationModal
          visible={isDeleteModalVisible}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteModalVisible(false)}
          isLoading={isDeleting}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DESIGN_TOKENS.colors.background },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.surfaceHigh,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.onSurface,
    fontFamily: 'Hanken Grotesk',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    color: DESIGN_TOKENS.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  notFoundText: {
    color: DESIGN_TOKENS.colors.onSurfaceVariant,
    fontSize: 16,
  },
  goBackButton: {
    marginTop: 16,
  },
  goBackText: {
    color: DESIGN_TOKENS.colors.primary,
    fontWeight: '600',
  }
});
