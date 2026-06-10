import React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function TermsOfUseScreen() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-900 px-4 pt-4 pb-12">
      <Text className="text-xl font-bold text-slate-900 dark:text-white mb-4">Terms of Use</Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400 mb-6">Last Updated: June 2026</Text>

      <View className="mb-6">
        <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">1. Acceptance of Terms</Text>
        <Text className="text-slate-700 dark:text-slate-300 leading-relaxed">
          By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">2. Use of Service</Text>
        <Text className="text-slate-700 dark:text-slate-300 leading-relaxed">
          This service is provided &quot;as is&quot; to help you track personal subscriptions. You agree not to misuse the service or help anyone else do so.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">3. User Accounts</Text>
        <Text className="text-slate-700 dark:text-slate-300 leading-relaxed">
          You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
        </Text>
      </View>

      <View className="mb-12">
        <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">4. Limitation of Liability</Text>
        <Text className="text-slate-700 dark:text-slate-300 leading-relaxed">
          In no event shall the developers be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
        </Text>
      </View>
    </ScrollView>
  );
}
