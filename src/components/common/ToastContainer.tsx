import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useToastStore } from '@/store/useToastStore';

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const hideToast = useToastStore((state) => state.hideToast);

  if (toasts.length === 0) return null;

  return (
    <View className="absolute top-16 left-4 right-4 z-50 flex-col gap-2">
      {toasts.map((toast) => (
        <TouchableOpacity
          key={toast.id}
          onPress={() => hideToast(toast.id)}
          className={`p-4 rounded-xl shadow-md flex-row items-center ${
            toast.type === 'error' ? 'bg-red-500' : 
            toast.type === 'success' ? 'bg-green-500' : 'bg-slate-800'
          }`}
        >
          <Text className="text-white font-medium flex-1">{toast.message}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
