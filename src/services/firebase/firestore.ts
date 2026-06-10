import { getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, doc } from 'firebase/firestore';
import { db } from './config';
import { getSubscriptionsCollection, getSubscriptionDoc } from './collections';
import { Subscription } from './types';

export const SubscriptionService = {
  // Get all subscriptions for a user
  getSubscriptions: async (userId: string): Promise<Subscription[]> => {
    const snapshot = await getDocs(getSubscriptionsCollection(userId));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subscription[];
  },

  // Add a new subscription
  addSubscription: async (userId: string, data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = await addDoc(getSubscriptionsCollection(userId), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Update a subscription
  updateSubscription: async (userId: string, subscriptionId: string, data: Partial<Subscription>) => {
    const docRef = getSubscriptionDoc(userId, subscriptionId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete a single subscription
  deleteSubscription: async (userId: string, subscriptionId: string) => {
    const docRef = getSubscriptionDoc(userId, subscriptionId);
    await deleteDoc(docRef);
  },

  // Delete all subscriptions for a user
  deleteAllSubscriptions: async (userId: string) => {
    const snapshot = await getDocs(getSubscriptionsCollection(userId));
    // For a real production app with many docs, this should use batched writes.
    // For React Native Firebase Web SDK with limited MVP subscriptions, sequential/Promise.all is fine.
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  },

  // Delete the root user document
  deleteUserDocument: async (userId: string) => {
    // Note: To truly delete the user, we must first delete all subcollections.
    // We assume deleteAllSubscriptions is called before this.
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  }
};
