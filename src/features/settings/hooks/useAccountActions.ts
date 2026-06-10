import { useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { SubscriptionService } from '@/services/firebase/firestore';
import { AuthService } from '@/services/firebase/auth';
import { subscriptionKeys } from '@/features/subscriptions/hooks/useSubscriptions';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useRouter } from 'expo-router';

export function useAccountActions() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const resetOnboarding = useOnboardingStore(state => state.resetOnboarding);
  const router = useRouter();
  
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const deleteAllData = async () => {
    if (!user) return;
    setIsDeletingData(true);
    try {
      await SubscriptionService.deleteAllSubscriptions(user.uid);
      
      // Invalidate the cache to reset the dashboard visually
      queryClient.setQueryData(subscriptionKeys.list(user.uid), []);
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      
      Alert.alert('Success', 'All your data has been permanently deleted. Your account is still active.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to delete data. Please try again later.');
    } finally {
      setIsDeletingData(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      // 1. Delete all user data
      await SubscriptionService.deleteAllSubscriptions(user.uid);
      // 2. Delete root user document
      await SubscriptionService.deleteUserDocument(user.uid);
      // 3. Clear local storage stores (Zustand persists)
      resetOnboarding();
      await AsyncStorage.clear();
      // 4. Delete Auth
      await AuthService.deleteAccount();
      // (The AuthStateListener in AuthProvider will fire, set user to null, and route to /login)
    } catch (error: any) {
      console.error(error);
      if (error?.code === 'auth/requires-recent-login') {
        Alert.alert('Re-authentication Required', 'For security reasons, please sign out and sign back in before deleting your account.');
      } else {
        Alert.alert('Error', 'Failed to delete account. Please try again later.');
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const confirmDeleteData = () => {
    Alert.alert(
      'Delete All Data?',
      'This will permanently erase all your subscriptions. Your account will remain open. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAllData }
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account?',
      'This will permanently erase your account, subscriptions, and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: deleteAccount }
      ]
    );
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Sign Out?',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          onPress: async () => {
            try {
              await AuthService.logOut();
              useAuthStore.getState().setUser(null);
              await AsyncStorage.clear();
              router.replace('/(auth)');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to sign out properly.');
            }
          } 
        }
      ]
    );
  }

  return {
    isDeletingData,
    isDeletingAccount,
    confirmDeleteData,
    confirmDeleteAccount,
    confirmSignOut
  };
}
