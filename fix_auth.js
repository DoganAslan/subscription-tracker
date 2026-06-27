const fs = require('fs');

const indexCode = \import i18n from '@/locales/i18n';
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Link } from 'expo-router';
import Animated, { useSharedValue, withRepeat, withTiming, Easing, useAnimatedStyle } from 'react-native-reanimated';
import { useAuthMutations } from '@/features/auth/hooks/useAuthMutations';
import { AuthService } from '@/services/firebase/auth';

export default function LoginScreen() {
  const { loginMutation } = useAuthMutations();
  const rotation = useSharedValue(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordState, setShowPasswordState] = useState(false);
  
  const [isResetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: \\deg\ }],
    };
  });

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert(i18n.t('global.error'), 'Please fill in all fields.');
      return;
    }
    loginMutation.mutate({ email, password });
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert(i18n.t('global.error'), i18n.t('global.pleaseEnterYourEmail'));
      return;
    }
    try {
      await AuthService.sendPasswordResetEmail(resetEmail);
      Alert.alert(i18n.t('global.success'), i18n.t('global.passwordResetLinkSen'));
      setResetModalVisible(false);
      setResetEmail('');
    } catch (error) {
      Alert.alert(i18n.t('global.error'), error.message || "Failed to send reset email.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#0F172A' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          
          <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center' }}>
            
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <Animated.Image 
                source={require('../../../assets/images/logo.png')} 
                style={[{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#334155', backgroundColor: '#1E293B' }, animatedLogoStyle]}
                resizeMode="cover"
              />
            </View>

            <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: -0.8, marginTop: 6, marginBottom: 8 }}>
              {i18n.t('auth.welcomeBack')}
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 36 }}>
              {i18n.t('auth.signInSub')}
            </Text>

            <View style={{ width: '100%' }}>
              <Text style={{ color: '#CBD5E1', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 }}>
                {i18n.t('auth.emailLabel')}
              </Text>
              <TextInput 
                style={{ backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 12, color: '#F8FAFC', width: '100%', height: 52, paddingHorizontal: 16, fontSize: 15, marginBottom: 20 }}
                placeholder="you@example.com"
                placeholderTextColor="#475569"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#CBD5E1', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>
                  {i18n.t('auth.passwordLabel')}
                </Text>
                <TouchableOpacity onPress={() => {
                  setResetEmail('');
                  setResetModalVisible(true);
                }}>
                  <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '600' }}>{i18n.t('auth.forgotPassword')}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', width: '100%', height: 52, paddingHorizontal: 16, marginBottom: 28 }}>
                <TextInput 
                  style={{ flex: 1, color: '#F8FAFC', fontSize: 15, height: '100%' }}
                  placeholder="••••••••"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPasswordState}
                />
                <TouchableOpacity onPress={() => setShowPasswordState(!showPasswordState)} style={{ padding: 4 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '700' }}>
                    {showPasswordState ? 'Gizle' : 'Göster'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                style={{ backgroundColor: '#2563EB', width: '100%', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 12, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
                onPress={handleLogin}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: -0.2 }}>
                  {i18n.t('auth.loginBtn')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32 }}>
              <Text style={{ color: '#94A3B8', fontSize: 14, marginRight: 6 }}>
                {i18n.t('auth.noAccount')}
              </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '700' }}>
                    {i18n.t('auth.signUpLink')}
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

          </View>
        </View>
      </ScrollView>
      
      <Modal visible={isResetModalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderWidth: 1, width: '90%', maxWidth: 400, borderRadius: 16, padding: 24 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>{i18n.t('global.resetPassword')}</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 24 }}>{i18n.t('global.enterYourRegisteredE')}</Text>
            
            <TextInput
              style={{ backgroundColor: '#111827', borderColor: '#334155', borderWidth: 1, color: '#FFFFFF', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 24 }}
              placeholder={i18n.t('global.emailAddress')}
              placeholderTextColor="#6B7280"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => setResetModalVisible(false)} style={{ flex: 1, marginRight: 8, padding: 14, borderRadius: 8, backgroundColor: '#374151', alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleForgotPassword} style={{ flex: 1, marginLeft: 8, padding: 14, borderRadius: 8, backgroundColor: '#2563EB', alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Send Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
\;

fs.writeFileSync('src/app/(auth)/index.tsx', indexCode, 'utf8');
console.log('Login screen overwritten.');
