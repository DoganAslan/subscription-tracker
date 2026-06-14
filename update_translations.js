const fs = require('fs');
const path = require('path');

const dir = path.join('src', 'locales', 'translations');

const en = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
    error: "Error",
    success: "Success"
  },
  onboarding: {
    takeControl: "Take Control",
    takeControlDesc: "Manage all your subscriptions in one place.",
    smartInsights: "Smart Insights",
    smartInsightsDesc: "Visualize your spending and track upcoming bills.",
    alwaysUpdated: "Always Updated",
    alwaysUpdatedDesc: "Keep an eye on your expenses right from your Home Screen widgets.",
    skip: "Skip",
    next: "Next",
    getStarted: "Get Started"
  },
  settings: {
    accountSettings: "Account Settings",
    profileInfo: "Profile Information",
    email: "Email",
    accountId: "Account ID",
    language: "Language",
    deleteAccount: "Delete Account",
    deleteWarning: "This action is irreversible. All your data will be permanently deleted. Please enter your password to confirm.",
    permanentlyDelete: "Permanently Delete",
    cancel: "Cancel",
    save: "Save",
    security: "Security & Biometrics",
    changeEmail: "Change Email",
    changePassword: "Change Password",
    about: "About SubMate",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    logout: "Sign Out Securely",
    theme: "Theme",
    exportData: "Export Data",
    currencyPref: "Currency Preferences",
    homeBaseCurrency: "Home Base Currency"
  },
  tabs: {
    home: "Home",
    subscriptions: "Subscriptions",
    calendar: "Calendar",
    settings: "Settings"
  },
  home: {
    failedToLoad: "Failed to load dashboard data.",
    yourListIsEmpty: "Your List is Empty",
    addFirstSub: "Add your first subscription to start tracking your expenses.",
    addSubscription: "Add Subscription",
    upcomingPayments: "Upcoming Payments",
    viewAll: "VIEW ALL",
    totalMonthlySpend: "TOTAL MONTHLY SPEND",
    estimatedYearlySpend: "Estimated Yearly Spend",
    categoryBreakdown: "Category Breakdown",
    spendingInsights: "Spending Insights",
    highestExpense: "Highest Expense"
  },
  subs: {
    subscriptions: "Subscriptions",
    searchPlaceholder: "Search subscriptions...",
    addSubscription: "Add Subscription",
    activeCount: "{{count}} Active",
    noResults: "No subscriptions found.",
    name: "Name",
    price: "Price",
    billingCycle: "Billing Cycle",
    category: "Category",
    firstPaymentDate: "First Payment Date",
    notes: "Notes",
    add: "Add",
    update: "Update",
    monthly: "Monthly",
    yearly: "Yearly",
    weekly: "Weekly",
    paused: "Paused",
    trial: "TRIAL",
    renews: "Renews {{date}}",
    activeFor: "ACTIVE FOR",
    months: "months",
    totalSpend: "TOTAL SPEND"
  },
  calendar: {
    calendar: "Calendar",
    noPayments: "No payments scheduled for this day."
  }
};

const tr = {
  common: {
    save: "Kaydet",
    cancel: "İptal",
    delete: "Sil",
    edit: "Düzenle",
    loading: "Yükleniyor...",
    error: "Hata",
    success: "Başarılı"
  },
  onboarding: {
    takeControl: "Kontrolü Ele Al",
    takeControlDesc: "Tüm aboneliklerinizi tek bir yerden yönetin.",
    smartInsights: "Akıllı Analizler",
    smartInsightsDesc: "Harcamalarınızı görselleştirin ve yaklaşan faturaları takip edin.",
    alwaysUpdated: "Her Zaman Güncel",
    alwaysUpdatedDesc: "Ana Ekran araç takımlarınızdan harcamalarınızı gözlemleyin.",
    skip: "Atla",
    next: "İleri",
    getStarted: "Başla"
  },
  settings: {
    accountSettings: "Hesap Ayarları",
    profileInfo: "Profil Bilgileri",
    email: "E-posta",
    accountId: "Hesap Kimliği",
    language: "Dil",
    deleteAccount: "Hesabı Sil",
    deleteWarning: "Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir. Lütfen onaylamak için şifrenizi girin.",
    permanentlyDelete: "Kalıcı Olarak Sil",
    cancel: "İptal",
    save: "Kaydet",
    security: "Güvenlik ve Biyometri",
    changeEmail: "E-postayı Değiştir",
    changePassword: "Şifreyi Değiştir",
    about: "SubMate Hakkında",
    privacyPolicy: "Gizlilik Politikası",
    termsOfService: "Hizmet Şartları",
    logout: "Güvenli Çıkış Yap",
    theme: "Tema",
    exportData: "Verileri Dışa Aktar",
    currencyPref: "Para Birimi Tercihleri",
    homeBaseCurrency: "Ana Para Birimi"
  },
  tabs: {
    home: "Ana Sayfa",
    subscriptions: "Abonelikler",
    calendar: "Takvim",
    settings: "Ayarlar"
  },
  home: {
    failedToLoad: "Kontrol paneli verileri yüklenemedi.",
    yourListIsEmpty: "Listeniz Boş",
    addFirstSub: "Harcamalarınızı takip etmeye başlamak için ilk aboneliğinizi ekleyin.",
    addSubscription: "Abonelik Ekle",
    upcomingPayments: "Yaklaşan Ödemeler",
    viewAll: "TÜMÜNÜ GÖR",
    totalMonthlySpend: "TOPLAM AYLIK HARCAMA",
    estimatedYearlySpend: "Tahmini Yıllık Harcama",
    categoryBreakdown: "Kategori Dağılımı",
    spendingInsights: "Harcama İstatistikleri",
    highestExpense: "En Yüksek Harcama"
  },
  subs: {
    subscriptions: "Abonelikler",
    searchPlaceholder: "Aboneliklerde ara...",
    addSubscription: "Abonelik Ekle",
    activeCount: "{{count}} Aktif",
    noResults: "Abonelik bulunamadı.",
    name: "İsim",
    price: "Fiyat",
    billingCycle: "Faturalandırma Döngüsü",
    category: "Kategori",
    firstPaymentDate: "İlk Ödeme Tarihi",
    notes: "Notlar",
    add: "Ekle",
    update: "Güncelle",
    monthly: "Aylık",
    yearly: "Yıllık",
    weekly: "Haftalık",
    paused: "Duraklatıldı",
    trial: "DENEME",
    renews: "Yenilenme: {{date}}",
    activeFor: "AKTİF SÜRE",
    months: "ay",
    totalSpend: "TOPLAM HARCAMA"
  },
  calendar: {
    calendar: "Takvim",
    noPayments: "Bu gün için planlanmış ödeme yok."
  }
};

const langs = [
  { code: 'es', home: 'Inicio', settings: 'Configuración', subs: 'Suscripciones', calendar: 'Calendario', save: 'Guardar', cancel: 'Cancelar', del: 'Eliminar', total: 'Total', email: 'Correo electrónico', accountId: 'ID de la cuenta', changePassword: 'Cambiar contraseña', deleteAccount: 'Eliminar cuenta' },
  { code: 'zh', home: '首页', settings: '设置', subs: '订阅', calendar: '日历', save: '保存', cancel: '取消', del: '删除', total: '总计', email: '电子邮件', accountId: '帐户ID', changePassword: '更改密码', deleteAccount: '删除帐户' },
  { code: 'hi', home: 'होम', settings: 'सेटिंग्स', subs: 'सदस्यताएं', calendar: 'कैलेंडर', save: 'सहेजें', cancel: 'रद्द करें', del: 'हटाएं', total: 'कुल', email: 'ईमेल', accountId: 'खाता आईडी', changePassword: 'पासवर्ड बदलें', deleteAccount: 'खाता हटाएं' },
  { code: 'ar', home: 'الرئيسية', settings: 'الإعدادات', subs: 'الاشتراكات', calendar: 'التقويم', save: 'حفظ', cancel: 'إلغاء', del: 'حذف', total: 'المجموع', email: 'البريد الإلكتروني', accountId: 'معرف الحساب', changePassword: 'تغيير كلمة المرور', deleteAccount: 'حذف الحساب' },
  { code: 'fr', home: 'Accueil', settings: 'Paramètres', subs: 'Abonnements', calendar: 'Calendrier', save: 'Enregistrer', cancel: 'Annuler', del: 'Supprimer', total: 'Total', email: 'E-mail', accountId: 'Identifiant du compte', changePassword: 'Changer le mot de passe', deleteAccount: 'Supprimer le compte' },
  { code: 'ru', home: 'Главная', settings: 'Настройки', subs: 'Подписки', calendar: 'Календарь', save: 'Сохранить', cancel: 'Отмена', del: 'Удалить', total: 'Итого', email: 'Электронная почта', accountId: 'ID аккаунта', changePassword: 'Изменить пароль', deleteAccount: 'Удалить аккаунт' },
  { code: 'pt', home: 'Início', settings: 'Configurações', subs: 'Assinaturas', calendar: 'Calendário', save: 'Salvar', cancel: 'Cancelar', del: 'Excluir', total: 'Total', email: 'E-mail', accountId: 'ID da conta', changePassword: 'Mudar senha', deleteAccount: 'Excluir conta' },
  { code: 'de', home: 'Startseite', settings: 'Einstellungen', subs: 'Abonnements', calendar: 'Kalender', save: 'Speichern', cancel: 'Abbrechen', del: 'Löschen', total: 'Gesamt', email: 'E-Mail', accountId: 'Konto-ID', changePassword: 'Passwort ändern', deleteAccount: 'Konto löschen' },
  { code: 'ja', home: 'ホーム', settings: '設定', subs: 'サブスクリプション', calendar: 'カレンダー', save: '保存', cancel: 'キャンセル', del: '削除', total: '合計', email: 'Eメール', accountId: 'アカウントID', changePassword: 'パスワード変更', deleteAccount: 'アカウント削除' },
  { code: 'id', home: 'Beranda', settings: 'Pengaturan', subs: 'Langganan', calendar: 'Kalender', save: 'Simpan', cancel: 'Batal', del: 'Hapus', total: 'Total', email: 'Email', accountId: 'ID Akun', changePassword: 'Ubah Kata Sandi', deleteAccount: 'Hapus Akun' },
  { code: 'bn', home: 'হোম', settings: 'সেটিংস', subs: 'সাবস্ক্রিপশন', calendar: 'ক্যালেন্ডার', save: 'সংরক্ষণ', cancel: 'বাতিল', del: 'মুছুন', total: 'মোট', email: 'ইমেল', accountId: 'অ্যাকাউন্ট আইডি', changePassword: 'পাসওয়ার্ড পরিবর্তন', deleteAccount: 'অ্যাকাউন্ট মুছুন' },
  { code: 'ur', home: 'ہوم', settings: 'ترتیبات', subs: 'سبسکرپشنز', calendar: 'کیلنڈر', save: 'محفوظ کریں', cancel: 'منسوخ کریں', del: 'حذف کریں', total: 'کل', email: 'ای میل', accountId: 'اکاؤنٹ آئی ڈی', changePassword: 'پاس ورڈ تبدیل کریں', deleteAccount: 'اکاؤنٹ حذف کریں' },
  { code: 'ko', home: '홈', settings: '설정', subs: '구독', calendar: '캘린더', save: '저장', cancel: '취소', del: '삭제', total: '합계', email: '이메일', accountId: '계정 ID', changePassword: '비밀번호 변경', deleteAccount: '계정 삭제' },
  { code: 'it', home: 'Home', settings: 'Impostazioni', subs: 'Abbonamenti', calendar: 'Calendario', save: 'Salva', cancel: 'Annulla', del: 'Elimina', total: 'Totale', email: 'Email', accountId: 'ID Account', changePassword: 'Cambia Password', deleteAccount: 'Elimina Account' },
  { code: 'vi', home: 'Trang chủ', settings: 'Cài đặt', subs: 'Đăng ký', calendar: 'Lịch', save: 'Lưu', cancel: 'Hủy', del: 'Xóa', total: 'Tổng số', email: 'Email', accountId: 'ID tài khoản', changePassword: 'Đổi mật khẩu', deleteAccount: 'Xóa tài khoản' },
  { code: 'te', home: 'హోమ్', settings: 'సెట్టింగ్‌లు', subs: 'సబ్‌స్క్రిప్షన్‌లు', calendar: 'క్యాలెండర్', save: 'సేవ్', cancel: 'రద్దు చేయి', del: 'తొలగించు', total: 'మొత్తం', email: 'ఇమెయిల్', accountId: 'ఖాతా ID', changePassword: 'పాస్‌వర్డ్ మార్చు', deleteAccount: 'ఖాతా తొలగించు' },
  { code: 'mr', home: 'होम', settings: 'सेटिंग्ज', subs: 'सदस्यता', calendar: 'कॅलेंडर', save: 'जतन करा', cancel: 'रद्द करा', del: 'हटवा', total: 'एकूण', email: 'ईमेल', accountId: 'खाते आयडी', changePassword: 'पासवर्ड बदला', deleteAccount: 'खाते हटवा' },
  { code: 'ta', home: 'முகப்பு', settings: 'அமைப்புகள்', subs: 'சந்தாக்கள்', calendar: 'நாள்காட்டி', save: 'சேமி', cancel: 'ரத்துசெய்', del: 'நீக்கு', total: 'மொத்தம்', email: 'மின்னஞ்சல்', accountId: 'கணக்கு ஐடி', changePassword: 'கடவுச்சொல்லை மாற்று', deleteAccount: 'கணக்கை நீக்கு' }
];

fs.writeFileSync(path.join(dir, 'en.json'), JSON.stringify(en, null, 2));
fs.writeFileSync(path.join(dir, 'tr.json'), JSON.stringify(tr, null, 2));

for (const lang of langs) {
  // Deep copy english as base to avoid empty stubs for missing keys, 
  // then override with our specific translated keys
  const data = JSON.parse(JSON.stringify(en));
  data.common.save = lang.save;
  data.common.cancel = lang.cancel;
  data.common.delete = lang.del;
  data.common.total = lang.total;
  
  data.tabs.home = lang.home;
  data.tabs.settings = lang.settings;
  data.tabs.subscriptions = lang.subs;
  data.tabs.calendar = lang.calendar;

  data.settings.email = lang.email;
  data.settings.accountId = lang.accountId;
  data.settings.changePassword = lang.changePassword;
  data.settings.deleteAccount = lang.deleteAccount;
  
  fs.writeFileSync(path.join(dir, lang.code + '.json'), JSON.stringify(data, null, 2));
}

console.log("Updated translations");
