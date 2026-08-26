'use no memo';

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

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
        backgroundColor: '#111C33',
        padding: 14,
        borderRadius: 22,
        borderWidth: 1,
        borderRightWidth: 2,
        borderColor: '#29405F',
        height: 'match_parent',
        width: 'match_parent',
        marginHorizontal: 8,
        marginVertical: 4,
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
      clickAction="OPEN_APP"
    >
      <FlexWidget
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        clickAction="OPEN_APP"
      >
        <TextWidget
          text={`✦ ${labels.appName}`}
          style={{
            fontSize: 11,
            color: '#A78BFA',
            fontWeight: 'bold',
            letterSpacing: 0.7,
            marginRight: 8,
          }}
        />
        <TextWidget
          text={`${activeCount} ${labels.activeSubscriptions}`}
          style={{
            fontSize: 10,
            color: '#7DD3FC',
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'column', marginTop: 7 }} clickAction="OPEN_APP">
        <TextWidget
          text={labels.monthlyTotal}
          style={{
            fontSize: 10,
            color: '#94A3B8',
            fontWeight: 'bold',
            letterSpacing: 0.4,
          }}
        />
        <TextWidget
          text={monthlyTotal || '₺0.00'}
          style={{
            fontSize: 27,
            color: '#F8FAFC',
            fontWeight: 'bold',
            marginTop: 2,
          }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          flexDirection: 'column',
          backgroundColor: '#172554',
          borderRadius: 13,
          marginTop: 9,
          padding: 9,
          borderTopWidth: 1,
          borderColor: '#355484',
        }}
        clickAction="OPEN_APP"
      >
        <TextWidget
          text={labels.nextPayment}
          style={{
            fontSize: 9,
            color: '#93C5FD',
            fontWeight: 'bold',
            letterSpacing: 0.3,
          }}
        />
        <TextWidget
          text={nextPaymentName}
          style={{
            fontSize: 12,
            color: '#FFFFFF',
            marginTop: 2,
            fontWeight: 'bold',
          }}
        />
        <TextWidget
          text={`${nextPaymentDate} • ${nextPaymentMeta}`}
          style={{
            fontSize: 10,
            color: '#BFDBFE',
            marginTop: 2,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
