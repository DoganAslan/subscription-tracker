// src/services/ai/dealFinder.ts
import { Subscription } from '../firebase/types';

export interface DealOpportunity {
  id: string;
  type: 'family' | 'bundle' | 'student';
  badge: string;
  title: string;
  subtitle: string;
  originalMonthly: number;
  potentialMonthlyPerPerson: number;
  yearlySavingsPerPerson: number;
  currency: string;
  actionGuide: string[];
}

export function findDealOpportunities(subscriptions: Subscription[], baseCurrency: string = 'TRY', isTurkish: boolean = true): DealOpportunity[] {
  const deals: DealOpportunity[] = [];
  if (!subscriptions || subscriptions.length === 0) return deals;

  const activeSubs = subscriptions.filter(s => s.status !== 'paused');

  // 1. Spotify Family Plan Check
  const spotifySub = activeSubs.find(s => s.name.toLowerCase().includes('spotify'));
  if (spotifySub) {
    const orig = spotifySub.amount || 59.99;
    const familyTotal = 99.99; // 6 members
    const perPersonMonthly = familyTotal / 6;
    const yearlySavings = Math.max(0, (orig - perPersonMonthly) * 12);

    deals.push({
      id: 'deal-spotify-family',
      type: 'family',
      badge: isTurkish ? 'Aile Planı Fırsatı' : 'Family Plan Savings',
      title: isTurkish ? 'Spotify Aile Planına Geçiş' : 'Switch to Spotify Family',
      subtitle: isTurkish
        ? '6 kişiye kadar üyelik imkanı ile kişi başı maliyeti düşürün.'
        : 'Share with up to 6 members to slash individual cost.',
      originalMonthly: orig,
      potentialMonthlyPerPerson: Number(perPersonMonthly.toFixed(2)),
      yearlySavingsPerPerson: Number(yearlySavings.toFixed(0)),
      currency: spotifySub.currency || baseCurrency,
      actionGuide: isTurkish ? [
        '1. Spotify hesabınıza tarayıcıdan giriş yapın.',
        '2. Plan Değiştir seçeneğinden "Family" paketini seçin.',
        '3. 5 aile bireyinizi veya arkadaşınızı davet linki ile ekleyin.'
      ] : [
        '1. Log into your Spotify account in browser.',
        '2. Select "Change Plan" and pick Spotify Family.',
        '3. Invite 5 family members or friends via invite link.'
      ]
    });
  }

  // 2. YouTube Premium Family Check
  const ytSub = activeSubs.find(s => s.name.toLowerCase().includes('youtube'));
  if (ytSub) {
    const orig = ytSub.amount || 57.99;
    const familyTotal = 115.99; // 5 members
    const perPersonMonthly = familyTotal / 5;
    const yearlySavings = Math.max(0, (orig - perPersonMonthly) * 12);

    deals.push({
      id: 'deal-yt-family',
      type: 'family',
      badge: isTurkish ? 'Youtube Aile Fırsatı' : 'YouTube Family Savings',
      title: isTurkish ? 'YouTube Premium Aile Paketi' : 'YouTube Premium Family Plan',
      subtitle: isTurkish
        ? '5 aile üyesiyle reklamsız YouTube & YouTube Music keyfi.'
        : 'Ad-free YouTube & Music for up to 5 family members.',
      originalMonthly: orig,
      potentialMonthlyPerPerson: Number(perPersonMonthly.toFixed(2)),
      yearlySavingsPerPerson: Number(yearlySavings.toFixed(0)),
      currency: ytSub.currency || baseCurrency,
      actionGuide: isTurkish ? [
        '1. YouTube.com/premium adresine gidin.',
        '2. "Aile Planı" seçeneğini tıklayın.',
        '3. Google Aile Grubu oluşturup üyeleri ekleyin.'
      ] : [
        '1. Visit youtube.com/premium.',
        '2. Click "Family Plan".',
        '3. Create Google Family Group and send invitations.'
      ]
    });
  }

  // 3. Apple One Bundle Check
  const appleSubs = activeSubs.filter(s => 
    s.name.toLowerCase().includes('apple') || 
    s.name.toLowerCase().includes('icloud') || 
    s.name.toLowerCase().includes('tv+')
  );

  if (appleSubs.length >= 2) {
    const totalAppleSpend = appleSubs.reduce((acc, curr) => acc + curr.amount, 0);
    const appleOnePrice = 129.99;
    const yearlySavings = Math.max(0, (totalAppleSpend - appleOnePrice) * 12);

    deals.push({
      id: 'deal-apple-one',
      type: 'bundle',
      badge: isTurkish ? 'Apple One Hepsi Bir Arada' : 'Apple One All-in-One',
      title: isTurkish ? 'Apple One Paketine Geçin' : 'Upgrade to Apple One Bundle',
      subtitle: isTurkish
        ? 'Apple Music, Apple TV+, iCloud+ ve Arcade servisini tek pakette toplayın.'
        : 'Bundle Apple Music, Apple TV+, iCloud+, and Arcade in one sub.',
      originalMonthly: totalAppleSpend,
      potentialMonthlyPerPerson: appleOnePrice,
      yearlySavingsPerPerson: Number(yearlySavings.toFixed(0)),
      currency: baseCurrency,
      actionGuide: isTurkish ? [
        '1. iPhone Ayarlar > Apple Hesabı bölümüne gidin.',
        '2. Abonelikler > Apple One sekmesine dokunun.',
        '3. Bireysel veya Aile paketini seçerek onaylayın.'
      ] : [
        '1. Go to iPhone Settings > Apple Account.',
        '2. Tap Subscriptions > Apple One.',
        '3. Select Individual or Family bundle.'
      ]
    });
  }

  // 4. Student Plan Opportunities
  const studentEligible = activeSubs.filter(s => {
    const n = s.name.toLowerCase();
    return n.includes('spotify') || n.includes('apple music') || n.includes('youtube') || n.includes('prime');
  });

  if (studentEligible.length > 0) {
    const sample = studentEligible[0];
    const studentPrice = sample.amount * 0.5; // ~50% student discount
    const yearlySavings = (sample.amount - studentPrice) * 12;

    deals.push({
      id: 'deal-student-discount',
      type: 'student',
      badge: isTurkish ? '%50 Öğrenci İndirimi' : '50% Student Discount',
      title: isTurkish ? `${sample.name} Öğrenci Planı` : `${sample.name} Student Discount`,
      subtitle: isTurkish
        ? 'Öğrenci e-postası (SheerID) ile yarı fiyatına kullanabilirsiniz.'
        : 'Verify student status via SheerID to pay half price.',
      originalMonthly: sample.amount,
      potentialMonthlyPerPerson: Number(studentPrice.toFixed(2)),
      yearlySavingsPerPerson: Number(yearlySavings.toFixed(0)),
      currency: sample.currency || baseCurrency,
      actionGuide: isTurkish ? [
        '1. İlgili servisin hesap ayarlarına gidin.',
        '2. "Öğrenci İndirimi" seçeneğini seçin.',
        '3. Üniversite e-postanız (.edu.tr) ile SheerID doğrulamasını tamamlayın.'
      ] : [
        '1. Go to account settings of the platform.',
        '2. Choose Student Discount.',
        '3. Complete SheerID verification with your student email.'
      ]
    });
  }

  return deals;
}
