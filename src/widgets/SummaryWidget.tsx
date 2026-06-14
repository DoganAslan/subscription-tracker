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
        justifyContent: 'space-between',
        backgroundColor: '#0B0F19',
        padding: 12,
        height: 'match_parent',
        width: 'match_parent',
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'column',
          backgroundColor: '#1F2937',
          padding: 16,
          borderRadius: 16,
          height: 'match_parent',
          width: 'match_parent',
          justifyContent: 'center',
        }}
      >
        <TextWidget 
          text="TOTAL MONTHLY SPEND" 
          style={{ 
            fontSize: 10, 
            color: '#9CA3AF', 
            fontWeight: 'bold' 
          }} 
        />
        <TextWidget 
          text={monthlyTotal} 
          style={{ 
            fontSize: 22, 
            color: '#FFFFFF', 
            fontWeight: 'bold', 
            marginTop: 4 
          }} 
        />
        
        <FlexWidget
          style={{
            flexDirection: 'column',
            marginTop: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderColor: '#374151',
          }}
        >
          <TextWidget 
            text="NEXT PAYMENT" 
            style={{ 
              fontSize: 9, 
              color: '#9CA3AF', 
              fontWeight: 'bold' 
            }} 
          />
          <TextWidget 
            text={`${nextPaymentName} • ${nextPaymentDate}`} 
            style={{ 
              fontSize: 12, 
              color: '#E5E7EB', 
              marginTop: 4,
              fontWeight: 'bold'
            }} 
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
