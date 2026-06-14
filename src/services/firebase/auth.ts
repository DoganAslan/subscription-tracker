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
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { SubscriptionService } from './firestore';

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
