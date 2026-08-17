// src/utils/cancelAssist.ts
import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform } from 'react-native';

export interface CancelGuide {
  serviceId: string;
  name: string;
  cancelUrl: string;
  stepsEn: string[];
  stepsTr: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const CANCEL_GUIDES: Record<string, CancelGuide> = {
  netflix: {
    serviceId: 'netflix',
    name: 'Netflix',
    cancelUrl: 'https://www.netflix.com/youraccount',
    stepsEn: [
      'Click "Open Direct Cancellation Page" below.',
      'Log into your Netflix account if prompted.',
      'Under the "Membership & Billing" section, click "Cancel Membership".',
      'Click "Finish Cancellation" to confirm.'
    ],
    stepsTr: [
      'Aşağıdaki "Doğrudan İptal Sayfasına Git" butonuna tıklayın.',
      'İstendiğinde Netflix hesabınıza giriş yapın.',
      '"Üyelik ve Faturalama" bölümünün altındaki "Üyeliği İptal Et" butonuna tıklayın.',
      'İptal işlemini onaylamak için "İptal İşlemini Tamamla" butonuna basın.'
    ],
    difficulty: 'Easy'
  },
  spotify: {
    serviceId: 'spotify',
    name: 'Spotify',
    cancelUrl: 'https://www.spotify.com/account/overview/',
    stepsEn: [
      'Open the Spotify account page.',
      'Scroll down to "Your plan" and click "Change plan".',
      'Scroll down to "Cancel Spotify" and click "Cancel Premium".',
      'Follow the prompts until you see the confirmation message.'
    ],
    stepsTr: [
      'Spotify hesap sayfasını açın.',
      '"Planınız" bölümüne kaydırın ve "Planı değiştir" seçeneğine tıklayın.',
      '"Spotify\'ı İptal Et" başlığı altındaki "Premium\'u İptal Et" butonuna tıklayın.',
      'Onay mesajını görene kadar adımları takip edin.'
    ],
    difficulty: 'Easy'
  },
  youtube: {
    serviceId: 'youtube',
    name: 'YouTube Premium',
    cancelUrl: 'https://www.youtube.com/paid_memberships',
    stepsEn: [
      'Go to YouTube Paid Memberships.',
      'Click "Manage membership" next to YouTube Premium.',
      'Click "Deactivate" and select "Continue to Cancel".',
      'Select a reason and confirm cancellation.'
    ],
    stepsTr: [
      'YouTube Ücretli Üyelikler sayfasına gidin.',
      'YouTube Premium yanındaki "Üyeliği Yönet" butonuna tıklayın.',
      '"Devre Dışı Bırak" ve ardından "İptal Etmeye Devam Et" seçeneğini tıklayın.',
      'İptal nedenini seçip işlemi onaylayın.'
    ],
    difficulty: 'Easy'
  },
  apple: {
    serviceId: 'apple',
    name: 'Apple / iCloud / App Store',
    cancelUrl: 'https://support.apple.com/HT202039',
    stepsEn: [
      'Open iPhone Settings > Tap your Name > Subscriptions.',
      'Select the subscription you want to cancel.',
      'Tap "Cancel Subscription" and confirm.'
    ],
    stepsTr: [
      'iPhone Ayarlar > Adınız > Abonelikler bölümünü açın.',
      'İptal etmek istediğiniz aboneliği seçin.',
      '"Aboneliği İptal Et" seçeneğine dokunun ve onaylayın.'
    ],
    difficulty: 'Easy'
  },
  google: {
    serviceId: 'google',
    name: 'Google One / Play Store',
    cancelUrl: 'https://play.google.com/store/account/subscriptions',
    stepsEn: [
      'Go to Google Play Subscriptions page.',
      'Select the subscription you want to cancel.',
      'Click "Cancel subscription" and follow on-screen instructions.'
    ],
    stepsTr: [
      'Google Play Abonelikler sayfasına gidin.',
      'İptal etmek istediğiniz aboneliği seçin.',
      '"Aboneliği iptal et" butonuna tıklayın ve talimatları takip edin.'
    ],
    difficulty: 'Easy'
  },
  disney: {
    serviceId: 'disney',
    name: 'Disney+',
    cancelUrl: 'https://www.disneyplus.com/account',
    stepsEn: [
      'Log into Disney+ account on browser.',
      'Select your Profile > Account.',
      'Under Subscription, select your plan.',
      'Click "Cancel Subscription" and select a reason.'
    ],
    stepsTr: [
      'Tarayıcıda Disney+ hesabınıza giriş yapın.',
      'Profiliniz > Hesap bölümünü seçin.',
      'Abonelik başlığı altından planınızı seçin.',
      '"Aboneliği İptal Et" butonuna basarak nedeni onaylayın.'
    ],
    difficulty: 'Easy'
  },
  amazon: {
    serviceId: 'amazon',
    name: 'Amazon Prime',
    cancelUrl: 'https://www.amazon.com/mc/manage',
    stepsEn: [
      'Go to Manage Prime Membership page.',
      'Click "Update, cancel and more" under Prime Membership.',
      'Click "End Membership" and confirm.'
    ],
    stepsTr: [
      'Prime Üyeliğini Yönet sayfasına gidin.',
      '"Üyeliği Güncelle, İptal Et ve Daha Fazlası" seçeneğine tıklayın.',
      '"Üyeliği Sonlandır" butonuna basıp onaylayın.'
    ],
    difficulty: 'Medium'
  },
  chatgpt: {
    serviceId: 'chatgpt',
    name: 'ChatGPT / OpenAI',
    cancelUrl: 'https://chatgpt.com/#settings/Subscription',
    stepsEn: [
      'Log into ChatGPT.',
      'Click your Profile icon (bottom left) > Settings.',
      'Go to "Subscription" > "Manage my subscription".',
      'Click "Cancel Plan" on the Stripe portal.'
    ],
    stepsTr: [
      'ChatGPT hesabınıza giriş yapın.',
      'Sol alttaki Profil ikonuna > Ayarlar seçeneğine tıklayın.',
      '"Abonelik" > "Aboneliğimi Yönet" butonuna basın.',
      'Açılan Stripe ekranında "Planı İptal Et" seçeneğini onaylayın.'
    ],
    difficulty: 'Easy'
  },
  adobe: {
    serviceId: 'adobe',
    name: 'Adobe Creative Cloud',
    cancelUrl: 'https://account.adobe.com/plans',
    stepsEn: [
      'Go to Adobe Account Plans page.',
      'Click "Manage plan" on the plan you want to cancel.',
      'Click "Cancel your plan" and choose your reason.',
      'Review cancellation terms and finish.'
    ],
    stepsTr: [
      'Adobe Hesap Planları sayfasına gidin.',
      'İptal etmek istediğiniz plan için "Planı Yönet" butonuna tıklayın.',
      '"Planınızı iptal edin" seçeneğini seçin ve nedene tıklayın.',
      'İptal şartlarını gözden geçirip işlemi tamamlayın.'
    ],
    difficulty: 'Medium'
  },
  exxen: {
    serviceId: 'exxen',
    name: 'Exxen',
    cancelUrl: 'https://www.exxen.com/tr/account',
    stepsEn: [
      'Log into Exxen account.',
      'Go to My Account > Membership Details.',
      'Click "Cancel My Membership" and confirm.'
    ],
    stepsTr: [
      'Exxen hesabınıza giriş yapın.',
      'Hesabım > Üyelik Bilgilerim bölümüne gidin.',
      '"Üyeliğimi İptal Et" butonuna tıklayıp onaylayın.'
    ],
    difficulty: 'Easy'
  },
  blutv: {
    serviceId: 'blutv',
    name: 'BluTV',
    cancelUrl: 'https://www.blutv.com/hesabim',
    stepsEn: [
      'Log into BluTV.',
      'Go to My Account > Subscription Status.',
      'Click "Cancel Subscription" and complete instructions.'
    ],
    stepsTr: [
      'BluTV hesabınıza giriş yapın.',
      'Hesabım > Abonelik Durumu bölümüne gidin.',
      '"Aboneliğimi İptal Et" butonuna tıklayıp adımları tamamlayın.'
    ],
    difficulty: 'Easy'
  }
};

export function getCancellationGuide(subName: string, customUrl?: string): CancelGuide {
  const normalized = (subName || '').toLowerCase().trim();

  for (const key of Object.keys(CANCEL_GUIDES)) {
    if (normalized.includes(key) || CANCEL_GUIDES[key].name.toLowerCase().includes(normalized)) {
      const guide = { ...CANCEL_GUIDES[key] };
      if (customUrl) guide.cancelUrl = customUrl;
      return guide;
    }
  }

  // Generic fallback guide
  return {
    serviceId: 'generic',
    name: subName || 'Subscription',
    cancelUrl: customUrl || `https://www.google.com/search?q=${encodeURIComponent('how to cancel ' + subName)}`,
    stepsEn: [
      'Click "Open Direct Cancellation Page" below.',
      `Search or navigate to Billing / Account Settings in ${subName}.`,
      'Locate "Cancel Subscription" or "Disable Auto-Renewal".',
      'Confirm cancellation and save your updated status.'
    ],
    stepsTr: [
      'Aşağıdaki "Doğrudan İptal Sayfasına Git" butonuna tıklayın.',
      `${subName} hesabınızda Faturalama / Hesap Ayarları bölümüne gidin.`,
      '"Aboneliği İptal Et" veya "Otomatik Yenilemeyi Kapat" seçeneğini bulun.',
      'İptali onaylayın ve kalan günlerinizin tadını çıkarın.'
    ],
    difficulty: 'Easy'
  };
}

export async function openCancellationUrl(url: string): Promise<void> {
  if (!url) return;
  try {
    if (Platform.OS !== 'web' && await WebBrowser.openBrowserAsync(url)) {
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    console.error('Failed to open URL:', error);
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.error('Fallback openURL failed:', e);
    }
  }
}
