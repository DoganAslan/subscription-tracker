// src/features/wallet/services/goalPredictor.ts

export interface GoalEtaPrediction {
  monthsToGoal: number;
  estimatedCompletionDateFormatted: string;
  isAchievableInTargetDate: boolean;
}

export function predictGoalCompletionEta(
  targetAmount: number,
  currentAmount: number,
  monthlyContribution: number,
  isTurkish: boolean = true
): GoalEtaPrediction {
  const remaining = Math.max(0, targetAmount - currentAmount);
  if (remaining === 0) {
    return {
      monthsToGoal: 0,
      estimatedCompletionDateFormatted: isTurkish ? 'Tamamlandı 🎉' : 'Completed 🎉',
      isAchievableInTargetDate: true,
    };
  }

  if (monthlyContribution <= 0) {
    return {
      monthsToGoal: Infinity,
      estimatedCompletionDateFormatted: isTurkish ? 'Süresiz (Katkı Yok)' : 'Indefinite (No Contribution)',
      isAchievableInTargetDate: false,
    };
  }

  const monthsToGoal = Math.ceil(remaining / monthlyContribution);
  const completionDate = new Date();
  completionDate.setMonth(completionDate.getMonth() + monthsToGoal);

  const formatted = completionDate.toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  return {
    monthsToGoal,
    estimatedCompletionDateFormatted: formatted,
    isAchievableInTargetDate: true,
  };
}
