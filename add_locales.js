const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'locales', 'index.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Insert healthScore for en
content = content.replace(
  /global: enJSON\.global\s*\n\s*\},/,
  `global: enJSON.global,
    healthScore: {
      excellent: 'Excellent Budget',
      good: 'Good Budget',
      warning: 'Budget Warning',
      vampirWarning: (category: string, count: number) => \`Vampire Alert: There are \${count} different subscriptions in the "\${category}" category. You can save money by eliminating one.\`
    }
  },`
);

// Insert healthScore for tr
content = content.replace(
  /global: trJSON\.global\s*\n\s*\}\s*\n\s*\/\/\s*FR, DE, ES, IT etc\. follow this exact strict TranslationType signature\.\.\.\s*\n\};/,
  `global: trJSON.global,
    healthScore: {
      excellent: 'Mükemmel Bütçe',
      good: 'İyi Bütçe',
      warning: 'Bütçe Uyarısı',
      vampirWarning: (category: string, count: number) => \`Vampir Uyarısı: "\${category}" kategorisinde \${count} farklı abonelik var. Birini eleyerek tasarruf edebilirsiniz.\`
    }
  },
  de: {
    ...enJSON, // TS structural fallback
    healthScore: {
      excellent: 'Exzellentes Budget',
      good: 'Gutes Budget',
      warning: 'Budget-Warnung',
      vampirWarning: (category: string, count: number) => \`Vampir-Warnung: Es gibt \${count} verschiedene Abonnements in der Kategorie "\${category}". Sie können Geld sparen, indem Sie eines kündigen.\`
    }
  } as any,
  fr: {
    ...enJSON,
    healthScore: {
      excellent: 'Budget Excellent',
      good: 'Bon Budget',
      warning: 'Alerte Budget',
      vampirWarning: (category: string, count: number) => \`Alerte Vampire: Il y a \${count} abonnements différents dans la catégorie "\${category}". Vous pouvez économiser de l'argent en en supprimant un.\`
    }
  } as any,
  es: {
    ...enJSON,
    healthScore: {
      excellent: 'Presupuesto Excelente',
      good: 'Buen Presupuesto',
      warning: 'Alerta de Presupuesto',
      vampirWarning: (category: string, count: number) => \`Alerta de Vampiro: Hay \${count} suscripciones diferentes en la categoría "\${category}". Puedes ahorrar dinero eliminando una.\`
    }
  } as any,
  it: {
    ...enJSON,
    healthScore: {
      excellent: 'Budget Eccellente',
      good: 'Buon Budget',
      warning: 'Avviso Budget',
      vampirWarning: (category: string, count: number) => \`Allerta Vampiro: Ci sono \${count} abbonamenti diversi nella categoria "\${category}". Puoi risparmiare denaro eliminandone uno.\`
    }
  } as any,
  pt: {
    ...enJSON,
    healthScore: {
      excellent: 'Orçamento Excelente',
      good: 'Bom Orçamento',
      warning: 'Aviso de Orçamento',
      vampirWarning: (category: string, count: number) => \`Alerta de Vampiro: Existem \${count} assinaturas diferentes na categoria "\${category}". Você pode economizar dinheiro eliminando uma.\`
    }
  } as any,
  nl: {
    ...enJSON,
    healthScore: {
      excellent: 'Uitstekend Budget',
      good: 'Goed Budget',
      warning: 'Budgetwaarschuwing',
      vampirWarning: (category: string, count: number) => \`Vampierwaarschuwing: Er zijn \${count} verschillende abonnementen in de categorie "\${category}". U kunt geld besparen door er een te elimineren.\`
    }
  } as any,
  pl: {
    ...enJSON,
    healthScore: {
      excellent: 'Doskonały Budżet',
      good: 'Dobry Budżet',
      warning: 'Ostrzeżenie Budżetowe',
      vampirWarning: (category: string, count: number) => \`Alarm Wampira: W kategorii "\${category}" znajduje się \${count} różnych subskrypcji. Możesz zaoszczędzić pieniądze, rezygnując z jednej.\`
    }
  } as any,
  ru: {
    ...enJSON,
    healthScore: {
      excellent: 'Отличный бюджет',
      good: 'Хороший бюджет',
      warning: 'Предупреждение о бюджете',
      vampirWarning: (category: string, count: number) => \`Предупреждение о вампирах: В категории "\${category}" \${count} разных подписок. Вы можете сэкономить деньги, отменив одну из них.\`
    }
  } as any,
  ja: {
    ...enJSON,
    healthScore: {
      excellent: '素晴らしい予算',
      good: '良い予算',
      warning: '予算警告',
      vampirWarning: (category: string, count: number) => \`ヴァンパイア警告：「\${category}」カテゴリに\${count}個の異なるサブスクリプションがあります。1つをキャンセルすることで節約できます.\`
    }
  } as any,
  zh: {
    ...enJSON,
    healthScore: {
      excellent: '优秀的预算',
      good: '良好的预算',
      warning: '预算警告',
      vampirWarning: (category: string, count: number) => \`吸血鬼警告：“\${category}”类别中有\${count}个不同的订阅。取消其中一个可以省钱.\`
    }
  } as any,
  ko: {
    ...enJSON,
    healthScore: {
      excellent: '훌륭한 예산',
      good: '좋은 예산',
      warning: '예산 경고',
      vampirWarning: (category: string, count: number) => \`뱀파이어 경고: "\${category}" 카테고리에 \${count}개의 다른 구독이 있습니다. 하나를 취소하여 돈을 절약할 수 있습니다.\`
    }
  } as any,
  ar: {
    ...enJSON,
    healthScore: {
      excellent: 'ميزانية ممتازة',
      good: 'ميزانية جيدة',
      warning: 'تحذير الميزانية',
      vampirWarning: (category: string, count: number) => \`تنبيه مصاصي الدماء: هناك \${count} اشتراكات مختلفة في فئة "\${category}". يمكنك توفير المال عن طريق إزالة واحد.\`
    }
  } as any,
  hi: {
    ...enJSON,
    healthScore: {
      excellent: 'उत्कृष्ट बजट',
      good: 'अच्छा बजट',
      warning: 'बजट चेतावनी',
      vampirWarning: (category: string, count: number) => \`पिशाच चेतावनी: "\${category}" श्रेणी में \${count} विभिन्न सदस्यताएँ हैं। आप एक को हटाकर पैसे बचा सकते हैं.\`
    }
  } as any,
  sv: {
    ...enJSON,
    healthScore: {
      excellent: 'Utmärkt Budget',
      good: 'Bra Budget',
      warning: 'Budgetvarning',
      vampirWarning: (category: string, count: number) => \`Vampyrvarning: Det finns \${count} olika prenumerationer i kategorin "\${category}". Du kan spara pengar genom att avsluta en.\`
    }
  } as any,
  no: {
    ...enJSON,
    healthScore: {
      excellent: 'Utmerket Budsjett',
      good: 'Godt Budsjett',
      warning: 'Budsjettadvarsel',
      vampirWarning: (category: string, count: number) => \`Vampyradvarsel: Det er \${count} forskjellige abonnementer i kategorien "\${category}". Du kan spare penger ved å avslutte ett.\`
    }
  } as any,
  da: {
    ...enJSON,
    healthScore: {
      excellent: 'Fremragende Budget',
      good: 'Godt Budget',
      warning: 'Budgetadvarsel',
      vampirWarning: (category: string, count: number) => \`Vampyradvarsel: Der er \${count} forskellige abonnementer i kategorien "\${category}". Du kan spare penge ved at opsige et.\`
    }
  } as any,
  fi: {
    ...enJSON,
    healthScore: {
      excellent: 'Erinomainen Budjetti',
      good: 'Hyvä Budjetti',
      warning: 'Budjettivaroitus',
      vampirWarning: (category: string, count: number) => \`Vampyyrivaroitus: "\${category}" -kategoriassa on \${count} eri tilausta. Voit säästää rahaa perumalla yhden.\`
    }
  } as any,
  el: {
    ...enJSON,
    healthScore: {
      excellent: 'Εξαιρετικός Προϋπολογισμός',
      good: 'Καλός Προϋπολογισμός',
      warning: 'Προειδοποίηση Προϋπολογισμού',
      vampirWarning: (category: string, count: number) => \`Προειδοποίηση Βαμπίρ: Υπάρχουν \${count} διαφορετικές συνδρομές στην κατηγορία "\${category}". Μπορείτε να εξοικονομήσετε χρήματα ακυρώνοντας μία.\`
    }
  } as any
};
`
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated locales/index.ts with 20 languages and healthScore variables.');
