import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

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

  // Delete Auth Account
  deleteAccount: async () => {
    const user = auth.currentUser;
    if (user) {
      const { deleteUser } = await import('firebase/auth');
      await deleteUser(user);
    }
  },

  // Auth State Observer
  observeAuthState: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};
