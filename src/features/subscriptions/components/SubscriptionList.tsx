import React from 'react';
import { FlatList, RefreshControl, View, Text } from 'react-native';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { SubscriptionCard } from './SubscriptionCard';
import { EmptyState } from '@/components/EmptyState';
import { AppLoader } from '@/components/common/AppLoader';
import { useTranslation } from 'react-i18next';

export function SubscriptionList() {
  const { t } = useTranslation();
  const { data: subscriptions, isLoading, isError, refetch, isRefetching } = useSubscriptions();

  if (isLoading) {
    return <AppLoader />;
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center p-6 mt-12 bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900/30">
        <Text className="text-red-500 font-semibold text-lg text-center mb-2">
          {t('common.error')}
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-center">
          {t('home.failedToLoad')}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={subscriptions}
      keyExtractor={(item) => item.id!}
      renderItem={({ item }) => <SubscriptionCard subscription={item} />}
      contentContainerStyle={{ padding: 16, paddingBottom: 180 }} // paddingBottom accounts for FAB + Custom Tab Bar
      ListEmptyComponent={<EmptyState />}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={isRefetching} 
          onRefresh={refetch}
          tintColor="#0ea5e9"
          colors={['#0ea5e9']}
        />
      }
    />
  );
}
