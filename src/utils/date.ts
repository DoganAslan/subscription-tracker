export type DoomSeverity = 'none' | 'warning' | 'critical' | 'expired';

export interface DoomStatus {
  subId: string;
  subName: string;
  daysLeft: number;
  severity: DoomSeverity;
  formattedDate: string;
}

export const calculateDoomStatus = (contractEndDate?: string | Date | null): { daysLeft: number; severity: DoomSeverity } => {
  if (!contractEndDate) return { daysLeft: 999, severity: 'none' };

  const end = new Date(contractEndDate).getTime();
  const now = new Date().getTime();
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { daysLeft: diffDays, severity: 'expired' };
  if (diffDays <= 7) return { daysLeft: diffDays, severity: 'critical' };
  if (diffDays <= 30) return { daysLeft: diffDays, severity: 'warning' };
  
  return { daysLeft: diffDays, severity: 'none' };
};

export const getTrialHoursLeft = (trialEndDate?: string | Date | null): number => {
  if (!trialEndDate) return 999;
  const end = new Date(trialEndDate).getTime();
  const now = new Date().getTime();
  const diffMs = end - now;
  return Math.floor(diffMs / (1000 * 60 * 60)); // Exact integer hours left
};
