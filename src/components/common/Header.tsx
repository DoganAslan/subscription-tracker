import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform, Modal, KeyboardAvoidingView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { auth } from '@/services/firebase/config';
import { updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { useProfileStore } from '@/store/useProfileStore';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const { profileImage, setProfileImage } = useProfileStore();

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
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, { photoURL: uri });
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
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <TouchableOpacity style={styles.profileTrigger} onPress={openProfileModal} activeOpacity={0.8}>
        {(profileImage || auth.currentUser?.photoURL) ? (
          <Image source={{ uri: profileImage || auth.currentUser?.photoURL || '' }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>
              {(auth.currentUser?.displayName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Profile Edit Modal */}
      <Modal
        visible={isProfileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderLayout}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsProfileModalVisible(false)}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.avatarUploadContainer}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                {(profileImage || auth.currentUser?.photoURL) ? (
                  <Image source={{ uri: profileImage || auth.currentUser?.photoURL || '' }} style={styles.modalAvatar} />
                ) : (
                  <View style={styles.modalAvatarFallback}>
                    <Text style={styles.modalAvatarText}>
                      {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Text style={styles.avatarEditBadgeText}>+</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>FIRST NAME</Text>
            <TextInput
              style={styles.inputField}
              value={firstName}
              onChangeText={setFirstName}
              placeholderTextColor="#8c909f"
              placeholder="John"
            />

            <Text style={styles.inputLabel}>LAST NAME</Text>
            <TextInput
              style={[styles.inputField, { marginBottom: 24 }]}
              value={lastName}
              onChangeText={setLastName}
              placeholderTextColor="#8c909f"
              placeholder="Doe"
            />

            <TouchableOpacity 
              style={styles.saveBtn}
              onPress={handleUpdateProfile}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                 <ActivityIndicator color="#002e6a" />
              ) : (
                 <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: '#FFFFFF',
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
    backgroundColor: '#404a59',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#dfe2f1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#1c1f2a',
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
    color: '#dfe2f1',
  },
  modalClose: {
    fontSize: 16, 
    fontWeight: '600',
    color: '#adc6ff',
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
    backgroundColor: '#404a59',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    color: '#dfe2f1',
    fontSize: 32,
    fontWeight: 'bold',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#adc6ff',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1c1f2a',
  },
  avatarEditBadgeText: {
    color: '#002e6a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputLabel: {
    marginBottom: 8, 
    fontSize: 12, 
    fontWeight: 'bold',
    color: '#c2c6d6',
  },
  inputField: {
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 16, 
    borderWidth: 1, 
    backgroundColor: '#0f131d',
    borderColor: '#424754',
    color: '#dfe2f1',
  },
  saveBtn: {
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    backgroundColor: '#adc6ff',
  },
  saveBtnText: {
    color: '#002e6a', 
    fontWeight: 'bold', 
    fontSize: 16,
  }
});
