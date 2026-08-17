import { Subscription } from '@/services/firebase/types';

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  icon?: string;
  color?: string;
  progress?: number;
  unlocked: boolean;
  xpValue: number;
}

export interface UserGamificationSummary {
  level: number;
  levelTitle: string;
  totalXp: number;
  xpForNextLevel: number;
  unlockedBadgesCount: number;
  totalBadgesCount: number;
  badges: BadgeItem[];
}

export function calculateUserBadges(subscriptions: Subscription[]): UserGamificationSummary {
  const activeSubs = subscriptions.filter(s => s.status !== 'paused');
  const pausedSubs = subscriptions.filter(s => s.status === 'paused');
  const trialSubs = subscriptions.filter(s => s.isTrial);
  const splitSubs = subscriptions.filter(s => s.isSplit || (s.splitMembers && s.splitMembers.length > 0));
  const cardLinkedSubs = subscriptions.filter(s => !!s.cardId);

  const badges: BadgeItem[] = [
    {
      id: 'detox_master',
      title: 'Abonelik Detoksu Şampiyonu',
      description: 'Gereksiz en az 1 aboneliği dondurarak tasarruf başlattınız.',
      iconName: 'pause-circle',
      icon: 'pause-circle',
      color: '#EF4444',
      unlocked: pausedSubs.length > 0,
      xpValue: 150,
      progress: pausedSubs.length > 0 ? 100 : 0,
    },
    {
      id: 'trial_shield',
      title: 'Ücretsiz Deneme Muhafızı',
      description: 'En az 1 ücretsiz denemeyi takibe alıp kalkan açtınız.',
      iconName: 'shield-checkmark',
      icon: 'shield-checkmark',
      color: '#3B82F6',
      unlocked: trialSubs.length > 0,
      xpValue: 100,
      progress: trialSubs.length > 0 ? 100 : 0,
    },
    {
      id: 'smart_splitter',
      title: 'Akıllı Paylaşımcı',
      description: 'Abonelik faturasını arkadaşlarınızla bölüşerek tasarruf sağladınız.',
      iconName: 'people',
      icon: 'people',
      color: '#10B981',
      unlocked: splitSubs.length > 0,
      xpValue: 200,
      progress: splitSubs.length > 0 ? 100 : 0,
    },
    {
      id: 'card_vault',
      title: 'Ödeme Kasası Ustası',
      description: 'Aboneliklerinize ödeme kartı tanımlayıp limit takibini aktif ettiniz.',
      iconName: 'card',
      icon: 'card',
      color: '#8B5CF6',
      unlocked: cardLinkedSubs.length > 0,
      xpValue: 120,
      progress: cardLinkedSubs.length > 0 ? 100 : 0,
    },
    {
      id: 'budget_guru',
      title: 'Bütçe Gurusu',
      description: '5 veya daha fazla aboneliği tek noktadan eksiksiz yönetiyorsunuz.',
      iconName: 'trophy',
      icon: 'trophy',
      color: '#F59E0B',
      unlocked: activeSubs.length >= 5,
      xpValue: 250,
      progress: Math.min(100, (activeSubs.length / 5) * 100),
    },
  ];

  let totalXp = 0;
  let unlockedCount = 0;

  for (const b of badges) {
    if (b.unlocked) {
      totalXp += b.xpValue;
      unlockedCount++;
    }
  }

  let level = 1;
  let levelTitle = 'Finansal Çırak';
  if (totalXp >= 600) {
    level = 4;
    levelTitle = 'Finansal Efsane';
  } else if (totalXp >= 400) {
    level = 3;
    levelTitle = 'Bütçe Mimarı';
  } else if (totalXp >= 200) {
    level = 2;
    levelTitle = 'Tasarruf Ustası';
  }

  return {
    level,
    levelTitle,
    totalXp,
    xpForNextLevel: level * 250,
    unlockedBadgesCount: unlockedCount,
    totalBadgesCount: badges.length,
    badges,
  };
}

export function evaluateUserBadges(subscriptions: Subscription[], _isTurkish: boolean = true): BadgeItem[] {
  return calculateUserBadges(subscriptions).badges;
}
