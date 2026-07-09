import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';

interface Props {
  subscriptions: Subscription[];
}

export const PausedSubscriptionsCard = ({ subscriptions }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  if (!subscriptions) return null;

  const pausedSubs = subscriptions.filter(s => s.status === 'paused');

  if (pausedSubs.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="pause" size={24} color="#3B82F6" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {t.features?.pausedSubsTitle || 'Paused Subscriptions'}
        </Text>
        <Text style={styles.description}>
          {t.features?.pausedSubsDesc?.replace('{{count}}', String(pausedSubs.length)) || 
           `You have ${pausedSubs.length} paused subscription(s). They are not affecting your current monthly expenses.`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    padding: 8,
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#94A3B8', // slate-400
    fontSize: 13,
    lineHeight: 18,
  }
});


