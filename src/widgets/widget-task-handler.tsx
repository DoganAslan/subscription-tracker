import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SummaryWidget } from './SummaryWidget';

const nameToWidget = {
  SummaryWidget: SummaryWidget,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const Widget = nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];

  let monthlyTotal = '₺0.00';
  let nextPaymentName = 'Yok';
  let nextPaymentDate = '--';
  let nextPaymentMeta = 'Yeni abonelik ekleyin';
  let activeCount = 0;
  let labels = {
    monthlyTotal: 'AYLIK TOPLAM',
    nextPayment: 'SIRADAKİ ÖDEME',
    activeSubscriptions: 'aktif abonelik',
  };

  try {
    const cachedData = await AsyncStorage.getItem('widget_data');
    if (cachedData) {
      const data = JSON.parse(cachedData);
      monthlyTotal = data.monthlyTotal || '₺0.00';
      nextPaymentName = data.nextPaymentName || 'Yok';
      nextPaymentDate = data.nextPaymentDate || '--';
      nextPaymentMeta = data.nextPaymentMeta || nextPaymentMeta;
      activeCount = Number(data.activeCount) || 0;
      labels = { ...labels, ...data.labels };
    }
  } catch (error) {
    console.error('Error reading widget data from AsyncStorage:', error);
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
    case 'WIDGET_CLICK':
      if (Widget) {
        props.renderWidget(
          <Widget 
            monthlyTotal={monthlyTotal} 
            nextPaymentName={nextPaymentName} 
            nextPaymentDate={nextPaymentDate} 
            nextPaymentMeta={nextPaymentMeta}
            activeCount={activeCount}
            labels={labels}
          />
        );
      }
      break;
    default:
      break;
  }
}
