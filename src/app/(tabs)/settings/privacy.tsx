import React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-900 px-4 pt-4 pb-12">
      <Text className="text-xl font-bold text-slate-900 dark:text-white mb-4">Privacy Policy</Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400 mb-6">Last Updated: June 2026</Text>

      <View className="mb-6">
        <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">1. Information We Collect</Text>
        <Text className="text-slate-700 dark:text-slate-300 leading-relaxed">
          We collect information you provide directly to us, such as your email address when you create an account, and the subscription data you input into the application to track your expenses.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">2. How We Use Information</Text>
        <Text className="text-slate-700 dark:text-slate-300 leading-relaxed">
          We use the information we collect to provide, maintain, and improve our services, including calculating your subscription analytics and sending you push notifications for upcoming renewals.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">3. Data Security</Text>
        <Text className="text-slate-700 dark:text-slate-300 leading-relaxed">
          Your data is securely stored using industry-standard encryption via Firebase. We implement strict security rules to ensure only your authenticated account can access your subscription data.
        </Text>
      </View>

      <View className="mb-12">
        <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">4. Data Deletion</Text>
        <Text className="text-slate-700 dark:text-slate-300 leading-relaxed">
          You have the right to request the deletion of your personal data at any time. You can do this directly from the Settings menu using the &quot;Delete Account&quot; feature, which instantly purges all your data from our servers.
        </Text>
      </View>
    </ScrollView>
  );
}
