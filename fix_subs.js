const fs = require('fs');
let content = fs.readFileSync('src/locales/index.ts', 'utf8');

const defaultSubsObj = "subs: { addSubscription: 'Add Subscription', name: 'NAME', category: 'Category', billingCycle: 'BILLING CYCLE', notes: 'Notes' },";

// Just find 'subscriptionsPage: {' and prepend 'subs: ...' before it, OR append it after it.
content = content.replace(/subscriptionsPage: \{[^\}]+\},/g, (match) => {
  return defaultSubsObj + '\n    ' + match;
});

// Also make sure TranslationType has subs
content = content.replace(/  \[category: string\]/g, (match) => {
  return '  subs: { addSubscription: string; name: string; category: string; billingCycle: string; notes: string; };\n' + match;
});

fs.writeFileSync('src/locales/index.ts', content);


