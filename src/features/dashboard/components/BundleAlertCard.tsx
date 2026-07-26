import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { getBundleTips } from '../utils/alternativesDb';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  subscriptions: Subscription[];
}

export const BundleAlertCard = React.memo(function BundleAlertCard({ subscriptions }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);
  const bundles = React.useMemo(() => getBundleTips(subscriptions), [subscriptions]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (bundles.length === 0) return null;

  const toggleExpand = (index: number) => {
    triggerHaptic('medium');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Ionicons name="sparkles" size={20} color="#8B5CF6" />
        <Text style={dynamicStyles.title}>{t.features?.bundleAlertTitle || 'Bundle Intelligence'}</Text>
      </View>
      
      {bundles.map((bundle, index) => {
        const isExpanded = expandedIndex === index;
        
        return (
          <TouchableOpacity 
            key={index}
            style={[
              dynamicStyles.tipItem,
              index !== bundles.length - 1 && dynamicStyles.tipItemBorder
            ]}
            onPress={() => toggleExpand(index)}
            activeOpacity={0.7}
          >
            <View style={dynamicStyles.tipHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.subscriptionName}>
                  {t.features?.switchOptionsTo || 'Switch to: '}
                  <Text style={{ fontWeight: 'bold', color: '#8B5CF6' }}>{bundle.suggestedBundle}</Text>
                </Text>
                <Text style={dynamicStyles.triggerContext}>
                  {t.features?.bundleFoundMsg || 'Bundle opportunity found based on your subscriptions.'}
                </Text>
              </View>
              <Ionicons 
                name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={colors.textSecondary} 
              />
            </View>

            {isExpanded && (
              <View style={dynamicStyles.expandedContent}>
                <Text style={dynamicStyles.reasonText}>{t.features?.[bundle.translationKey] || bundle.reason}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
  },
  title: {
    color: '#8B5CF6',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tipItem: {
    padding: 16,
  },
  tipItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tipHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  triggerContext: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  reasonText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  }
});



