import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { Subscription } from '@/services/firebase/types';
import { colors } from '@/theme/colors';

interface Props {
  renewals: Subscription[];
}

export function UpcomingRenewalsCard({ renewals }: Props) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const topRenewals = renewals.slice(0, 3);

  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: theme.cardShadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: theme.border }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>Upcoming Renewals</Text>
      
      {topRenewals.length === 0 ? (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
          <View style={{ width: 64, height: 64, backgroundColor: theme.background, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 24 }}>📅</Text>
          </View>
          <Text style={{ color: theme.textSecondary, fontWeight: '500' }}>No renewals in the next 30 days</Text>
        </View>
      ) : (
        topRenewals.map((sub, index) => {
          const date = sub.renewalDate.toDate();
          const isOverdue = date < new Date();
          const dateString = isOverdue ? 'Overdue' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          
          return (
            <View 
              key={sub.id} 
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: index !== topRenewals.length - 1 ? 1 : 0, borderBottomColor: theme.border }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>{sub.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={{ fontWeight: '600', color: theme.text }}>{sub.name}</Text>
                  <Text style={{ fontSize: 12, fontWeight: isOverdue ? '600' : 'normal', color: isOverdue ? theme.danger : theme.textSecondary }}>
                    {dateString}
                  </Text>
                </View>
              </View>
              <Text style={{ fontWeight: 'bold', color: theme.text }}>
                {sub.currency} {sub.amount.toFixed(2)}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}
