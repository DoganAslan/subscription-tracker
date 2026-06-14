export type LegalTranslation = {
  title: string;
  subtitle: string;
  dataControllerHeading: string;
  dataControllerText: string;
  processedDataHeading: string;
  processedDataText: string;
  biometricIsolationHeading: string;
  biometricIsolationText: string;
  rightToErasureHeading: string;
  rightToErasureText: string;
  contactHeading: string;
  contactText: string;
};

export const legalTranslations: Record<string, LegalTranslation> = {
  en: {
    title: 'Privacy Policy',
    subtitle: 'Last updated: October 2023',
    dataControllerHeading: '1. Data Controller',
    dataControllerText: 'SubMate operates as the primary data controller. We only process data explicitly necessary to provide our subscription tracking services. This includes subscription names, billing cycles, and cost values. We do not track your financial transactions or link to your personal banking applications.',
    processedDataHeading: '2. Processed Data Scope & Offline Security',
    processedDataText: 'Your primary subscription data is cached locally on your device for fast access and offline capability. We prioritize an offline-first architecture to ensure you never lose access to your financial dashboard. Any cloud backups are heavily encrypted.',
    biometricIsolationHeading: 'Biometric Data Isolation',
    biometricIsolationText: 'Your fingerprint and FaceID records are never transmitted to our servers. They remain strictly secured by your device\'s native hardware enclave (Secure Enclave / Keystore).',
    rightToErasureHeading: '3. Right to Erasure (GDPR Compliant)',
    rightToErasureText: 'You hold total control over your data. Under GDPR and KVKK regulations, you have the absolute right to erasure. You may delete your account and securely wipe all associated records from our cloud database instantly from the Settings menu.',
    contactHeading: 'Contact Us',
    contactText: 'If you have questions regarding this privacy policy, please contact us at: doganaslan.dev@gmail.com'
  },
  tr: {
    title: 'Gizlilik Politikası',
    subtitle: 'Son güncelleme: Ekim 2023',
    dataControllerHeading: '1. Veri Sorumlusu',
    dataControllerText: 'SubMate birincil veri sorumlusu olarak faaliyet gösterir. Sadece abonelik takip hizmetlerimizi sunmak için açıkça gerekli olan verileri işleriz. Buna abonelik adları, fatura döngüleri ve maliyet değerleri dahildir. Finansal işlemlerinizi takip etmiyoruz veya kişisel bankacılık uygulamalarınıza bağlanmıyoruz.',
    processedDataHeading: '2. İşlenen Veri Kapsamı ve Çevrimdışı Güvenlik',
    processedDataText: 'Birincil abonelik verileriniz, hızlı erişim ve çevrimdışı kullanım için cihazınızda yerel olarak önbelleğe alınır. Finansal panelinize erişiminizi hiçbir zaman kaybetmemenizi sağlamak için çevrimdışı öncelikli bir mimariye odaklanıyoruz.',
    biometricIsolationHeading: 'Biyometrik Veri İzolasyonu',
    biometricIsolationText: 'Parmak izi ve FaceID kayıtlarınız hiçbir zaman sunucularımıza iletilmez. Cihazınızın yerel donanım koruması (Secure Enclave / Keystore) tarafından sıkı bir şekilde güvende tutulur.',
    rightToErasureHeading: '3. Silinme Hakkı (KVKK Uyumlu)',
    rightToErasureText: 'Verileriniz üzerinde tam kontrole sahipsiniz. KVKK ve GDPR düzenlemeleri uyarınca mutlak silinme hakkına sahipsiniz. Ayarlar menüsünden hesabınızı silebilir ve ilişkili tüm kayıtları anında bulut veritabanımızdan silebilirsiniz.',
    contactHeading: 'Bize Ulaşın',
    contactText: 'Bu gizlilik politikası hakkında sorularınız varsa, lütfen bizimle iletişime geçin: doganaslan.dev@gmail.com'
  },
  de: {
    title: 'Datenschutzrichtlinie',
    subtitle: 'Zuletzt aktualisiert: Oktober 2023',
    dataControllerHeading: '1. Datenverantwortlicher',
    dataControllerText: 'SubMate fungiert als primärer Datenverantwortlicher. Wir verarbeiten nur Daten, die ausdrücklich zur Bereitstellung unserer Abonnement-Tracking-Dienste erforderlich sind. Wir verfolgen nicht Ihre Finanztransaktionen.',
    processedDataHeading: '2. Umfang der verarbeiteten Daten',
    processedDataText: 'Ihre primären Abonnementdaten werden lokal auf Ihrem Gerät zwischengespeichert, um einen schnellen Zugriff und Offline-Fähigkeit zu gewährleisten.',
    biometricIsolationHeading: 'Biometrische Datenisolation',
    biometricIsolationText: 'Ihre Fingerabdruck- und FaceID-Aufzeichnungen werden niemals an unsere Server übermittelt. Sie bleiben streng durch die native Hardware-Enklave Ihres Geräts gesichert.',
    rightToErasureHeading: '3. Recht auf Löschung (DSGVO-konform)',
    rightToErasureText: 'Sie haben die volle Kontrolle über Ihre Daten. Gemäß der DSGVO haben Sie das absolute Recht auf Löschung.',
    contactHeading: 'Kontaktiere uns',
    contactText: 'Bei Fragen wenden Sie sich bitte an: doganaslan.dev@gmail.com'
  },
  es: {
    title: 'Política de Privacidad',
    subtitle: 'Última actualización: Octubre de 2023',
    dataControllerHeading: '1. Controlador de Datos',
    dataControllerText: 'SubMate opera como el principal controlador de datos. Solo procesamos los datos estrictamente necesarios para proporcionar nuestros servicios de seguimiento de suscripciones.',
    processedDataHeading: '2. Alcance de los Datos Procesados',
    processedDataText: 'Sus datos principales de suscripción se almacenan en caché localmente en su dispositivo para un acceso rápido y capacidad sin conexión.',
    biometricIsolationHeading: 'Aislamiento de Datos Biométricos',
    biometricIsolationText: 'Sus registros de huellas dactilares y FaceID nunca se transmiten a nuestros servidores. Permanecen estrictamente protegidos por el enclave de hardware de su dispositivo.',
    rightToErasureHeading: '3. Derecho de Supresión',
    rightToErasureText: 'Usted tiene el control total sobre sus datos y tiene el derecho absoluto de borrar su cuenta en cualquier momento.',
    contactHeading: 'Contáctenos',
    contactText: 'Para consultas, contáctenos en: doganaslan.dev@gmail.com'
  },
  fr: {
    title: 'Politique de Confidentialité',
    subtitle: 'Dernière mise à jour : Octobre 2023',
    dataControllerHeading: '1. Responsable du Traitement',
    dataControllerText: 'SubMate opère en tant que responsable principal du traitement des données. Nous ne traitons que les données strictement nécessaires pour fournir nos services.',
    processedDataHeading: '2. Portée des Données Traitées',
    processedDataText: 'Vos données d\'abonnement principales sont mises en cache localement sur votre appareil pour un accès rapide et une capacité hors ligne.',
    biometricIsolationHeading: 'Isolement des Données Biométriques',
    biometricIsolationText: 'Vos empreintes digitales et enregistrements FaceID ne sont jamais transmis à nos serveurs. Ils restent strictement sécurisés par l\'enclave matérielle de votre appareil.',
    rightToErasureHeading: '3. Droit à l\'Effacement (Conforme RGPD)',
    rightToErasureText: 'Vous avez le contrôle total de vos données. En vertu du RGPD, vous avez le droit absolu à l\'effacement.',
    contactHeading: 'Contactez-nous',
    contactText: 'Pour toute question, veuillez nous contacter à : doganaslan.dev@gmail.com'
  },
  it: {
    title: 'Informativa sulla Privacy',
    subtitle: 'Ultimo aggiornamento: Ottobre 2023',
    dataControllerHeading: '1. Titolare del Trattamento',
    dataControllerText: 'SubMate opera come titolare principale del trattamento dei dati. Trattiamo solo i dati strettamente necessari per fornire i nostri servizi di tracciamento degli abbonamenti.',
    processedDataHeading: '2. Ambito dei Dati Trattati',
    processedDataText: 'I tuoi dati di abbonamento principali sono memorizzati nella cache locale sul tuo dispositivo per un accesso rapido e capacità offline.',
    biometricIsolationHeading: 'Isolamento dei Dati Biometrici',
    biometricIsolationText: 'I tuoi record di impronte digitali e FaceID non vengono mai trasmessi ai nostri server. Rimangono strettamente protetti dall\'enclave hardware del tuo dispositivo.',
    rightToErasureHeading: '3. Diritto alla Cancellazione',
    rightToErasureText: 'Hai il controllo totale sui tuoi dati e il diritto assoluto di cancellazione. Puoi eliminare il tuo account in qualsiasi momento.',
    contactHeading: 'Contattaci',
    contactText: 'Per domande, contattaci all\'indirizzo: doganaslan.dev@gmail.com'
  },
  ru: {
    title: 'Политика конфиденциальности',
    subtitle: 'Последнее обновление: октябрь 2023 г.',
    dataControllerHeading: '1. Контроллер данных',
    dataControllerText: 'SubMate выступает в качестве основного контроллера данных. Мы обрабатываем только те данные, которые необходимы для предоставления наших услуг по отслеживанию подписок.',
    processedDataHeading: '2. Объем обрабатываемых данных',
    processedDataText: 'Основные данные о ваших подписках кэшируются локально на вашем устройстве для быстрого доступа и работы в автономном режиме.',
    biometricIsolationHeading: 'Изоляция биометрических данных',
    biometricIsolationText: 'Ваши отпечатки пальцев и записи FaceID никогда не передаются на наши серверы. Они надежно защищены аппаратным анклавом вашего устройства.',
    rightToErasureHeading: '3. Право на удаление',
    rightToErasureText: 'Вы имеете полный контроль над своими данными и абсолютное право на удаление.',
    contactHeading: 'Свяжитесь с нами',
    contactText: 'По всем вопросам обращайтесь по адресу: doganaslan.dev@gmail.com'
  }
};

export type TermsTranslation = {
  title: string;
  subtitle: string;
  acceptanceHeading: string;
  acceptanceText: string;
  subscriptionHeading: string;
  subscriptionText: string;
  liabilityHeading: string;
  liabilityText: string;
  disclaimerText: string;
  terminationHeading: string;
  terminationText: string;
};

export const termsTranslations: Record<string, TermsTranslation> = {
  en: {
    title: 'Terms of Service',
    subtitle: 'Effective Date: October 2023',
    acceptanceHeading: '1. Acceptance of Terms',
    acceptanceText: 'By accessing or using SubMate, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.',
    subscriptionHeading: '2. Subscription Management',
    subscriptionText: 'SubMate provides tools to track your active subscriptions based on the data you provide. You acknowledge that we are not responsible for automatically canceling your third-party subscriptions. You must manually cancel any unwanted services with the original merchant.',
    liabilityHeading: '3. Limitation of Liability',
    liabilityText: 'In no event shall SubMate, nor its developers, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.',
    disclaimerText: 'Disclaimer: The financial insights provided by SubMate are for informational purposes only and do not constitute professional financial advice.',
    terminationHeading: '4. Termination',
    terminationText: 'We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.'
  },
  tr: {
    title: 'Hizmet Şartları',
    subtitle: 'Yürürlük Tarihi: Ekim 2023',
    acceptanceHeading: '1. Şartların Kabulü',
    acceptanceText: 'SubMate\'i kullanarak bu Hizmet Şartlarına bağlı kalmayı kabul etmiş olursunuz. Şartların herhangi bir kısmına katılmıyorsanız hizmete erişemezsiniz.',
    subscriptionHeading: '2. Abonelik Yönetimi',
    subscriptionText: 'SubMate, sağladığınız verilere dayanarak aboneliklerinizi takip etmeniz için araçlar sunar. Üçüncü taraf aboneliklerinizi otomatik olarak iptal etmekten sorumlu olmadığımızı kabul edersiniz. İstenmeyen hizmetleri doğrudan satıcı ile iptal etmelisiniz.',
    liabilityHeading: '3. Sorumluluğun Sınırlandırılması',
    liabilityText: 'SubMate veya geliştiricileri, hizmete erişiminizden veya hizmeti kullanamamanızdan kaynaklanan hiçbir dolaylı, arızi, özel veya cezai zarardan sorumlu tutulamaz.',
    disclaimerText: 'Feragatname: SubMate tarafından sağlanan finansal içgörüler yalnızca bilgilendirme amaçlıdır ve profesyonel finansal tavsiye teşkil etmez.',
    terminationHeading: '4. Fesih',
    terminationText: 'Şartları ihlal etmeniz de dahil olmak üzere herhangi bir nedenle, önceden bildirimde bulunmaksızın veya sorumluluk kabul etmeksizin hesabınızı derhal sonlandırabilir veya askıya alabiliriz.'
  },
  de: {
    title: 'Nutzungsbedingungen',
    subtitle: 'Datum des Inkrafttretens: Oktober 2023',
    acceptanceHeading: '1. Annahme der Bedingungen',
    acceptanceText: 'Durch den Zugriff auf oder die Nutzung von SubMate stimmen Sie diesen Nutzungsbedingungen zu.',
    subscriptionHeading: '2. Abonnementverwaltung',
    subscriptionText: 'SubMate bietet Tools zur Nachverfolgung Ihrer Abonnements. Wir sind nicht für die Kündigung Ihrer Drittanbieter-Abonnements verantwortlich.',
    liabilityHeading: '3. Haftungsbeschränkung',
    liabilityText: 'SubMate haftet in keinem Fall für indirekte, zufällige, besondere oder Folgeschäden.',
    disclaimerText: 'Haftungsausschluss: Die bereitgestellten finanziellen Einblicke dienen nur zu Informationszwecken und stellen keine professionelle Finanzberatung dar.',
    terminationHeading: '4. Kündigung',
    terminationText: 'Wir können Ihr Konto bei einem Verstoß gegen die Bedingungen fristlos kündigen oder sperren.'
  },
  es: {
    title: 'Términos de Servicio',
    subtitle: 'Fecha de vigencia: Octubre de 2023',
    acceptanceHeading: '1. Aceptación de los Términos',
    acceptanceText: 'Al utilizar SubMate, acepta estar sujeto a estos Términos de Servicio.',
    subscriptionHeading: '2. Gestión de Suscripciones',
    subscriptionText: 'No somos responsables de cancelar automáticamente sus suscripciones de terceros. Debe cancelarlas manualmente con el comerciante original.',
    liabilityHeading: '3. Limitación de Responsabilidad',
    liabilityText: 'SubMate no será responsable por ningún daño indirecto, incidental o consecuente.',
    disclaimerText: 'Aviso legal: La información financiera proporcionada es solo para fines informativos y no constituye asesoramiento financiero profesional.',
    terminationHeading: '4. Terminación',
    terminationText: 'Podemos cancelar o suspender su cuenta inmediatamente si incumple los Términos.'
  },
  fr: {
    title: 'Conditions d\'Utilisation',
    subtitle: 'Date d\'entrée en vigueur : Octobre 2023',
    acceptanceHeading: '1. Acceptation des Conditions',
    acceptanceText: 'En utilisant SubMate, vous acceptez d\'être lié par ces Conditions.',
    subscriptionHeading: '2. Gestion des Abonnements',
    subscriptionText: 'Nous ne sommes pas responsables de l\'annulation automatique de vos abonnements tiers.',
    liabilityHeading: '3. Limitation de Responsabilité',
    liabilityText: 'SubMate ne sera en aucun cas responsable des dommages indirects ou consécutifs.',
    disclaimerText: 'Avis de non-responsabilité : Les informations financières sont fournies à titre informatif uniquement.',
    terminationHeading: '4. Résiliation',
    terminationText: 'Nous pouvons résilier ou suspendre votre compte en cas de violation des Conditions.'
  },
  it: {
    title: 'Termini di Servizio',
    subtitle: 'Data di validità: Ottobre 2023',
    acceptanceHeading: '1. Accettazione dei Termini',
    acceptanceText: 'Utilizzando SubMate, accetti di essere vincolato da questi Termini.',
    subscriptionHeading: '2. Gestione degli Abbonamenti',
    subscriptionText: 'Non siamo responsabili per l\'annullamento automatico dei tuoi abbonamenti di terze parti.',
    liabilityHeading: '3. Limitazione di Responsabilità',
    liabilityText: 'SubMate non sarà responsabile per alcun danno indiretto o consequenziale.',
    disclaimerText: 'Disclaimer: Le informazioni finanziarie sono fornite solo a scopo informativo.',
    terminationHeading: '4. Risoluzione',
    terminationText: 'Possiamo chiudere o sospendere il tuo account in caso di violazione dei Termini.'
  },
  ru: {
    title: 'Условия использования',
    subtitle: 'Дата вступления в силу: октябрь 2023 г.',
    acceptanceHeading: '1. Принятие условий',
    acceptanceText: 'Используя SubMate, вы соглашаетесь с этими Условиями.',
    subscriptionHeading: '2. Управление подписками',
    subscriptionText: 'Мы не несем ответственности за автоматическую отмену ваших сторонних подписок.',
    liabilityHeading: '3. Ограничение ответственности',
    liabilityText: 'SubMate ни при каких обстоятельствах не несет ответственности за любой косвенный ущерб.',
    disclaimerText: 'Отказ от ответственности: Финансовая информация предоставляется только в ознакомительных целях.',
    terminationHeading: '4. Прекращение действия',
    terminationText: 'Мы можем удалить или приостановить действие вашей учетной записи в случае нарушения Условий.'
  }
};
