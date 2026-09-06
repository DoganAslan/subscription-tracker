'use no memo';

import React from 'react';
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

export interface SummaryWidgetProps {
  monthlyTotal: string;
  nextPaymentName: string;
  nextPaymentDate: string;
  nextPaymentMeta: string;
  activeCount: number;
  labels: {
    monthlyTotal: string;
    nextPayment: string;
    activeSubscriptions: string;
    appName: string;
  };
}

export function SummaryWidget({
  monthlyTotal,
  nextPaymentName,
  nextPaymentDate,
  nextPaymentMeta,
  activeCount,
  labels,
}: SummaryWidgetProps) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        backgroundColor: '#0B1427',
        padding: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#5F8FD1',
        height: 'match_parent',
        width: 'match_parent',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
      clickAction="OPEN_APP"
    >
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ImageWidget
            image={require('../../assets/images/logo.png')}
            imageWidth={22}
            imageHeight={22}
            radius={7}
            style={{ marginRight: 6 }}
          />
          <TextWidget
            text={labels.appName}
            style={{
              fontSize: 11,
              color: '#B9A6FF',
              fontWeight: 'bold',
              letterSpacing: 0.8,
            }}
          />
        </FlexWidget>
        <TextWidget
          text={`${activeCount} ${labels.activeSubscriptions}`}
          style={{
            fontSize: 9,
            color: '#9EC9FF',
            fontWeight: 'bold',
            backgroundColor: '#101F40',
            borderRadius: 8,
            paddingHorizontal: 6,
            paddingVertical: 3,
          }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'column', marginTop: 5 }}>
        <TextWidget
          text={labels.monthlyTotal}
          style={{
            fontSize: 9,
            color: '#A5B4CF',
            fontWeight: 'bold',
            letterSpacing: 0.4,
          }}
        />
        <TextWidget
          text={monthlyTotal || '₺0.00'}
          style={{
            fontSize: 24,
            color: '#F8FAFC',
            fontWeight: 'bold',
            marginTop: 2,
            textShadowColor: '#4F46E5',
            textShadowRadius: 5,
            textShadowOffset: { width: 0, height: 1 },
          }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          flexDirection: 'column',
          marginTop: 7,
          borderTopWidth: 1,
          borderColor: '#243C67',
          paddingTop: 7,
        }}
      >
        <TextWidget
          text={`${labels.nextPayment} · ${nextPaymentName}`}
          maxLines={1}
          truncate="END"
          style={{
            fontSize: 10,
            color: '#D9E6FF',
            fontWeight: 'bold',
            adjustsFontSizeToFit: true,
          }}
        />
        <TextWidget
          text={`${nextPaymentDate} • ${nextPaymentMeta}`}
          style={{
            fontSize: 9,
            color: '#91A9D2',
            marginTop: 2,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
