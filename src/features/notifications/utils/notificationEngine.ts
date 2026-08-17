import { Subscription } from '@/services/firebase/types';
import { parseSafeDate, calculateDaysLeft } from '@/utils/dateHelpers';

export interface Alert {
  id: string;
  title: string;
  body: string;
  isShared: boolean;
  subscriptionName: string;
}

export function getUpcomingAlerts(subscriptions: Subscription[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  for (const sub of subscriptions) {
    if (!sub.renewalDate) continue;

    const renewDate = parseSafeDate(sub.renewalDate);
    const daysUntil = calculateDaysLeft(renewDate, now);

    if (daysUntil === 1) {
      alerts.push({
        id: sub.id as string,
        subscriptionName: sub.name,
        title: "Upcoming Payment: " + sub.name,
        body: "Your subscription for " + sub.name + " (" + sub.amount + " " + (sub.currency || 'TRY') + ") is renewing tomorrow.",
        isShared: !!sub.isSplit
      });
    }
  }

  return alerts;
}


