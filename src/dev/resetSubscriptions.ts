import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

export const resetSubscriptions = async (userId: string) => {
  if (!__DEV__) {
    throw new Error("SECURITY VIOLATION: Reset scripts cannot be run in production.");
  }
  
  console.log('Resetting database for user:', userId);
  
  try {
    const subRef = collection(db, 'users', userId, 'subscriptions');
    const snapshot = await getDocs(subRef);
    
    const deletePromises = snapshot.docs.map(document => deleteDoc(document.ref));
    await Promise.all(deletePromises);
    
    console.log(`Successfully deleted ${snapshot.docs.length} subscriptions!`);
    return snapshot.docs.length;
  } catch (error) {
    console.error('Failed to reset database:', error);
    throw error;
  }
};
