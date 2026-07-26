import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface SummaryWidgetProps {
  monthlyTotal: string;
  nextPaymentName: string;
  nextPaymentDate: string;
}

export function SummaryWidget({ monthlyTotal, nextPaymentName, nextPaymentDate }: SummaryWidgetProps) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        backgroundColor: '#0B0F19',
        padding: 8,
        height: 'match_parent',
        width: 'match_parent',
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'column',
          backgroundColor: '#1E293B',
          padding: 14,
          borderRadius: 16,
          height: 'match_parent',
          width: 'match_parent',
          justifyContent: 'space-between',
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text="SUBMATE • AYLIK TOPLAM"
            style={{
              fontSize: 9,
              color: '#3B82F6',
              fontWeight: 'bold',
              letterSpacing: 0.5,
            }}
          />
          <TextWidget
            text={monthlyTotal}
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
            marginTop: 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderColor: '#334155',
          }}
        >
          <TextWidget
            text="SIRADAKİ ÖDEME"
            style={{
              fontSize: 8,
              color: '#94A3B8',
              fontWeight: 'bold',
            }}
          />
          <TextWidget
            text={`${nextPaymentName} • ${nextPaymentDate}`}
            style={{
              fontSize: 11,
              color: '#E2E8F0',
              marginTop: 2,
              fontWeight: 'bold',
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
