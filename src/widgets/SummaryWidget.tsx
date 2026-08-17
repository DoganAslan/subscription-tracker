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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0B0F19',
        padding: 6,
        height: 'match_parent',
        width: 'match_parent',
      }}
      clickAction="OPEN_APP"
    >
      <FlexWidget
        style={{
          flexDirection: 'column',
          backgroundColor: '#1E293B',
          padding: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#334155',
          height: 'match_parent',
          width: 'match_parent',
          justifyContent: 'space-between',
        }}
        clickAction="OPEN_APP"
      >
        <FlexWidget style={{ flexDirection: 'column' }} clickAction="OPEN_APP">
          <TextWidget
            text={`SUBMATE • ${labels.monthlyTotal}`}
            style={{
              fontSize: 10,
              color: '#3B82F6',
              fontWeight: 'bold',
              letterSpacing: 0.5,
            }}
          />
          <TextWidget
            text={monthlyTotal || '₺0.00'}
            style={{
              fontSize: 22,
              color: '#FFFFFF',
              fontWeight: 'bold',
              marginTop: 4,
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            flexDirection: 'column',
            marginTop: 6,
            paddingTop: 6,
            borderTopWidth: 1,
            borderColor: '#334155',
          }}
          clickAction="OPEN_APP"
        >
          <TextWidget
            text={labels.nextPayment}
            style={{
              fontSize: 9,
              color: '#94A3B8',
              fontWeight: 'bold',
            }}
          />
          <TextWidget
            text={nextPaymentName}
            style={{
              fontSize: 12,
              color: '#E2E8F0',
              marginTop: 2,
              fontWeight: 'bold',
            }}
          />
          <TextWidget
            text={`${nextPaymentDate} • ${nextPaymentMeta}`}
            style={{
              fontSize: 10,
              color: '#94A3B8',
              marginTop: 2,
            }}
          />
        </FlexWidget>

        <TextWidget
          text={`${activeCount} ${labels.activeSubscriptions}`}
          style={{
            fontSize: 10,
            color: '#38BDF8',
            fontWeight: 'bold',
            marginTop: 8,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
