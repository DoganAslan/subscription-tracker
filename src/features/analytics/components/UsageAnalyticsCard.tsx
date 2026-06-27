import i18n from '@/locales/i18n';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { getCancellationLink } from '../utils/cancellationMatrix';

type UsageFrequency = 'high' | 'medium' | 'low' | 'none';

interface Props {
  subscriptionName: string;
  usageFrequency?: UsageFrequency;
  usageScore?: number;
  onChangeFrequency: (freq: UsageFrequency, score: number) => void;
}

export function UsageAnalyticsCard({ subscriptionName, usageFrequency, usageScore, onChangeFrequency }: Props) {
  
  const handleSelect = (freq: UsageFrequency) => {
    let score = 0;
    switch (freq) {
      case 'high': score = 100; break;
      case 'medium': score = 60; break;
      case 'low': score = 25; break;
      case 'none': score = 0; break;
    }
    onChangeFrequency(freq, score);
  };

  const isZombie = usageScore !== undefined && usageScore < 40;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('global.usageAnalyticsRating')}</Text>
      
      <View style={styles.buttonRow}>
        <FrequencyButton 
          label="🔥 High" 
          selected={usageFrequency === 'high'} 
          onPress={() => handleSelect('high')} 
        />
        <FrequencyButton 
          label="⚡ Med" 
          selected={usageFrequency === 'medium'} 
          onPress={() => handleSelect('medium')} 
        />
        <FrequencyButton 
          label="💤 Low" 
          selected={usageFrequency === 'low'} 
          onPress={() => handleSelect('low')} 
        />
        <FrequencyButton 
          label="💀 None" 
          selected={usageFrequency === 'none'} 
          onPress={() => handleSelect('none')} 
        />
      </View>

      {usageScore !== undefined && (
        <View style={styles.scoreContainer}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>{i18n.t('global.usageScore')}</Text>
            <Text style={[styles.scoreValue, isZombie && styles.zombieText]}>{usageScore}%</Text>
          </View>
          
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill, 
                { width: (usageScore + '%') as any },
                isZombie ? styles.zombieFill : styles.healthyFill
              ]}
            />
          </View>
          
          {isZombie && (
            <View style={styles.zombieWarning}>
              <Text style={styles.zombieBadge}>{i18n.t('global.zombieSubscriptionDe')}</Text>
              <TouchableOpacity 
                style={styles.cancelWizardBtn}
                onPress={() => {
                  const url = getCancellationLink(subscriptionName);
                  Linking.openURL(url).catch(err => console.error("Could not open URL", err));
                }}
              >
                <Text style={styles.cancelWizardBtnText}>{i18n.t('global.cancelSubscriptionVi')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const FrequencyButton = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
  <TouchableOpacity 
    style={[styles.freqBtn, selected && styles.freqBtnSelected]} 
    onPress={onPress}
  >
    <Text style={[styles.freqBtnText, selected && styles.freqBtnTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8
  },
  freqBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  freqBtnSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#60A5FA'
  },
  freqBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600'
  },
  freqBtnTextSelected: {
    color: '#FFFFFF'
  },
  scoreContainer: {
    marginTop: 8
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8
  },
  scoreLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500'
  },
  scoreValue: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold'
  },
  zombieText: {
    color: '#EF4444'
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  healthyFill: {
    backgroundColor: '#10B981'
  },
  zombieFill: {
    backgroundColor: '#EF4444'
  },
  zombieWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  zombieBadge: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12
  },
  cancelWizardBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center'
  },
  cancelWizardBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15
  }
});
