import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSecurityStore } from '@/store/useSecurityStore';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: React.ReactNode;
}

export function AppLockGuard({ children }: Props) {
  const { isBiometricsEnabled } = useSecurityStore();
  const [isUnlocked, setIsUnlocked] = useState(!isBiometricsEnabled);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // If biometrics are turned off, ensure app is unlocked.
    if (!isBiometricsEnabled) {
      setIsUnlocked(true);
      return;
    }

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App comes to foreground -> lock it
        if (isBiometricsEnabled) {
          handleUnlock();
        }
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App goes to background -> lock it
        if (isBiometricsEnabled) {
          setIsUnlocked(false);
        }
      }
      appState.current = nextAppState;
    });

    // Initial check if locked on mount
    if (isBiometricsEnabled && !isUnlocked) {
      handleUnlock();
    }

    return () => {
      subscription.remove();
    };
  }, [isBiometricsEnabled]);

  const handleUnlock = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Vault',
      fallbackLabel: 'Use Passcode',
    });
    if (result.success) {
      setIsUnlocked(true);
    }
  };

  if (!isUnlocked) {
    return (
      <View style={styles.container}>
        <Ionicons name="lock-closed" size={64} color="#3B82F6" style={styles.icon} />
        <Text style={styles.title}>Vault Locked</Text>
        <TouchableOpacity style={styles.button} onPress={handleUnlock} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Tap to Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  button: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '600',
  }
});
