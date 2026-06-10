import { initializeApp, getApp, getApps } from 'firebase/app';
import { Auth, getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, Firestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
};
console.log('FIREBASE CONFIG');
console.log(firebaseConfig);

// Initialize Firebase
let app;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  // Must initialize auth immediately with AsyncStorage BEFORE any getAuth() calls
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache()
  });
} catch (_) {
  db = getFirestore(app);
}

export { app, auth, db };

