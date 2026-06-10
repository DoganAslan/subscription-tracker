import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import Constants from 'expo-constants';

export default function AboutScreen() {
  const version = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';

  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-900 px-4 pt-8">
      <View className="items-center mb-10">
        <View className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-3xl items-center justify-center mb-4">
          <Text className="text-4xl">💎</Text>
        </View>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Subtrack</Text>
        <Text className="text-slate-500 dark:text-slate-400 mt-1">Version {version} ({buildNumber})</Text>
      </View>

      <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 mb-6">
        <Text className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Support</Text>
        <View className="flex-row justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
          <Text className="text-slate-700 dark:text-slate-300">Email</Text>
          <Text className="text-blue-600 dark:text-blue-400">support@subtrack.app</Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-slate-700 dark:text-slate-300">Website</Text>
          <Text className="text-blue-600 dark:text-blue-400">subtrack.app</Text>
        </View>
      </View>

      <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 mb-10">
        <Text className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Acknowledgements</Text>
        <Text className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          Built with React Native, Expo, and Firebase. Uses NativeWind for styling and React Query for state management.
        </Text>
      </View>
      
      <Text className="text-center text-slate-400 text-xs mb-8">
        © 2026 Subtrack Inc. All rights reserved.
      </Text>
    </ScrollView>
  );
}
