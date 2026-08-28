import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { createSubscriptionFormStyles } from '../subscriptionForm.styles';

interface SubscriptionFormActionsProps {
  isEdit: boolean;
  isLoading: boolean;
  isPending: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onDelete?: () => void;
}

export function SubscriptionFormActions({
  isEdit,
  isLoading,
  isPending,
  submitLabel,
  onSubmit,
  onDelete,
}: SubscriptionFormActionsProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createSubscriptionFormStyles(colors), [colors]);
  const disabled = isLoading || isPending;

  return (
    <View style={styles.buttonGroup}>
      <Button
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
        title={submitLabel}
        onPress={onSubmit}
        disabled={disabled}
        isLoading={disabled}
      />
      {isEdit && onDelete ? (
        <Button
          accessibilityRole="button"
          accessibilityLabel={t.global.deleteSubscription || 'Delete Subscription'}
          title={t.global.deleteSubscription || 'Delete Subscription'}
          variant="destructive"
          onPress={onDelete}
          disabled={disabled}
          style={styles.deleteButton}
        />
      ) : null}
    </View>
  );
}
