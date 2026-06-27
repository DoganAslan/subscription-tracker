import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform, Modal, KeyboardAvoidingView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { auth } from '@/services/firebase/config';
import { updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { useProfileStore } from '@/store/useProfileStore';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const { profileImage, setProfileImage } = useProfileStore();
  const { colors } = useTheme();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  const openProfileModal = () => {
    const nameParts = (auth.currentUser?.displayName || '').split(' ');
    setFirstName(nameParts[0] || '');
    setLastName(nameParts.slice(1).join(' ') || '');
    setIsProfileModalVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]?.base64) {
      const microAvatarString = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfileImage(microAvatarString);
      
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, { photoURL: microAvatarString });
        } catch (e) {
          Alert.alert('Error', 'Failed to save profile picture');
        }
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    setIsUpdatingProfile(true);
    try {
      const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      await updateProfile(auth.currentUser, {
        displayName: displayName || null,
        photoURL: profileImage || null
      });
      setIsProfileModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <View style={dynamicStyles.headerContainer}>
      <View style={dynamicStyles.leftSection}>
        <Text style={dynamicStyles.title}>{title}</Text>
      </View>
      
      <TouchableOpacity style={dynamicStyles.profileTrigger} onPress={openProfileModal} activeOpacity={0.8}>
        {(profileImage || auth.currentUser?.photoURL) ? (
          <Image source={{ uri: profileImage || auth.currentUser?.photoURL || '' }} style={dynamicStyles.avatar} />
        ) : (
          <View style={dynamicStyles.avatarFallback}>
            <Text style={dynamicStyles.avatarText}>
              {(auth.currentUser?.displayName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isProfileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={dynamicStyles.modalOverlay}
        >
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeaderLayout}>
              <Text style={dynamicStyles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsProfileModalVisible(false)}>
                <Text style={dynamicStyles.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.avatarUploadContainer}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                {(profileImage || auth.currentUser?.photoURL) ? (
                  <Image source={{ uri: profileImage || auth.currentUser?.photoURL || '' }} style={dynamicStyles.modalAvatar} />
                ) : (
                  <View style={dynamicStyles.modalAvatarFallback}>
                    <Text style={dynamicStyles.modalAvatarText}>
                      {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <View style={dynamicStyles.avatarEditBadge}>
                  <Text style={dynamicStyles.avatarEditBadgeText}>+</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <Text style={dynamicStyles.inputLabel}>FIRST NAME</Text>
            <TextInput
              style={dynamicStyles.inputField}
              value={firstName}
              onChangeText={setFirstName}
              placeholderTextColor={colors.textSecondary}
              placeholder="John"
            />

            <Text style={dynamicStyles.inputLabel}>LAST NAME</Text>
            <TextInput
              style={[dynamicStyles.inputField, { marginBottom: 24 }]}
              value={lastName}
              onChangeText={setLastName}
              placeholderTextColor={colors.textSecondary}
              placeholder="Doe"
            />

            <TouchableOpacity 
              style={dynamicStyles.saveBtn}
              onPress={handleUpdateProfile}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                 <ActivityIndicator color={colors.background} />
              ) : (
                 <Text style={dynamicStyles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    fontFamily: 'Hanken Grotesk',
  },
  profileTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    paddingBottom: 40,
  },
  modalHeaderLayout: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20, 
    fontWeight: '700', 
    color: colors.text,
  },
  modalClose: {
    fontSize: 16, 
    fontWeight: '600',
    color: colors.primary,
  },
  avatarUploadContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  modalAvatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    color: colors.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarEditBadgeText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputLabel: {
    marginBottom: 8, 
    fontSize: 12, 
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  inputField: {
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 16, 
    borderWidth: 1, 
    backgroundColor: colors.background,
    borderColor: colors.border,
    color: colors.text,
  },
  saveBtn: {
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    color: colors.background, 
    fontWeight: 'bold', 
    fontSize: 16,
  }
});
