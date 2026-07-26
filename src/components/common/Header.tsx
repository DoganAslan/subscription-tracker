import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuthStore();
  const { profileImage } = useProfileStore();
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Safe extraction of parameters to compute fallback initials
  const userFullName = user?.displayName || 'Account Owner';
  const remoteAvatarUrl = profileImage || user?.photoURL; // Synergized link across devices

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name ? name[0].toUpperCase() : 'U';
  };

  return (
    <View style={styles.topHeaderFix}>
      <Text style={[styles.submateBrandText, { color: colors.text }]}>{title}</Text>

      {/* CLOUD-SYNCED SMART AVATAR ACTION LINK */}
      <TouchableOpacity 
        onPress={() => router.push('/(tabs)/settings')}
        style={styles.avatarCircleContainer}
      >
        {remoteAvatarUrl && !imageError ? (
          <Image 
            source={{ uri: remoteAvatarUrl }} 
            style={[styles.avatarInnerCircle, { resizeMode: 'cover', borderWidth: 0 }]} 
            onError={() => {
              // Soft resilience: if url fails to load or device is offline, render fallback
              console.log('Avatar URL loading failed, showing initials fallback.');
              setImageError(true);
            }}
          />
        ) : (
          <View style={styles.avatarInnerCircle}>
            <Text style={styles.avatarInitialsText}>
              {getInitials(userFullName)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeaderFix: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 36 : 20, // adjust for android status bar if needed, but safeArea takes care of it usually
    paddingBottom: 12,
    backgroundColor: 'transparent',
    zIndex: 50
  },
  submateBrandText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  avatarCircleContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarInnerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});



