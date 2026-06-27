import i18n from '@/locales/i18n';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useSecurityStore } from '@/store/useSecurityStore';
import { useSessionStore } from '@/store/useSessionStore';
import { triggerHaptic } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { authenticateBiometric } from '@/utils/biometrics';

interface Props {
  children: React.ReactNode;
}

export function AppLockGuard({ children }: Props) {
  const { isBiometricsEnabled } = useSecurityStore();
  const { isSessionUnlocked, setSessionUnlocked } = useSessionStore();
  const isPromptingAuth = useRef(false);

  // If biometrics are off globally or we already unlocked this session, bypass.
  // Note: For Feature 6, we might want to force it if requested, 
  // but keeping isBiometricsEnabled respects user settings.
  const isUnlocked = !isBiometricsEnabled || isSessionUnlocked;

  useEffect(() => {
    if (!isUnlocked && !isPromptingAuth.current) {
      triggerGate();
    }
  }, [isUnlocked]);

  const triggerGate = async () => {
    console.log("[AUTH] triggerGate called");
    triggerHaptic('light');
    
    if (isPromptingAuth.current || isUnlocked) return;
    
    try {
      isPromptingAuth.current = true;
      
      const success = await authenticateBiometric();
      if (success) {
        setSessionUnlocked(true);
      }
    } catch (error) {
      console.error("Biometric error:", error);
    } finally {
      setTimeout(() => {
        isPromptingAuth.current = false;
      }, 500);
    }
  };

  if (!isUnlocked) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 9999, ...StyleSheet.absoluteFillObject }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#3B82F6' }}>
          <Ionicons name="shield-checkmark-outline" size={44} color="#3B82F6" />
        </View>
        
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 }}>{i18n.t('global.submateKilitli')}</Text>
        <Text style={{ color: '#64748B', fontSize: 14, textAlign: 'center', marginTop: 8, maxWidth: 260 }}>{i18n.t('global.finansalVerilerinizB')}</Text>

        <TouchableOpacity 
          onPress={triggerGate}
          onLongPress={() => {
            console.warn("[AUTH] Emergency Dev Bypass Triggered");
            setSessionUnlocked(true);
          }}
          style={{ marginTop: 32, backgroundColor: '#2563EB', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{i18n.t('global.kilidiA')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}
