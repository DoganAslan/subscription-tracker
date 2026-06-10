import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export function AppLoader() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
      <ActivityIndicator size="large" color="#0284c7" />
    </View>
  );
}
