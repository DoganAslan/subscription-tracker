import { Subscription } from '@/services/firebase/types';

export interface SmartAlternative {
  triggerBrand: string;
  suggestedBrand: string;
  reason: string;
  translationKey: string;
  estimatedSavingsPercentage: number;
}

export const ALTERNATIVES_DB: SmartAlternative[] = [
  {
    triggerBrand: 'spotify',
    suggestedBrand: 'YouTube Premium',
    reason: 'YouTube Premium aldığınızda sadece reklamsız video izlemekle kalmaz, aynı zamanda "YouTube Music" servisine de ücretsiz erişirsiniz. Müzik için ayrı para ödemenize gerek kalmaz.',
    translationKey: 'altReason_spotify',
    estimatedSavingsPercentage: 100, // 100% savings on the music service if bundled
  },
  {
    triggerBrand: 'netflix',
    suggestedBrand: 'Amazon Prime',
    reason: 'Netflix aboneliği son zamanlarda oldukça pahalı. Çok daha uygun fiyata Amazon Prime alarak hem Prime Video içeriklerine erişebilir hem de bedava kargo fırsatlarından yararlanabilirsiniz.',
    translationKey: 'altReason_netflix',
    estimatedSavingsPercentage: 70, 
  },
  {
    triggerBrand: 'chatgpt',
    suggestedBrand: 'Claude / Gemini',
    reason: 'ChatGPT Plus yerine, genellikle daha geniş ücretsiz kullanım sunan Claude 3.5 Sonnet veya Google Gemini (ücretsiz sürüm) kullanarak AI masraflarınızı sıfırlayabilirsiniz.',
    translationKey: 'altReason_chatgpt',
    estimatedSavingsPercentage: 100,
  },
  {
    triggerBrand: 'adobe',
    suggestedBrand: 'Canva / Affinity',
    reason: 'Adobe Creative Cloud aboneliği uzun vadede çok yüksek maliyetlidir. Tasarım ihtiyaçlarınız için Affinity Suite (tek seferlik ödeme) veya Canva (çok daha ucuz) alternatiflerini değerlendirebilirsiniz.',
    translationKey: 'altReason_adobe',
    estimatedSavingsPercentage: 80,
  },
  {
    triggerBrand: 'exxen',
    suggestedBrand: 'BluTV / Tod',
    reason: 'Eğer Exxen\'i sadece belirli yerli diziler için alıyorsanız, BluTV veya TOD gibi kampanyası bol alternatiflerde daha fazla içerik ve film bulabilirsiniz.',
    translationKey: 'altReason_exxen',
    estimatedSavingsPercentage: 40,
  },
  {
    triggerBrand: 'midjourney',
    suggestedBrand: 'Leonardo AI',
    reason: 'Midjourney aboneliği yerine, her gün ücretsiz jeton veren Leonardo AI kullanarak görsel üretim ihtiyaçlarınızı ücretsiz olarak karşılayabilirsiniz.',
    translationKey: 'altReason_midjourney',
    estimatedSavingsPercentage: 100,
  }
];

export interface RecommendedTip {
  subscriptionName: string;
  tip: SmartAlternative;
}

export const getSmartAlternatives = (subscriptions: Subscription[]): RecommendedTip[] => {
  if (!subscriptions || subscriptions.length === 0) return [];
  
  const tips: RecommendedTip[] = [];
  
  // Track suggested brands so we don't suggest YouTube Premium multiple times
  const alreadySuggested = new Set<string>();

  subscriptions.forEach(sub => {
    if (sub.status === 'paused') return;
    
    const subNameLower = sub.name.toLowerCase();
    
    for (const alt of ALTERNATIVES_DB) {
      if (subNameLower.includes(alt.triggerBrand)) {
        // Prevent duplicate suggestions
        if (!alreadySuggested.has(alt.suggestedBrand)) {
          tips.push({
            subscriptionName: sub.name,
            tip: alt
          });
          alreadySuggested.add(alt.suggestedBrand);
        }
      }
    }
  });

  return tips;
};

export interface BundleTip {
  triggerBrands: string[]; // e.g. ['hulu', 'disney+']
  suggestedBundle: string; // e.g. 'Disney Bundle'
  reason: string;
  translationKey: string;
}

export const BUNDLE_DB: BundleTip[] = [
  {
    triggerBrands: ['hulu', 'disney'],
    suggestedBundle: 'Disney Bundle',
    reason: 'You are paying for Hulu and Disney+ separately! If you switch to the Disney Bundle, you can save significant money every month.',
    translationKey: 'bundle_disney',
  },
  {
    triggerBrands: ['apple music', 'apple tv'],
    suggestedBundle: 'Apple One',
    reason: 'You have multiple Apple subscriptions. Upgrading to Apple One bundles Music, TV+, Arcade, and iCloud+ for a much lower combined price.',
    translationKey: 'bundle_apple',
  }
];

export const getBundleTips = (subscriptions: Subscription[]): BundleTip[] => {
  if (!subscriptions || subscriptions.length === 0) return [];
  
  const activeSubNames = subscriptions
    .filter(s => s.status !== 'paused')
    .map(s => s.name.toLowerCase());
    
  const suggestedBundles: BundleTip[] = [];
  
  for (const bundle of BUNDLE_DB) {
    // Check if ALL trigger brands are found in the active subscriptions
    const hasAllTriggers = bundle.triggerBrands.every(brand => 
      activeSubNames.some(subName => subName.includes(brand))
    );
    
    if (hasAllTriggers) {
      suggestedBundles.push(bundle);
    }
  }
  
  return suggestedBundles;
};



