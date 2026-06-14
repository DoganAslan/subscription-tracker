import { getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, doc, query, where } from 'firebase/firestore';
import { db } from './config';
import { getSubscriptionsCollection, getSubscriptionDoc } from './collections';
import { Subscription } from './types';

export const SubscriptionService = {
  // Get all subscriptions for a user
  getSubscriptions: async (userId: string): Promise<Subscription[]> => {
    if (!userId) throw new Error("User not authenticated");
    const q = query(getSubscriptionsCollection(), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subscription[];
  },

  // Add a new subscription
  addSubscription: async (userId: string, data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    const payload = {
      ...data,
      userId, // Inject userId for security rules
      status: data.status || 'active', // default value instead of null if possible
      reminderOffset: data.reminderOffset || null,
      isFreeTrial: data.isFreeTrial || false,
      trialEndDate: data.trialEndDate || null,
      notes: data.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Catch any other potential undefined values and convert to null
    Object.keys(payload).forEach(key => {
      if ((payload as any)[key] === undefined) {
        (payload as any)[key] = null;
      }
    });

    const docRef = await addDoc(getSubscriptionsCollection(), payload);
    return docRef.id;
  },

  // Update a subscription
  updateSubscription: async (userId: string, subscriptionId: string, data: Partial<Subscription>) => {
    const docRef = getSubscriptionDoc(subscriptionId);
    
    const payload = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Catch any other potential undefined values and convert to null
    Object.keys(payload).forEach(key => {
      if ((payload as any)[key] === undefined) {
        (payload as any)[key] = null;
      }
    });

    await updateDoc(docRef, payload);
  },

  // Delete a single subscription
  deleteSubscription: async (userId: string, subscriptionId: string) => {
    const docRef = getSubscriptionDoc(subscriptionId);
    await deleteDoc(docRef);
  },

  // Delete all subscriptions for a user
  deleteAllSubscriptions: async (userId: string) => {
    try {
      if (!userId) throw new Error("User not authenticated");
      const q = query(getSubscriptionsCollection(), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Delete Error (Subscriptions):", error);
      throw error;
    }
  },

  // Delete the root user document
  deleteUserDocument: async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error("Delete Error (User Doc):", error);
      throw error;
    }
  }
};
