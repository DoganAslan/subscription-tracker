import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, UIManager, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { getSmartAlternatives, RecommendedTip } from '../utils/alternativesDb';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { triggerHaptic } from '@/utils/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  subscriptions: Subscription[];
}

export const SmartAlternativesCard = React.memo(function SmartAlternativesCard({ subscriptions }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const tips = React.useMemo(() => getSmartAlternatives(subscriptions), [subscriptions]);

  if (tips.length === 0) {
    return null; // Don't render anything if there are no smart tips
  }

  const toggleExpand = (index: number) => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Ionicons name="bulb" size={20} color="#FBBF24" />
        <Text style={dynamicStyles.title}>{t.features?.smartTipsTitle || 'Smart Tips'}</Text>
      </View>
      
      {tips.map((tipObj, index) => {
        const isExpanded = expandedIndex === index;
        return (
          <TouchableOpacity 
            key={index} 
            style={[dynamicStyles.tipItem, index === tips.length - 1 && { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() => toggleExpand(index)}
          >
            <View style={dynamicStyles.tipHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.subscriptionName}>
                  <Text style={{ fontWeight: '400', color: colors.textSecondary }}>{t.features?.insteadOf || 'Instead of: '}</Text>
                  {tipObj.tip.suggestedBrand}
                </Text>
                <Text style={dynamicStyles.triggerContext}>
                  {t.features?.becauseYouPayFor?.replace('{{subName}}', tipObj.subscriptionName) || `Because you pay for ${tipObj.subscriptionName}.`}
                </Text>
              </View>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </View>

            {isExpanded && (
              <View style={dynamicStyles.expandedContent}>
                <Text style={dynamicStyles.reasonText}>{t.features?.[tipObj.tip.translationKey] || tipObj.tip.reason}</Text>
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
    backgroundColor: 'rgba(251, 191, 36, 0.05)', // Subtle yellow/gold tint
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginHorizontal: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  title: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251, 191, 36, 0.15)',
  },
  tipHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
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
    opacity: 0.9,
  }
});



