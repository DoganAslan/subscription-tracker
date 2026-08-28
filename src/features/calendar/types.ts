import type { Subscription } from '@/services/firebase/types';

export type CalendarPayment = {
  subscription: Subscription;
  dueDate: Date;
  amountInBaseCurrency: number;
};

export type CalendarViewModel = {
  year: number;
  monthIndex: number;
  calendarDays: (number | null)[];
  paymentCountByDay: Map<number, number>;
  monthlyTotal: number;
  activeCount: number;
  dailyPayments: CalendarPayment[];
};
