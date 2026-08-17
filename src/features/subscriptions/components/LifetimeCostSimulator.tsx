import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { calculateMonthlyCosts } from '@/utils/calculations';
import { triggerHaptic } from '@/utils/haptics';
import { useTranslation } from '@/context/LanguageContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  subscription: Subscription;
}

export const LifetimeCostSimulator = ({ subscription }: Props) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const dynamicStyles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [selectedYears, setSelectedYears] = useState<number>(1);
  const [expanded, setExpanded] = useState(false);

  const monthlyCost = useMemo(() => {
    // Determine user's net out of pocket monthly cost
    const costs = calculateMonthlyCosts(subscription, subscription.currency);
    return costs.net;
  }, [subscription]);

  // If monthly cost is 0 (e.g. 100% split), there's no shock value. Let's still show it though.
  const totalCost = monthlyCost * 12 * selectedYears;

  const toggleExpand = () => {
    triggerHaptic('medium');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const selectYears = (years: number) => {
    triggerHaptic('selection');
    setSelectedYears(years);
  };

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: subscription.currency || 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <View style={dynamicStyles.container}>
      <TouchableOpacity 
        style={dynamicStyles.header} 
        activeOpacity={0.7} 
        onPress={toggleExpand}
      >
        <View style={dynamicStyles.headerLeft}>
          <Ionicons name="time" size={22} color="#F43F5E" />
          <Text style={dynamicStyles.title}>
            {t.features?.lifetimeCostTitle || 'Lifetime Cost Simulator'}
          </Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {expanded && (
        <View style={dynamicStyles.content}>
          <Text style={dynamicStyles.description}>
            {t.features?.lifetimeCostDesc || 'See how much this subscription will cost you in the long run if you never cancel it.'}
          </Text>

          <View style={dynamicStyles.buttonRow}>
            {[1, 3, 5, 10].map((years) => (
              <TouchableOpacity
                key={years}
                style={[
                  dynamicStyles.yearButton,
                  selectedYears === years && dynamicStyles.yearButtonActive
                ]}
                onPress={() => selectYears(years)}
              >
                <Text style={[
                  dynamicStyles.yearButtonText,
                  selectedYears === years && dynamicStyles.yearButtonTextActive
                ]}>
                  {years} {t.features?.yearsLabel || 'Years'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={dynamicStyles.resultContainer}>
            <Text style={dynamicStyles.resultLabel}>
              {t.features?.totalCostIn || 'Total cost in'} {selectedYears} {t.features?.yearsLabel || 'Years'}:
            </Text>
            <Text style={dynamicStyles.resultAmount}>
              {formatter.format(totalCost)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: isDark ? 'rgba(244, 63, 94, 0.1)' : 'rgba(244, 63, 94, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(244, 63, 94, 0.3)' : 'rgba(244, 63, 94, 0.2)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  iconContainer: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    padding: 8,
    borderRadius: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F43F5E',
  },
  expandIcon: {
    marginLeft: 'auto',
  },
  content: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(244, 63, 94, 0.1)' : 'rgba(244, 63, 94, 0.05)',
    marginTop: 8,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  yearButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  yearButtonActive: {
    backgroundColor: '#F43F5E',
    borderColor: '#F43F5E',
  },
  yearButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  yearButtonTextActive: {
    color: '#FFF',
  },
  resultContainer: {
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
    padding: 16,
    borderRadius: 12,
  },
  resultLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  resultAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F43F5E',
  }
});


