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

  let monthlyTotal = '0.00';
  let nextPaymentName = 'None';
  let nextPaymentDate = '--';

  try {
    const cachedData = await AsyncStorage.getItem('widget_data');
    if (cachedData) {
      const data = JSON.parse(cachedData);
      monthlyTotal = data.monthlyTotal || '0.00';
      nextPaymentName = data.nextPaymentName || 'None';
      nextPaymentDate = data.nextPaymentDate || '--';
    }
  } catch (error) {
    console.error('Error reading widget data from AsyncStorage:', error);
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
      props.renderWidget(
        <Widget 
          monthlyTotal={monthlyTotal} 
          nextPaymentName={nextPaymentName} 
          nextPaymentDate={nextPaymentDate} 
        />
      );
      break;
    default:
      break;
  }
}
