// src/locales/index.ts
import enJSON from './translations/en.json';
import trJSON from './translations/tr.json';

export type TranslationType = {
  tabs: { home: string; subscriptions: string; calendar: string; wallet: string; settings: string; };
  card: { activeFor: string; totalSpend: string; months: string; renews: string; noPaymentMethod: string; onePartner: string; };
  form: { splitTitle: string; splitSubtitle: string; partner: string; name: string; phone: string; amount: string; sendReminder: string; trialTitle: string; trialSubtitle: string; cancel: string; updateHeader: string; addPartner: string; };
  common: { delete: string; cancel: string; paused: string; trial: string; clear: string; };
  global: Record<string, any>;
  subs: { addSubscription: string; name: string; category: string; billingCycle: string; notes: string; };
  [category: string]: any;
};

export const LANGUAGES: Record<string, TranslationType> = {
  en: {
    ...enJSON,
    tabs: { home: 'Home', subscriptions: 'Subscriptions', calendar: 'Calendar', wallet: 'Wallet', settings: 'Settings' },
    card: { activeFor: 'ACTIVE FOR', totalSpend: 'TOTAL SPEND', months: 'Months', renews: 'Renews:', noPaymentMethod: 'No payment method linked', onePartner: '1 Partner' },
    form: { splitTitle: 'Split', splitSubtitle: 'Share costs with others', partner: 'Partner', name: 'NAME', phone: 'PHONE', amount: 'SPLIT AMOUNT', sendReminder: 'Send WhatsApp Reminder', trialTitle: 'Trial Version', trialSubtitle: 'Track expiration and avoid sudden charges', cancel: 'Cancel', updateHeader: 'Update', addPartner: 'Add New Partner' },
    common: { delete: 'Delete', cancel: 'Cancel', paused: 'Paused', trial: 'Trial', clear: 'Clear' },
    dashboard: {
      meterTitle: 'Subscription Analytics',
      categoryBreakdown: 'Category Breakdown',
      sixMonthOutlook: '6-Month Outlook',
      highestExpense: 'Highest Expense',
      upcomingPayments: 'Upcoming Payments',
      viewAll: 'VIEW ALL',
      noActiveSubs: 'No active subscriptions monitored.',
      tapToSetLimit: 'Tap to set a monthly limit',
      setMonthlyBudget: 'Set Monthly Budget',
      monthlyBudgetLimit: 'Monthly Budget Limit'
    },
    subs: { addSubscription: 'Add Subscription', name: 'NAME', category: 'Category', billingCycle: 'BILLING CYCLE', notes: 'Notes' },
    subscriptionsPage: { title: 'My Subscriptions', addSub: 'Add Subscription', addSubscription: 'Add Subscription', active: 'Active', paused: 'Paused' },
    walletPage: {
      title: 'My Wallet',
      myWallet: 'My Wallet',
      cards: 'Cards',
      linkedSubs: 'Linked Subscriptions',
      balance: 'Total Balance',
      methods: 'Payment Methods',
      addMethod: 'Add Method',
      featured: 'Featured',
      pin: 'Pin Card',
      noCardsAdded: 'No Cards Added Yet',
      createAVirtualCardTo: 'Add a payment card to organize your subscriptions and link recurring payments.',
      linkedSubscriptions: 'Linked Subscriptions',
      noLinkedSubs: 'No subscriptions linked to this card yet.',
      goToSubscriptions: 'Go to Subscriptions →',
      unassignedCard: 'Unassigned / Cash',
      setSavingsGoal: 'Set Savings Goal',
      goalPlaceholder: 'Goal (e.g. Vacation, New Phone)',
      targetAmount: 'Target Amount',
      saveGoal: 'Save Goal',
      editGoal: 'Edit Goal'
    },
    settingsPage: { title: 'Settings', profile: 'Profile', language: 'Language', theme: 'Dark Mode', logout: 'Log Out' },
    accountSettings: {
      title: 'Account Settings',
      personalInfo: 'Personal Information',
      nameLabel: 'Full Name',
      emailLabel: 'Email Address',
      accountId: 'Account ID',
      saveChanges: 'Save Changes',
      deleteAccount: 'Delete Account',
      changeEmail: 'Change Email',
      enterNewEmail: 'Enter your new email address.',
      newEmailPlaceholder: 'New Email Address',
      changePassword: 'Change Password',
      enterCurrentAndNewPassword: 'Enter your current and new password.',
      currentPasswordPlaceholder: 'Current Password',
      newPasswordPlaceholder: 'New Password',
      confirmPasswordPlaceholder: 'Confirm New Password',
      deleteAccountPermanently: 'Permanently Delete Account',
      deleteAccountWarning: 'This action cannot be undone. Enter current password to confirm.',
      permanentlyDelete: 'Permanently Delete'
    },
    vault: {
      title: 'DATA SOVEREIGNTY (SOVEREIGN VAULT)',
      download: 'Download Vault Backup (.json)',
      restore: 'Restore Backup'
    },
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    calendarPage: {
      payments: 'Payments',
      total: 'Total'
    },
    global: {
      ...enJSON.global,
      cardName: 'Card Name',
      cardType: 'Card Type',
      lastFourDigits: 'Last 4 Digits',
      currency: 'Currency',
      expiryMonth: 'Expiry Month (MM)',
      expiryYear: 'Expiry Year (YYYY)',
      cardColor: 'CARD COLOR',
      deleteCard: 'Delete Card',
      deleteCardConfirm: 'Are you sure you want to permanently delete {{name}}?',
      deleteCardTitle: 'Delete Card',
      deleteCardDesc: '{{name}} will be removed from your wallet. This action cannot be undone.',
      biometricPrompt: 'Unlock SubMate',
      usePassword: 'Use Password'
    },
    healthScore: {
      cleanWallet: 'Clean Wallet',
      noSubsYet: 'No subscription burden being monitored yet.',
      excellent: 'Excellent Budget',
      good: 'Good Budget',
      warning: 'Budget Warning',
      bleeding: '🚨 Budget Bleeding!',
      requiresAttention: '⚠️ Needs Attention',
      allGood: 'Great! Your subscription budget is under control.',
      vampirWarning: (category: string, count: number) => `Vampire Alert: There are ${count} different subscriptions in the "${category}" category. You can save money by eliminating one.`
    }
  },
  tr: {
    ...trJSON,
    tabs: { home: 'Ana Sayfa', subscriptions: 'Abonelikler', calendar: 'Takvim', wallet: 'Cüzdan', settings: 'Ayarlar' },
    card: { activeFor: 'AKTİF SÜRE', totalSpend: 'TOPLAM HARCAMA', months: 'Ay', renews: 'Yenilenme:', noPaymentMethod: 'Kayıtlı ödeme yöntemi yok', onePartner: '1 Ortak' },
    form: { splitTitle: 'Ortaklık (Split)', splitSubtitle: 'Maliyeti başkalarıyla bölüşün', partner: 'Ortak', name: 'İSİM', phone: 'TELEFON', amount: 'PAY MIKTARI', sendReminder: 'WhatsApp Hatırlatıcı Gönder', trialTitle: 'Deneme Sürümü', trialSubtitle: 'Süre bitimini takip edin ve sürpriz ücretlerden kaçının', cancel: 'İptal', updateHeader: 'Güncelle', addPartner: 'Yeni Ortak Ekle' },
    common: { delete: 'Sil', cancel: 'İptal', paused: 'Duraklatıldı', trial: 'Deneme', clear: 'Temizle' },
    dashboard: {
      meterTitle: 'Abonelik Analizleri',
      categoryBreakdown: 'Kategori Dağılımı',
      sixMonthOutlook: '6 Aylık Görünüm',
      highestExpense: 'En Yüksek Harcama',
      upcomingPayments: 'Yaklaşan Ödemeler',
      viewAll: 'HEPSİNİ GÖR',
      noActiveSubs: 'Takip edilen aktif abonelik bulunmuyor.',
      tapToSetLimit: 'Aylık bütçe limiti belirlemek için dokunun',
      setMonthlyBudget: 'Aylık Bütçe Belirle',
      monthlyBudgetLimit: 'Aylık Bütçe Limiti'
    },
    subs: { addSubscription: 'Abonelik Ekle', name: 'İSİM', category: 'Kategori', billingCycle: 'FATURA DÖNGÜSÜ', notes: 'Notlar' },
    subscriptionsPage: { title: 'Aboneliklerim', addSub: 'Abonelik Ekle', addSubscription: 'Abonelik Ekle', active: 'Aktif', paused: 'Duraklatıldı' },
    walletPage: {
      title: 'Cüzdanım',
      myWallet: 'Cüzdanım',
      cards: 'Kart',
      linkedSubs: 'Bağlı Abonelik',
      balance: 'Toplam Bakiye',
      methods: 'Ödeme Yöntemleri',
      addMethod: 'Yöntem Ekle',
      featured: 'Vitrinde',
      pin: 'Sabitle',
      noCardsAdded: 'Henüz Kart Eklenmedi',
      createAVirtualCardTo: 'Aboneliklerinizi düzenlemek ve düzenli ödemeleri bağlamak için bir ödeme kartı ekleyin.',
      linkedSubscriptions: 'Bağlı Abonelikler',
      noLinkedSubs: 'Bu karta henüz bir abonelik bağlanmadı.',
      goToSubscriptions: 'Aboneliklere Git →',
      unassignedCard: 'Atanmamış / Nakit',
      setSavingsGoal: 'Tasarruf Hedefi Belirle',
      goalPlaceholder: 'Hedef (Örn: Tatil, Yeni Telefon)',
      targetAmount: 'Hedef Tutar',
      saveGoal: 'Hedefi Kaydet',
      editGoal: 'Hedefi Düzenle'
    },
    settingsPage: { title: 'Ayarlar', profile: 'Profil', language: 'Dil Seçeneği', theme: 'Karanlık Mod', logout: 'Çıkış Yap' },
    accountSettings: {
      title: 'Hesap Ayarları',
      personalInfo: 'Kişisel Bilgiler',
      nameLabel: 'Ad Soyad',
      emailLabel: 'E-posta Adresi',
      accountId: 'Hesap Kimliği',
      saveChanges: 'Değişiklikleri Kaydet',
      deleteAccount: 'Hesabı Sil',
      changeEmail: 'E-postayı Değiştir',
      enterNewEmail: 'Yeni e-posta adresinizi giriniz.',
      newEmailPlaceholder: 'Yeni E-posta Adresi',
      changePassword: 'Şifreyi Değiştir',
      enterCurrentAndNewPassword: 'Mevcut ve yeni şifrenizi giriniz.',
      currentPasswordPlaceholder: 'Mevcut Şifre',
      newPasswordPlaceholder: 'Yeni Şifre',
      confirmPasswordPlaceholder: 'Yeni Şifre (Tekrar)',
      deleteAccountPermanently: 'Hesabı Kalıcı Olarak Sil',
      deleteAccountWarning: 'Bu işlem geri alınamaz. Doğrulamak için mevcut şifrenizi giriniz.',
      permanentlyDelete: 'Kalıcı Olarak Sil'
    },
    vault: {
      title: 'VERİ EGEMENLİĞİ (SOVEREIGN VAULT)',
      download: 'Kasa Yedeği İndir (.json)',
      restore: 'Yedeği Geri Yükle'
    },
    months: [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ],
    calendarPage: {
      payments: 'Ödeme',
      total: 'Toplam'
    },
    global: {
      ...trJSON.global,
      cardName: 'Kart İsmi',
      cardType: 'Kart Tipi',
      lastFourDigits: 'Son 4 Hane',
      currency: 'Para Birimi',
      expiryMonth: 'Son Kullanma Ayı (AA)',
      expiryYear: 'Son Kullanma Yılı (YYYY)',
      cardColor: 'KART RENGİ',
      deleteCard: 'Kartı Sil',
      deleteCardConfirm: '{{name}} kartını cüzdandan kalıcı olarak silmek istediğinize emin misiniz?',
      deleteCardTitle: 'Kartı Sil',
      deleteCardDesc: '{{name}} cüzdanınızdan kaldırılacak. Bu işlem geri alınamaz.',
      biometricPrompt: 'SubMate Kasına Giriş Yapın',
      usePassword: 'Şifre Kullan'
    },
    healthScore: {
      cleanWallet: 'Tertemiz Cüzdan',
      noSubsYet: 'Henüz takip edilen bir abonelik yükü yok.',
      excellent: 'Mükemmel Bütçe',
      good: 'İyi Bütçe',
      warning: 'Bütçe Uyarısı',
      bleeding: '🚨 Bütçe Kanıyor!',
      requiresAttention: '⚠️ Dikkat Gerektiriyor',
      allGood: 'Harika! Abonelik bütçen tam kontrol altında, gereksiz sızıntı yok.',
      vampirWarning: (category: string, count: number) => `Vampir Uyarısı: "${category}" kategorisinde ${count} farklı abonelik var. Birini eleyerek tasarruf edebilirsiniz.`
    }
  }
};

