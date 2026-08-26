import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const projectId = 'submate-firestore-rules-test';
let testEnvironment;

const validSubscription = (userId, overrides = {}) => ({
  userId,
  name: 'Test Subscription',
  category: 'Entertainment',
  amount: 99.99,
  currency: 'TRY',
  billingCycle: 'monthly',
  renewalDate: Timestamp.now(),
  status: 'active',
  notes: '',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides,
});

const validCard = (userId, overrides = {}) => ({
  userId,
  name: 'Personal card',
  type: 'visa',
  lastFourDigits: '4242',
  expiryMonth: 12,
  expiryYear: 2030,
  color: '#1E3A8A',
  currency: 'TRY',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides,
});

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
});

after(async () => {
  await testEnvironment.cleanup();
});

test('authenticated users cannot read the client-forbidden secrets document', async () => {
  const firestore = testEnvironment.authenticatedContext('user-a').firestore();
  await assertFails(getDoc(doc(firestore, 'config', 'secrets')));
});

test('anonymous users cannot read subscriptions', async () => {
  const firestore = testEnvironment.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(firestore, 'subscriptions', 'sub-a')));
});

test('a user can create and read a valid subscription they own', async () => {
  const firestore = testEnvironment.authenticatedContext('user-a').firestore();
  const reference = doc(firestore, 'subscriptions', 'sub-a');
  await assertSucceeds(setDoc(reference, validSubscription('user-a')));
  await assertSucceeds(getDoc(reference));
});

test('a user cannot create or read another user subscription', async () => {
  const userAFirestore = testEnvironment.authenticatedContext('user-a').firestore();
  await assertFails(setDoc(
    doc(userAFirestore, 'subscriptions', 'sub-a'),
    validSubscription('user-b'),
  ));

  await testEnvironment.withSecurityRulesDisabled(async context => {
    await setDoc(
      doc(context.firestore(), 'subscriptions', 'sub-b'),
      validSubscription('user-b'),
    );
  });
  await assertFails(getDoc(doc(userAFirestore, 'subscriptions', 'sub-b')));
});

test('invalid and unexpected subscription fields are rejected', async () => {
  const firestore = testEnvironment.authenticatedContext('user-a').firestore();
  await assertFails(setDoc(
    doc(firestore, 'subscriptions', 'negative'),
    validSubscription('user-a', { amount: -1 }),
  ));
  await assertFails(setDoc(
    doc(firestore, 'subscriptions', 'extra'),
    validSubscription('user-a', { administrator: true }),
  ));
});

test('subscription ownership cannot be changed during update', async () => {
  const firestore = testEnvironment.authenticatedContext('user-a').firestore();
  const reference = doc(firestore, 'subscriptions', 'sub-a');
  await assertSucceeds(setDoc(reference, validSubscription('user-a')));
  await assertFails(updateDoc(reference, {
    userId: 'user-b',
    updatedAt: Timestamp.now(),
  }));
});

test('card records enforce ownership and safe recognition fields', async () => {
  const firestore = testEnvironment.authenticatedContext('user-a').firestore();
  await assertSucceeds(setDoc(
    doc(firestore, 'cards', 'card-a'),
    validCard('user-a'),
  ));
  await assertFails(setDoc(
    doc(firestore, 'cards', 'card-b'),
    validCard('user-b'),
  ));
  await assertFails(setDoc(
    doc(firestore, 'cards', 'card-invalid'),
    validCard('user-a', { lastFourDigits: '4242424242424242' }),
  ));
});

test('users can write only their own valid profile', async () => {
  const firestore = testEnvironment.authenticatedContext('user-a').firestore();
  const profile = {
    uid: 'user-a',
    email: 'user-a@example.com',
    displayName: 'User A',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await assertSucceeds(setDoc(doc(firestore, 'users', 'user-a'), profile));
  await assertFails(setDoc(doc(firestore, 'users', 'user-b'), profile));
});
