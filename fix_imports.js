const fs = require('fs');
const path = require('path');

function replaceImport(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) return;
  let content = fs.readFileSync(absolutePath, 'utf8');
  if (content.includes("import { useTranslation } from 'react-i18next';")) {
    content = content.replace("import { useTranslation } from 'react-i18next';", "import { useTranslation } from '@/context/LanguageContext';");
    fs.writeFileSync(absolutePath, content);
    console.log('Fixed ' + filePath);
  }
}

const files = [
  'src/app/(tabs)/index.tsx',
  'src/app/(tabs)/settings/about.tsx',
  'src/app/(tabs)/settings/privacy.tsx',
  'src/app/(tabs)/settings/terms.tsx',
  'src/app/(tabs)/subscriptions/index.tsx',
  'src/components/EmptyState.tsx',
  'src/features/auth/components/LoginForm.tsx',
  'src/features/dashboard/components/CategoryBreakdownCard.tsx',
  'src/features/dashboard/components/SpendingInsightsCard.tsx',
  'src/features/subscriptions/components/SubscriptionList.tsx'
];

files.forEach(replaceImport);


