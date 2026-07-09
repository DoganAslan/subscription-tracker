import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { Platform } from 'react-native';
import { getFirestore, initializeFirestore, persistentLocalCache, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { t } from '@/locales/i18n';

const firebaseConfig = {
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,

  apiKey: Platform.OS === 'android' 
    ? process.env.EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID
    : process.env.EXPO_PUBLIC_FIREBASE_API_KEY_WEB,
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth conditionally to support SSR and Web
let auth: Auth;
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  auth = initializeAuth(app);
}

// Initialize Firestore
let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache()
  });
} catch (_) {
  db = getFirestore(app);
}

// Initialize Crashlytics on Native platforms
if (Platform.OS !== 'web') {
  try {
    const crashlytics = require('@react-native-firebase/crashlytics').default;
    crashlytics().setCrashlyticsCollectionEnabled(!__DEV__);
  } catch (e) {
    console.log('Crashlytics initialization skipped on this platform');
  }
}

export { app, auth, db };



