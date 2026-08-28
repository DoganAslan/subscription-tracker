import { View } from 'react-native';
import { DoomBanner } from '@/components/DoomBanner';
import type { DashboardContractAlert } from '../types';

type DashboardAlertsProps = {
  alerts: DashboardContractAlert[];
  onPress: (subscriptionId: string) => void;
};

export function DashboardAlerts({ alerts, onPress }: DashboardAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <View style={{ gap: 8 }}>
      {alerts.map(alert => (
        <DoomBanner
          key={alert.subscriptionId ?? `${alert.subscriptionName}-${alert.daysLeft}`}
          subName={alert.subscriptionName}
          daysLeft={alert.daysLeft}
          severity={alert.severity}
          onPress={() => alert.subscriptionId && onPress(alert.subscriptionId)}
        />
      ))}
    </View>
  );
}
