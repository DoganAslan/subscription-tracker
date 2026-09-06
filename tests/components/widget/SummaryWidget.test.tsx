import { StyleSheet } from 'react-native';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it } from '@jest/globals';
import { ImageWidget } from 'react-native-android-widget';
import { SummaryWidget } from '@/widgets/SummaryWidget';

const widgetProps = {
  monthlyTotal: '₺100.00',
  nextPaymentName: 'Netflix',
  nextPaymentDate: '29 Aug',
  nextPaymentMeta: 'Today',
  activeCount: 1,
  labels: {
    monthlyTotal: 'MONTHLY TOTAL',
    nextPayment: 'NEXT PAYMENT',
    activeSubscriptions: 'active subscriptions',
    appName: 'SUBMATE',
  },
};

function hasLogoImage(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  if (node.type === ImageWidget) return true;

  const element = node as ReactElement<{ children?: ReactNode }>;
  return Children.toArray(element.props.children).some(hasLogoImage);
}

describe('SummaryWidget layout', () => {
  it('keeps the outer border inside the widget bounds on every side', () => {
    const element = SummaryWidget(widgetProps) as ReactElement<{ style?: object }>;
    const style = StyleSheet.flatten(element.props.style) as Record<string, unknown>;

    expect(style.width).toBe('match_parent');
    expect(style.borderWidth).toBe(1);
    expect(style.marginHorizontal).toBeUndefined();
    expect(style.marginVertical).toBeUndefined();
  });

  it('uses the app logo in the widget header instead of a text-only mark', () => {
    const element = SummaryWidget(widgetProps) as ReactElement;

    expect(hasLogoImage(element)).toBe(true);
  });
});
