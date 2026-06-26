import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  trialEndDate?: string;
}

import { parseSafeDate, calculateDaysLeft } from '@/utils/dateHelpers';

export function TrialCountdownWidget({ trialEndDate }: Props) {
  if (!trialEndDate) return null;

  const end = parseSafeDate(trialEndDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  
  const hoursUntil = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60)));
  const daysUntil = calculateDaysLeft(end, now);
  
  let color = '#10B981'; // Safe Green
  let label = "Trial expires in " + daysUntil + " days";
  let isDanger = false;
  
  if (daysUntil <= 1) {
    color = '#EF4444'; // Danger Red
    label = "Trial expires in " + hoursUntil + " hours! Cancel now to avoid charges.";
    isDanger = true;
  } else if (daysUntil <= 3) {
    color = '#F59E0B'; // Warning Amber
  }

  // Calculate generic progress (max 7 days represented)
  const maxDays = 7;
  const progressRatio = Math.min(1, Math.max(0, daysUntil / maxDays));
  const progressPercentage = (progressRatio * 100) + '%';

  return (
    <View style={[styles.container, isDanger && styles.dangerContainer]}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={20} color={color} />
        <Text style={[styles.title, { color }]}>{label}</Text>
      </View>
      
      <View style={styles.track}>
        <View style={[styles.fill, { width: progressPercentage as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  dangerContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1
  },
  track: {
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: 3
  }
});
