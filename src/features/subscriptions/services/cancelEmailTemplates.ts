// src/features/subscriptions/services/cancelEmailTemplates.ts

export interface CancellationEmailTemplate {
  serviceName: string;
  supportEmail: string;
  subject: string;
  body: string;
}

export function generateCancellationEmailTemplate(
  serviceName: string,
  userEmail?: string,
  accountName?: string,
  isTurkish: boolean = true
): CancellationEmailTemplate {
  const cleanName = serviceName.trim();
  const userName = accountName || 'Sayın Yetkili';

  if (isTurkish) {
    return {
      serviceName: cleanName,
      supportEmail: `destek@${cleanName.toLowerCase().replace(/\s+/g, '')}.com`,
      subject: `Abonelik İptal Talebi - ${cleanName}`,
      body: `Merhaba ${cleanName} Destek Ekibi,\n\n` +
        `Hesabıma ait ${cleanName} aboneliğimin yenilenmesini durdurarak iptal edilmesini talep ediyorum.\n\n` +
        `Kayıtlı E-posta: ${userEmail || '[E-postanız]'}\n` +
        `Kayıtlı İsim: ${userName}\n\n` +
        `İptal işleminin onaylandığına dair bilgilendirme yapılmasını rica ederim.\n\nTeşekkürler.`,
    };
  }

  return {
    serviceName: cleanName,
    supportEmail: `support@${cleanName.toLowerCase().replace(/\s+/g, '')}.com`,
    subject: `Subscription Cancellation Request - ${cleanName}`,
    body: `Hello ${cleanName} Support Team,\n\n` +
      `I am writing to formally request the immediate cancellation of my ${cleanName} subscription.\n\n` +
      `Account Email: ${userEmail || '[Your Email]'}\n` +
      `Account Holder: ${userName}\n\n` +
      `Please confirm via email once the cancellation is processed.\n\nThank you.`,
  };
}
