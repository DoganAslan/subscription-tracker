import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Platform, Alert } from 'react-native';
import { auth, db } from './config';
import { SubscriptionService } from './firestore';

// Handle returning user from Firebase OAuth Redirect on Web
if (Platform.OS === 'web') {
  void (async () => {
    try {
      const { getRedirectResult } = require('firebase/auth') as {
        getRedirectResult: (firebaseAuth: typeof auth) => Promise<any>;
      };
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        const user = result.user;
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Google User',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (error: any) {
      console.log('[Auth Redirect Handler]:', error?.message);
    }
  })();
}

export const AuthService = {
  // Email & Password Sign Up
  signUp: async (email: string, pass: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    // Create initial user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return user;
  },

  // Email & Password Log In
  logIn: async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  },

  // Google Sign In via popup on web. Native apps use an OAuth ID token from expo-auth-session.
  signInWithGoogle: async () => {
    if (Platform.OS !== 'web') {
      throw new Error('Google popup sign-in is only available on the web build.');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const { signInWithPopup } = require('firebase/auth') as {
        signInWithPopup: (firebaseAuth: typeof auth, authProvider: GoogleAuthProvider) => Promise<any>;
      };
      const userCredential = await signInWithPopup(auth, provider);
      if (!userCredential || !userCredential.user) {
        return null;
      }

      const user = userCredential.user;

      // Create or merge user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Google User',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return user;
    } catch (error: any) {
      console.error("Google Auth Error:", error?.code, error?.message);

      if (error?.code === 'auth/operation-not-allowed') {
        Alert.alert(
          'Firebase Yapılandırma Gerekli',
          'Firebase Console -> Authentication -> Sign-in method bölümünden Google sağlayıcısını etkinleştirmeniz gerekmektedir.'
        );
      } else if (error?.code === 'auth/unauthorized-domain') {
        Alert.alert(
          'Yetkisiz Etki Alanı (Domain)',
          'Firebase Console -> Authentication -> Settings -> Authorized domains kısmına kullandığınız adresi (örn: localhost) ekleyin.'
        );
      } else if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        Alert.alert('Google Giriş Hatası', error?.message || 'Google ile giriş yapılırken bir hata oluştu.');
      }
      throw error;
    }
  },

  signInWithGoogleIdToken: async (idToken: string) => {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Google User',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return user;
  },

  // Log Out
  logOut: async () => {
    await signOut(auth);
  },

  // Delete Auth Account & All Associated Data
  deleteAccount: async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        // 1. Delete all subscriptions
        await SubscriptionService.deleteAllSubscriptions(user.uid);
        
        // 2. Delete user document
        await SubscriptionService.deleteUserDocument(user.uid);

        // 3. Delete auth account
        const { deleteUser } = await import('firebase/auth');
        await deleteUser(user);
      } catch (error: any) {
        console.error("Delete Error:", error);
        throw error;
      }
    }
  },

  // Update Email
  updateEmailAddress: async (newEmail: string) => {
    const user = auth.currentUser;
    if (user) {
      await updateEmail(user, newEmail);
    } else {
      throw new Error('No user is currently signed in.');
    }
  },

  // Update Password
  updateUserPassword: async (newPassword: string) => {
    const user = auth.currentUser;
    if (user) {
      await updatePassword(user, newPassword);
    } else {
      throw new Error('No user is currently signed in.');
    }
  },

  // Reauthenticate User
  reauthenticate: async (currentPassword: string) => {
    const user = auth.currentUser;
    if (user && user.email) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
    } else {
      throw new Error('No user is currently signed in or user has no email.');
    }
  },

  // Send Password Reset Email
  sendPasswordResetEmail: async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  },

  // Auth State Observer
  observeAuthState: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};
