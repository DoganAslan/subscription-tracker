import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  count?: number;
}

export const SubscriptionSkeleton = ({ count = 1 }: Props) => {
  const { colors } = useTheme();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            backgroundColor: '#1F2937', // Strict dark theme token for card surface
            padding: 20,
            borderRadius: 20,
            flexDirection: 'column',
            borderWidth: 1,
            borderColor: '#374151',
            marginBottom: 16,
          }}
        >
          {/* Top Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {/* Icon Circle */}
              <Skeleton width={56} height={56} borderRadius={16} style={{ marginRight: 16 }} />
              
              {/* Name and Category */}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Skeleton width="60%" height={22} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="40%" height={16} borderRadius={4} />
              </View>
            </View>
            
            {/* Price */}
            <View style={{ alignItems: 'flex-end' }}>
              <Skeleton width={70} height={24} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width={90} height={14} borderRadius={4} />
            </View>
          </View>

          {/* Bottom Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 20 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Skeleton width="100%" height={56} borderRadius={14} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Skeleton width="100%" height={56} borderRadius={14} />
            </View>
          </View>
        </View>
      ))}
    </>
  );
};
