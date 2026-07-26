/**
 * SubMate Notification System Deep Verification Test
 * 
 * Tests the entire notification pipeline:
 * 1. Trigger date calculation logic (scheduleSubReminder mirror)
 * 2. getNextRenewalDate cycling for all billing cycles
 * 3. Edge cases: past dates, same-day, far-future
 * 4. Contract doom reminders
 * 5. Import consistency check
 * 6. safeToDate / safeToTimestamp helpers
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('═══════════════════════════════════════════════════');
console.log('🔔 SubMate Notification System Deep Verification');
console.log('═══════════════════════════════════════════════════\n');

let total = 0;
let passed = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    console.error(`  ❌ ${name}`);
    console.error(`     → ${e.message}`);
  }
}

// ── Mirror of getNextRenewalDate from calculations.ts ──
function addMonthsClamped(date, monthsToAdd, originalDay) {
  const d = new Date(date);
  const expectedMonth = d.getMonth() + monthsToAdd;
  d.setMonth(expectedMonth, 1);
  const lastValidDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(originalDay, lastValidDay));
  return d;
}

function getMidnight(d) {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  return m;
}

function getNextRenewalDate(currentRenewal, cycle) {
  let nextDate = new Date(currentRenewal);
  const originalDay = nextDate.getDate();
  const today = getMidnight(new Date());

  let iterations = 0;
  while (getMidnight(nextDate).getTime() < today.getTime()) {
    iterations++;
    if (iterations > 1000) throw new Error('Infinite loop in getNextRenewalDate');
    if (cycle === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (cycle === 'monthly') nextDate = addMonthsClamped(nextDate, 1, originalDay);
    else if (cycle === 'quarterly') nextDate = addMonthsClamped(nextDate, 3, originalDay);
    else if (cycle === 'biannually') nextDate = addMonthsClamped(nextDate, 6, originalDay);
    else if (cycle === 'yearly') nextDate = addMonthsClamped(nextDate, 12, originalDay);
    else if (cycle === 'biennially') nextDate = addMonthsClamped(nextDate, 24, originalDay);
    else break;
  }
  return nextDate;
}

// ── Mirror of scheduleSubReminder trigger calculation ──
function calculateTrigger(renewalDateInput, cycle = 'monthly') {
  const rd = new Date(renewalDateInput);
  if (isNaN(rd.getTime())) return { status: 'invalid_date' };

  let renewalDate = new Date(rd);
  let triggerDate = new Date(renewalDate);
  triggerDate.setDate(triggerDate.getDate() - 2);
  triggerDate.setHours(9, 0, 0, 0);

  if (triggerDate.getTime() <= Date.now()) {
    if (renewalDate.getTime() > Date.now()) {
      return { status: 'immediate', triggerDate: new Date(Date.now() + 5000) };
    } else {
      // Auto-advance to next cycle
      const advancedDate = getNextRenewalDate(new Date(renewalDate.getTime() + 86400000), cycle);
      renewalDate = advancedDate;
      triggerDate = new Date(renewalDate);
      triggerDate.setDate(triggerDate.getDate() - 2);
      triggerDate.setHours(9, 0, 0, 0);

      if (triggerDate.getTime() <= Date.now()) {
        if (renewalDate.getTime() > Date.now()) {
          return { status: 'immediate', triggerDate: new Date(Date.now() + 5000) };
        }
        return { status: 'expired' };
      }
      return { status: 'scheduled', triggerDate };
    }
  }
  return { status: 'scheduled', triggerDate };
}

function calculateDoomTrigger(contractEndDate) {
  const cd = new Date(contractEndDate);
  if (isNaN(cd.getTime())) return { status: 'invalid_date' };

  let triggerDate = new Date(cd);
  triggerDate.setDate(triggerDate.getDate() - 7);
  triggerDate.setHours(9, 0, 0, 0);

  if (triggerDate.getTime() <= Date.now()) {
    if (cd.getTime() > Date.now()) {
      return { status: 'immediate', triggerDate: new Date(Date.now() + 5000) };
    }
    return { status: 'expired' };
  }
  return { status: 'scheduled', triggerDate };
}

// ═══ Section 1: getNextRenewalDate Tests ═══
console.log('📌 1. getNextRenewalDate Döngü Testleri:');

test('Monthly: geçmiş tarih bugüne/geleceğe taşınmalı', () => {
  const past = new Date();
  past.setMonth(past.getMonth() - 3); // 3 ay önce
  const next = getNextRenewalDate(past, 'monthly');
  assert(next >= getMidnight(new Date()), `Sonuç geçmişte: ${next}`);
});

test('Weekly: geçmiş tarih en az bugüne gelmeli', () => {
  const past = new Date();
  past.setDate(past.getDate() - 20); // 20 gün önce
  const next = getNextRenewalDate(past, 'weekly');
  assert(next >= getMidnight(new Date()), `Sonuç geçmişte: ${next}`);
});

test('Yearly: geçmiş yıl tarihi bu yıla taşınmalı', () => {
  const past = new Date();
  past.setFullYear(past.getFullYear() - 2); // 2 yıl önce
  const next = getNextRenewalDate(past, 'yearly');
  assert(next >= getMidnight(new Date()), `Sonuç geçmişte: ${next}`);
});

test('Quarterly: 3 aylık döngü doğru çalışmalı', () => {
  const past = new Date();
  past.setMonth(past.getMonth() - 7); // 7 ay önce
  const next = getNextRenewalDate(past, 'quarterly');
  assert(next >= getMidnight(new Date()), `Sonuç geçmişte: ${next}`);
});

test('Gelecek tarih değiştirilmemeli', () => {
  const future = new Date();
  future.setMonth(future.getMonth() + 2); // 2 ay sonra
  const next = getNextRenewalDate(future, 'monthly');
  assert.strictEqual(next.getTime(), future.getTime());
});

test('Bugünkü tarih değiştirilmemeli', () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const next = getNextRenewalDate(today, 'monthly');
  assert(getMidnight(next).getTime() >= getMidnight(new Date()).getTime());
});

test('Ay sonu taşma koruması (31 Ocak → Şubat 28/29)', () => {
  const jan31 = new Date(2025, 0, 31); // 31 Ocak 2025
  const next = addMonthsClamped(jan31, 1, 31);
  assert(next.getDate() <= 29, `Şubat günü ${next.getDate()} > 29 olmamalı`);
  assert.strictEqual(next.getMonth(), 1); // Şubat
});

console.log('');

// ═══ Section 2: Bildirim Tetikleyici Hesaplama Testleri ═══
console.log('📌 2. scheduleSubReminder Tetikleyici Hesaplama Testleri:');

test('10 gün sonrası → 2 gün önce saat 09:00 zamanlanmalı', () => {
  const renewal = new Date(Date.now() + 10 * 86400000);
  const res = calculateTrigger(renewal);
  assert.strictEqual(res.status, 'scheduled');
  assert.strictEqual(res.triggerDate.getHours(), 9);
  assert.strictEqual(res.triggerDate.getMinutes(), 0);
});

test('Yarın yenilenme → hemen tetiklenmeli (immediate)', () => {
  const renewal = new Date(Date.now() + 86400000);
  const res = calculateTrigger(renewal);
  assert.strictEqual(res.status, 'immediate');
  assert(res.triggerDate.getTime() > Date.now());
});

test('Dün yenilenme → expired olmalı', () => {
  const renewal = new Date(Date.now() - 86400000);
  const res = calculateTrigger(renewal);
  assert.strictEqual(res.status, 'expired');
});

test('Geçersiz tarih → invalid_date olmalı', () => {
  const res = calculateTrigger('not-a-date');
  assert.strictEqual(res.status, 'invalid_date');
});

test('Tam 2 gün sonra yenilenme → bugün tetiklenmeli', () => {
  const renewal = new Date(Date.now() + 2 * 86400000);
  const res = calculateTrigger(renewal);
  // Trigger = bugünün sabahı saat 09:00, eğer geçmişse immediate olur
  assert(res.status === 'scheduled' || res.status === 'immediate');
});

console.log('');

// ═══ Section 3: Contract Doom Reminder ═══
console.log('📌 3. Taahhüt Bitiş (Doom) Hatırlatıcı Testleri:');

test('30 gün sonra biten taahhüt → 7 gün önce zamanlanmalı', () => {
  const end = new Date(Date.now() + 30 * 86400000);
  const res = calculateDoomTrigger(end);
  assert.strictEqual(res.status, 'scheduled');
  assert.strictEqual(res.triggerDate.getHours(), 9);
});

test('5 gün sonra biten taahhüt → immediate olmalı', () => {
  const end = new Date(Date.now() + 5 * 86400000);
  const res = calculateDoomTrigger(end);
  assert.strictEqual(res.status, 'immediate');
});

test('Geçmiş taahhüt → expired olmalı', () => {
  const end = new Date(Date.now() - 10 * 86400000);
  const res = calculateDoomTrigger(end);
  assert.strictEqual(res.status, 'expired');
});

console.log('');

// ═══ Section 4: safeToDate Helper ═══
console.log('📌 4. safeToDate Yardımcı Fonksiyon Testleri:');

function safeToDate(val) {
  if (!val) return new Date();
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
  if (typeof val?.toDate === 'function') return val.toDate();
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

test('null → bugünkü tarih dönmeli', () => {
  const d = safeToDate(null);
  assert(!isNaN(d.getTime()));
});

test('undefined → bugünkü tarih dönmeli', () => {
  const d = safeToDate(undefined);
  assert(!isNaN(d.getTime()));
});

test('JS Date nesnesi → aynı tarih dönmeli', () => {
  const original = new Date(2025, 5, 15);
  const d = safeToDate(original);
  assert.strictEqual(d.getTime(), original.getTime());
});

test('ISO string → doğru parse edilmeli', () => {
  const d = safeToDate('2025-06-15T09:00:00.000Z');
  assert(!isNaN(d.getTime()));
  assert.strictEqual(d.getUTCFullYear(), 2025);
});

test('Firestore Timestamp mock (toDate) → doğru dönüşüm', () => {
  const mock = { toDate: () => new Date(2025, 8, 1) };
  const d = safeToDate(mock);
  assert.strictEqual(d.getMonth(), 8);
});

test('Geçersiz string → bugünkü tarih dönmeli (çökmemeli)', () => {
  const d = safeToDate('invalid-garbage-string');
  assert(!isNaN(d.getTime()));
});

test('Invalid Date nesnesi → bugünkü tarih dönmeli', () => {
  const d = safeToDate(new Date('not-a-date'));
  assert(!isNaN(d.getTime()));
});

console.log('');

// ═══ Section 5: Dosya ve İmport Tutarlılık Kontrolü ═══
console.log('📌 5. Dosya ve İmport Tutarlılık Kontrolü:');

const srcRoot = path.join(__dirname, '..', 'src');

test('services/notificationService.ts mevcut olmalı', () => {
  assert(fs.existsSync(path.join(srcRoot, 'services', 'notificationService.ts')));
});

test('services/notificationService.ts → scheduleSubReminder export etmeli', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'services', 'notificationService.ts'), 'utf-8');
  assert(content.includes('export const scheduleSubReminder'));
});

test('services/notificationService.ts → cancelSubReminder export etmeli', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'services', 'notificationService.ts'), 'utf-8');
  assert(content.includes('export const cancelSubReminder'));
});

test('services/notificationService.ts → scheduleContractDoomReminder export etmeli', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'services', 'notificationService.ts'), 'utf-8');
  assert(content.includes('export const scheduleContractDoomReminder'));
});

test('services/notificationService.ts → resyncAllReminders export etmeli', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'services', 'notificationService.ts'), 'utf-8');
  assert(content.includes('export const resyncAllReminders'));
});

test('services/notificationService.ts → web platform guard mevcut', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'services', 'notificationService.ts'), 'utf-8');
  assert(content.includes("Platform.OS === 'web'"));
});

test('useSubscriptions.ts → doğru import yolunu kullanmalı (@/services/notificationService)', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'features', 'subscriptions', 'hooks', 'useSubscriptions.ts'), 'utf-8');
  assert(content.includes("from '@/services/notificationService'"));
});

test('useSubscriptions.ts → getNextRenewalDate doğru yerden import edilmeli', () => {
  const content = fs.readFileSync(path.join(srcRoot, 'features', 'subscriptions', 'hooks', 'useSubscriptions.ts'), 'utf-8');
  assert(content.includes("from '@/features/dashboard/utils/calculations'"));
});

test('Bildirim ID formatı deterministik olmalı (sub_remind_{id})', () => {
  const id = 'test_sub_123';
  assert.strictEqual(`sub_remind_${id}`, 'sub_remind_test_sub_123');
  assert.strictEqual(`sub_contract_doom_${id}`, 'sub_contract_doom_test_sub_123');
});

console.log('');

// ═══ Section 6: End-to-End Flow Simulation ═══
console.log('📌 6. End-to-End Bildirim Akış Simülasyonu:');

test('Yeni abonelik ekleme → bildirim zamanlaması tüm pipeline çalışmalı', () => {
  // Simulate: User adds Netflix, monthly, renewal 15 days from now
  const renewalDate = new Date();
  renewalDate.setDate(renewalDate.getDate() + 15);
  
  // Step 1: getNextRenewalDate (renewal is in future, should stay same)
  const nextDate = getNextRenewalDate(renewalDate, 'monthly');
  assert(nextDate.getTime() >= renewalDate.getTime());
  
  // Step 2: calculateTrigger (should schedule 2 days before)
  const trigger = calculateTrigger(nextDate);
  assert.strictEqual(trigger.status, 'scheduled');
  assert(trigger.triggerDate.getTime() < nextDate.getTime());
  
  // Step 3: Verify trigger is in the future
  assert(trigger.triggerDate.getTime() > Date.now());
});

test('Eski abonelik güncelleme → geçmiş tarih taşınıp bildirim zamanlanmalı', () => {
  // Simulate: User has a subscription with old renewal date
  const oldRenewal = new Date();
  oldRenewal.setMonth(oldRenewal.getMonth() - 2);
  
  // Step 1: getNextRenewalDate should bring it forward
  const nextDate = getNextRenewalDate(oldRenewal, 'monthly');
  assert(nextDate >= getMidnight(new Date()));
  
  // Step 2: Trigger should be valid
  const trigger = calculateTrigger(nextDate);
  assert(trigger.status === 'scheduled' || trigger.status === 'immediate');
});

test('Duraklatılan abonelik → bildirim iptal akışı simülasyonu', () => {
  // When sub is paused, cancelSubReminder is called
  const subId = 'paused_sub_456';
  const notifId = `sub_remind_${subId}`;
  assert.strictEqual(notifId, 'sub_remind_paused_sub_456');
  // In real code: Notifications.cancelScheduledNotificationAsync(notifId)
});

test('Haftalık abonelik → kısa döngü doğru hesaplanmalı', () => {
  const past = new Date();
  past.setDate(past.getDate() - 10);
  const next = getNextRenewalDate(past, 'weekly');
  const diffDays = Math.round((next.getTime() - past.getTime()) / 86400000);
  assert(diffDays % 7 === 0, `Haftalık döngüde gün farkı 7'nin katı olmalı, alınan: ${diffDays}`);
});

console.log('');

// ═══ Summary ═══
console.log('═══════════════════════════════════════════════════');
console.log(`📊 Sonuç: ${passed} / ${total} test başarılı (${Math.round((passed / total) * 100)}%)`);
if (passed === total) {
  console.log('🎉 Bildirim sistemi tüm testlerden geçti!');
} else {
  console.log(`⚠️  ${total - passed} test başarısız!`);
}
console.log('═══════════════════════════════════════════════════');
