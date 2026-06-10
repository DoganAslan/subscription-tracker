import React from 'react';
import { View, Text } from 'react-native';

export function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center p-6 mt-12">
      <View className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-6 shadow-sm">
        <Text className="text-4xl">📭</Text>
      </View>
      <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
        No Subscriptions Yet
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-center px-4 leading-relaxed">
        Tap the + button below to start tracking your recurring expenses.
      </Text>
    </View>
  );
}
