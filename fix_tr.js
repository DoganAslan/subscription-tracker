const fs = require('fs');
let content = fs.readFileSync('src/locales/index.ts', 'utf8');

// Replace the English defaults injected under TR with the actual Turkish text.
const trOld = "subs: { addSubscription: 'Add Subscription', name: 'NAME', category: 'Category', billingCycle: 'BILLING CYCLE', notes: 'Notes' },\\n    subscriptionsPage: { title: 'Aboneliklerim'";
const trNew = "subs: { addSubscription: 'Abonelik Ekle', name: 'İSİM', category: 'Kategori', billingCycle: 'FATURA DÖNGÜSÜ', notes: 'Notlar' },\\n    subscriptionsPage: { title: 'Aboneliklerim'";

// We can just use split/join or string replace.
content = content.replace(/subs: \{ addSubscription: 'Add Subscription', name: 'NAME', category: 'Category', billingCycle: 'BILLING CYCLE', notes: 'Notes' \},\n    subscriptionsPage: \{ title: 'Aboneliklerim'/g, 
  "subs: { addSubscription: 'Abonelik Ekle', name: 'İSİM', category: 'Kategori', billingCycle: 'FATURA DÖNGÜSÜ', notes: 'Notlar' },\n    subscriptionsPage: { title: 'Aboneliklerim'"
);

fs.writeFileSync('src/locales/index.ts', content);


