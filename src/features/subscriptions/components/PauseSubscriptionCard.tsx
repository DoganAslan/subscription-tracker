import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTranslation } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { triggerHaptic } from '@/utils/haptics';
import { Timestamp } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Props {
  subscription: Subscription;
  onUpdate: (data: Partial<Subscription>) => void;
}

export const PauseSubscriptionCard = ({ subscription, onUpdate }: Props) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const dynamicStyles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const isPaused = subscription.status === 'paused';
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() + 1)));

  const handleTogglePause = () => {
    triggerHaptic('medium');
    
    if (isPaused) {
      // Resume
      setIsLoading(true);
      onUpdate({ status: 'active', pauseEndDate: null });
      setTimeout(() => setIsLoading(false), 500);
    } else {
      // Pause - show date picker instead of immediate pause
      if (Platform.OS === 'web') {
        const title = t.features?.pauseSubscriptionTitle || 'Pause Subscription?';
        const msg = t.features?.pauseSubscriptionDesc || 'Paused subscriptions will not be counted in your monthly expenses.';
        if (window.confirm(`${title}\n\n${msg}`)) {
          setIsLoading(true);
          onUpdate({ status: 'paused', pauseEndDate: Timestamp.fromDate(selectedDate) });
          setTimeout(() => setIsLoading(false), 500);
        }
      } else {
        setShowDatePicker(true);
      }
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && date) {
      triggerHaptic('success');
      setIsLoading(true);
      onUpdate({ status: 'paused', pauseEndDate: Timestamp.fromDate(date) });
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  return (
    <View style={[dynamicStyles.container, isPaused ? dynamicStyles.pausedBorder : dynamicStyles.activeBorder]}>
      <View style={dynamicStyles.content}>
        <View style={[dynamicStyles.iconContainer, { backgroundColor: isPaused ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)' }]}>
          <Ionicons name={isPaused ? "play" : "pause"} size={24} color={isPaused ? "#3B82F6" : "#64748B"} />
        </View>
        <View style={dynamicStyles.textContainer}>
          <Text style={dynamicStyles.title}>
            {isPaused 
              ? (t.features?.subscriptionIsPaused || 'Subscription is Paused')
              : (t.features?.pauseSubscriptionTitle || 'Pause Subscription')}
          </Text>
          <Text style={dynamicStyles.description}>
            {isPaused 
              ? (subscription.pauseEndDate ? `Paused until ${subscription.pauseEndDate.toDate().toLocaleDateString()}. Tap to resume early.` : 'Tap to resume tracking this subscription in your expenses.')
              : (t.features?.pauseDesc || 'Temporarily exclude this from your expenses without deleting it.')}
          </Text>
        </View>
      </View>
      
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={onDateChange}
        />
      )}
      
      <TouchableOpacity 
        style={[dynamicStyles.button, isPaused ? dynamicStyles.resumeButton : dynamicStyles.pauseButton]}
        onPress={handleTogglePause}
        disabled={isLoading}
      >
        <Text style={[dynamicStyles.buttonText, isPaused ? dynamicStyles.resumeButtonText : dynamicStyles.pauseButtonText]}>
          {isPaused 
            ? (t.features?.resumeBtn || 'Resume')
            : (t.features?.pauseBtn || 'Pause')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    backgroundColor: colors.card,
  },
  activeBorder: {
    borderColor: colors.border,
  },
  pausedBorder: {
    borderColor: '#3B82F6',
    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.02)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButton: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9',
  },
  resumeButton: {
    backgroundColor: '#3B82F6',
  },
  pauseButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  resumeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  }
});


