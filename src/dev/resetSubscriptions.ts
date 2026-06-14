import { collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

export const resetSubscriptions = async (userId: string) => {
  if (!__DEV__) {
    throw new Error("SECURITY VIOLATION: Reset scripts cannot be run in production.");
  }
  
  console.log('Resetting database for user:', userId);
  
  try {
    const subRef = collection(db, 'subscriptions');
    const q = query(subRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(document => deleteDoc(document.ref));
    await Promise.all(deletePromises);
    
    console.log(`Successfully deleted ${snapshot.docs.length} subscriptions!`);
    return snapshot.docs.length;
  } catch (error) {
    console.error('Failed to reset database:', error);
    throw error;
  }
};
