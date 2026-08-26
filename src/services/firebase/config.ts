import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
import { Platform } from 'react-native';
import { getFirestore, initializeFirestore, persistentLocalCache, Firestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Auth conditionally to support Native and Web
let auth: Auth;
if (getApps().length > 1) {
  auth = getAuth(app);
} else {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    } else {
      auth = getAuth(app);
    }
  } catch (e) {
    auth = getAuth(app);
  }
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

// Authentication tokens are attached automatically by the callable Functions SDK.
const functions = getFunctions(app, 'europe-west1');

export { app, auth, db, functions };
