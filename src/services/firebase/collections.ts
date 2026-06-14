import { collection, doc, CollectionReference, DocumentReference } from 'firebase/firestore';
import { db } from './config';
import { User, Subscription } from './types';

// Helper to strongly type collections
const createCollection = <T = import('firebase/firestore').DocumentData>(collectionName: string) => {
  return collection(db, collectionName) as CollectionReference<T>;
};

// Users collection
export const usersCollection = createCollection<User>('users');
export const getUserDoc = (userId: string) => doc(db, `users/${userId}`) as DocumentReference<User>;

// Subscriptions subcollection
export const getSubscriptionsCollection = () => {
  return collection(db, 'subscriptions') as CollectionReference<Subscription>;
};

export const getSubscriptionDoc = (subscriptionId: string) => {
  return doc(db, `subscriptions/${subscriptionId}`) as DocumentReference<Subscription>;
};
