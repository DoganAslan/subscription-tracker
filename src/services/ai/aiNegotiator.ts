// src/services/ai/aiNegotiator.ts
import { Subscription } from '@/services/firebase/types';

export interface NegotiationScript {
  serviceName: string;
  openingPitch: string;
  keyArguments: string[];
  retentionOfferTarget: string;
  copyableMessage: string;
}

export function generateAiNegotiationScript(
  subscription: Subscription,
  isTurkish: boolean = true
): NegotiationScript {
  const name = subscription?.name || 'Abonelik';
  const amount = subscription?.amount || 0;
  const currency = subscription?.currency || 'TRY';

  if (isTurkish) {
    const copyableMessage = `Merhaba ${name} Destek Ekibi,\n\n` +
      `Uzun süredir ${name} kullanıcısıyım (${amount} ${currency}/ay). Ancak mevcut bütçe planlamam nedeniyle fiyatı yüksek buluyorum.\n\n` +
      `Aboneliğimi sonlandırmadan önce tarafıma sunabileceğiniz özel bir sadakat/kalma indirimi veya yıllık avantajlı paket fırsatı bulunuyor mu?\n\n` +
      `Desteğinizi rica ederim.`;

    return {
      serviceName: name,
      openingPitch: `Uzun süreli ${name} müşterisi olduğunuzu belirterek bütçenizin zorlandığını ifade edin.`,
      keyArguments: [
        'Uzun süreli sadık müşteri geçmişi',
        'Rakip platformların daha uygun fiyatlı alternatifleri',
        'Taahhüt yenileme veya yıllık pakete geçiş karşılığı indirim talebi',
      ],
      retentionOfferTarget: `Mevcut tutarda ortalama %20-%40 sadakat indirimi veya 2 ay ücretsiz kullanım.`,
      copyableMessage,
    };
  }

  const copyableMessage = `Hello ${name} Support Team,\n\n` +
    `I have been a loyal ${name} subscriber (${amount} ${currency}/mo). However, I am reviewing my monthly budget and considering cancelling due to cost.\n\n` +
    `Before I proceed with cancellation, are there any retention discounts or promotional rates available for my account?\n\n` +
    `Thank you for your assistance.`;

  return {
    serviceName: name,
    openingPitch: `Politely inform ${name} support that you are considering cancelling due to price.`,
    keyArguments: [
      'Loyal subscriber tenure',
      'Competing lower-priced services',
      'Willingness to commit to longer retention for a discount',
    ],
    retentionOfferTarget: `Targeting 20%-40% retention discount or promotional credit.`,
    copyableMessage,
  };
}
