import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { Platform } from 'react-native';
import { getFirestore, initializeFirestore, persistentLocalCache, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const firebaseConfig = {
  authDomain: "submate-4fc0a.firebaseapp.com",
  projectId: "submate-4fc0a",
  storageBucket: "submate-4fc0a.appspot.com",
  messagingSenderId: "360341077180",
  appId: "1:360341077180:web:8e30b691090be4b29f7998",
  measurementId: "G-H8E7L8V6W9",

  // Injecting the exact validated production tokens
  apiKey: Platform.OS === 'android' 
    ? 'AIzaSyCvzeEMPTniMkea5cbVfPDRqFMVWqCgO8Q' // Verified Android Key
    : 'AIzaSyBqOv-mRCWtyRKDkr39wHqFZLvHyE8e7sk', // Verified Browser/Web Key
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

