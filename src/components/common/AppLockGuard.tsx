import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSecurityStore } from '@/store/useSecurityStore';
import { useSessionStore } from '@/store/useSessionStore';
import { triggerHaptic } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  children: React.ReactNode;
}

export function AppLockGuard({ children }: Props) {
  const { isBiometricsEnabled } = useSecurityStore();
  const { isSessionUnlocked, setSessionUnlocked } = useSessionStore();
  const isPromptingAuth = useRef(false);
  const { colors } = useTheme();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  const isUnlocked = !isBiometricsEnabled || isSessionUnlocked;

  useEffect(() => {
    // Initial check if locked on mount
    if (!isUnlocked && !isPromptingAuth.current) {
      handleUnlock();
    }
  }, [isUnlocked]);

  const handleUnlock = async () => {
    console.log("🔓 [AUTH] Unlock button pressed");
    triggerHaptic('light');
    if (isPromptingAuth.current || isUnlocked) return;
    
    try {
      isPromptingAuth.current = true;
      
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      console.log("🔓 [AUTH] Has Hardware:", hasHardware);
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      console.log("🔓 [AUTH] Is Enrolled:", isEnrolled);

      if (!hasHardware || !isEnrolled) {
        // Fallback if simulator or no biometrics: force unlock for dev
        console.warn("No biometrics found, bypassing for development.");
        setSessionUnlocked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SubMate Vault',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setSessionUnlocked(true);
      }
    } catch (error) {
      console.error("Biometric error:", error);
      Alert.alert("Biometric Error", String(error));
    } finally {
      // Delay resetting the flag so the AppState change from the overlay closing is ignored
      setTimeout(() => {
        isPromptingAuth.current = false;
      }, 500);
    }
  };

  if (!isUnlocked) {
    return (
      <View style={dynamicStyles.container} pointerEvents="auto">
        <Ionicons name="lock-closed" size={64} color={colors.primary} style={dynamicStyles.icon} />
        <Text style={dynamicStyles.title}>SubMate Locked</Text>
        <TouchableOpacity 
          style={dynamicStyles.button} 
          onPress={handleUnlock} 
          onLongPress={() => {
            console.warn("🚨 [AUTH] Emergency Dev Bypass Triggered");
            setSessionUnlocked(true);
          }}
          activeOpacity={0.7}
        >
          <Text style={dynamicStyles.buttonText}>Tap to Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 40,
  },
  button: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    zIndex: 9999,
    elevation: 9999,
  },
  buttonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
  }
});
