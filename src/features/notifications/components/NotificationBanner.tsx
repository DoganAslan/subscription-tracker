import i18n from '@/locales/i18n';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { Alert } from '../utils/notificationEngine';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/utils/haptics';

interface Props {
  alerts: Alert[];
}

export function NotificationBanner({ alerts }: Props) {
  if (!alerts || alerts.length === 0) return null;

  const handleShare = async (alert: Alert) => {
    triggerHaptic('selection');
    const message = "Hi everyone! The " + alert.subscriptionName + " subscription is renewing tomorrow. Please make sure to send your shares on time!";
    try {
      await Share.share({ message });
    } catch (error) {
      console.log('Error sharing', error);
    }
  };

  return (
    <View style={styles.container}>
      {alerts.map((alert, index) => (
        <View key={alert.id || index.toString()} style={styles.bannerCard}>
          <View style={styles.contentRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={24} color="#FBBF24" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{alert.title}</Text>
              <Text style={styles.body}>{alert.body}</Text>
            </View>
          </View>
          
          {alert.isShared && (
            <TouchableOpacity 
              style={styles.shareButton} 
              onPress={() => handleShare(alert)}
            >
              <Ionicons name="share-social-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.shareButtonText}>{i18n.t('global.remindFriends')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12
  },
  bannerCard: {
    backgroundColor: '#1E1B4B', // Deep indigo
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FBBF24', // Amber accent
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconContainer: {
    marginRight: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 8,
    borderRadius: 20
  },
  textContainer: {
    flex: 1
  },
  title: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4
  },
  body: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5', // Indigo button
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14
  }
});
