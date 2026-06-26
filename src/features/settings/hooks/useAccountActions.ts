import i18n from '@/locales/i18n';
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
      
      Alert.alert(i18n.t('global.success'), i18n.t('global.allYourDataHasBeenPe'));
    } catch (error) {
      console.error(error);
      Alert.alert(i18n.t('global.error'), i18n.t('global.failedToDeleteDataPl'));
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
        Alert.alert(i18n.t('global.reauthenticationRequ'), i18n.t('global.forSecurityReasonsPl'));
      } else {
        Alert.alert(i18n.t('global.error'), i18n.t('global.failedToDeleteAccoun'));
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const confirmDeleteData = () => {
    Alert.alert(i18n.t('global.deleteAllData'), i18n.t('global.thisWillPermanentlyE'),
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAllData }
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(i18n.t('global.deleteAccount1'), i18n.t('global.thisWillPermanentlyE1'),
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: deleteAccount }
      ]
    );
  };

  const confirmSignOut = () => {
    Alert.alert(i18n.t('global.signOut'), i18n.t('global.areYouSureYouWantToS'),
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
              Alert.alert(i18n.t('global.error'), i18n.t('global.failedToSignOutPrope'));
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
