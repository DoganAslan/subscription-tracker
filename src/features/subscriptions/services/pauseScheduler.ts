// src/features/subscriptions/services/pauseScheduler.ts
import { Subscription } from '@/services/firebase/types';

export interface PauseScheduleStatus {
  isScheduled: boolean;
  isCurrentlyPaused: boolean;
  startDateFormatted: string;
  endDateFormatted: string;
  daysRemaining: number;
}

export function evaluatePauseSchedule(sub: Subscription, isTurkish: boolean = true): PauseScheduleStatus {
  if (!sub) {
    return { isScheduled: false, isCurrentlyPaused: false, startDateFormatted: '--', endDateFormatted: '--', daysRemaining: 0 };
  }

  const now = new Date();
  const isPaused = sub.status === 'paused';

  let startDate: Date | null = null;
  if (sub.pauseStartDate) {
    startDate = new Date(sub.pauseStartDate);
  }

  let endDate: Date | null = null;
  if (sub.pauseEndDate) {
    if (typeof (sub.pauseEndDate as any)?.toDate === 'function') {
      endDate = (sub.pauseEndDate as any).toDate();
    } else {
      endDate = new Date(sub.pauseEndDate as string);
    }
  }

  const startDateFormatted = startDate && !isNaN(startDate.getTime())
    ? startDate.toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })
    : '--';

  const endDateFormatted = endDate && !isNaN(endDate.getTime())
    ? endDate.toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })
    : '--';

  let daysRemaining = 0;
  if (endDate && !isNaN(endDate.getTime())) {
    const diffTime = endDate.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  const isScheduled = Boolean(startDate || endDate);

  return {
    isScheduled,
    isCurrentlyPaused: isPaused,
    startDateFormatted,
    endDateFormatted,
    daysRemaining,
  };
}
