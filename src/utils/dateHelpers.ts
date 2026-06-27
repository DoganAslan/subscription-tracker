export const parseSafeDate = (val: string | Date | number | any): Date => {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (typeof val?.toDate === 'function') return val.toDate(); // Firestore Timestamp support
  if (typeof val === 'number') return new Date(val);
  
  // Safari Web Trap Fix: Ensure ISO-8601 'T' format instead of space
  const safeString = String(val).replace(' ', 'T');
  const parsed = new Date(safeString);
  
  // Fallback if parsing fails
  if (isNaN(parsed.getTime())) return new Date();
  return parsed;
};

export const getMidnight = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const calculateDaysLeft = (targetDate: Date, baseDate: Date = new Date()): number => {
  // DST & Midnight Drift Normalization
  const targetMidnight = getMidnight(targetDate);
  const baseMidnight = getMidnight(baseDate);
  
  const diffTime = targetMidnight.getTime() - baseMidnight.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

export const addMonthsClamped = (date: Date, monthsToAdd: number, originalDay: number): Date => {
  const d = new Date(date);
  const expectedMonth = d.getMonth() + monthsToAdd;
  
  // Move to the 1st day of the target month safely
  d.setMonth(expectedMonth, 1);
  
  // Find the last valid day of that specific target month
  const lastValidDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  
  // Month-End Clamping: Prevent Feb 31st rolling into March 3rd
  d.setDate(Math.min(originalDay, lastValidDay));
  return d;
};
