import { SubscriptionService } from '@/services/firebase/firestore';
import { testSubscriptions } from './seedData';
import { Timestamp } from 'firebase/firestore';

export const seedSubscriptions = async (userId: string) => {
  if (!__DEV__) {
    throw new Error("SECURITY VIOLATION: Seed scripts cannot be run in production.");
  }

  console.log('Seeding database for user:', userId);
  
  let successCount = 0;
  
  for (const sub of testSubscriptions) {
    try {
      const randomDays = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() + randomDays);
      
      const payload = {
        ...sub,
        billingCycle: sub.billingCycle as 'weekly' | 'monthly' | 'yearly',
        renewalDate: Timestamp.fromDate(date),
      };
      
      await SubscriptionService.addSubscription(userId, payload);
      successCount++;
    } catch (error) {
      console.error('Failed to seed:', sub.name, error);
    }
  }
  
  console.log(`Successfully seeded ${successCount} subscriptions!`);
  return successCount;
};
