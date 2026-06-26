import i18n from '@/locales/i18n';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Card, Subscription } from '@/services/firebase/types';
import { getCardHealthStatus } from '@/utils/cardHealth';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

interface Props {
  card: Card;
  subscriptions: Subscription[];
  style?: ViewStyle;
}

export function CardWidget({ card, subscriptions, style }: Props) {
  const { colors } = useTheme();
  const { isHealthy, totalExpenses, reason } = getCardHealthStatus(card, subscriptions);
  const isExpired = reason === 'expired';
  const isNearingExpiry = reason === 'nearing_expiry';
  const isLimitExceeded = reason === 'limit_exceeded';

  const progressPercentage = Math.min((totalExpenses / card.limit) * 100, 100);
  
  let dangerColor = colors.danger;
  let warningColor = '#F59E0B'; // Amber
  
  const getBadge = () => {
    if (isExpired) return <View style={[styles.badge, { backgroundColor: dangerColor }]}><Text style={styles.badgeText}>{i18n.t('global.expired')}</Text></View>;
    if (isNearingExpiry) return <View style={[styles.badge, { backgroundColor: warningColor }]}><Text style={styles.badgeText}>{i18n.t('global.expiringSoon')}</Text></View>;
    if (isLimitExceeded) return <View style={[styles.badge, { backgroundColor: dangerColor }]}><Text style={styles.badgeText}>{i18n.t('global.limitExceeded')}</Text></View>;
    return null;
  };

  const getCardIcon = () => {
    switch (card.type) {
      case 'visa': return 'card'; // using fallback icons, in real app could use svg
      case 'mastercard': return 'card';
      case 'amex': return 'card';
      case 'troy': return 'card';
      default: return 'card-outline';
    }
  };

  const renderCardLogo = () => {
    const containerStyle = { width: 50, height: 30, justifyContent: 'center' as const, alignItems: 'flex-end' as const };
    switch (card.type) {
      case 'visa':
        return (
          <View style={containerStyle}>
            <FontAwesome name="cc-visa" size={32} color="#FFFFFF" />
          </View>
        );
      case 'mastercard':
        return (
          <View style={containerStyle}>
            <FontAwesome name="cc-mastercard" size={32} color="#FFFFFF" />
          </View>
        );
      case 'amex':
        return (
          <View style={containerStyle}>
            <FontAwesome name="cc-amex" size={32} color="#FFFFFF" />
          </View>
        );
      case 'troy':
        return (
          <View style={containerStyle}>
            <View style={{ paddingHorizontal: 4, paddingVertical: 2, borderWidth: 1.5, borderColor: '#FFFFFF', borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontStyle: 'italic', fontSize: 12, letterSpacing: 1 }}>{i18n.t('global.troy')}</Text>
            </View>
          </View>
        );
      default:
        return (
          <View style={containerStyle}>
            <Ionicons name="card" size={32} color="#FFFFFF" />
          </View>
        );
    }
  };

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'TRY': 
      default: return '₺';
    }
  };

  const formatAmount = (amount: number | string) => {
    const sym = getCurrencySymbol(card.currency);
    if (card.currency === 'TRY' || !card.currency) return `${amount} ${sym}`;
    return `${sym}${amount}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: card.color }, style]}>
      {/* Subtle overlay gradient simulator */}
      <View style={styles.gradientOverlay} />
      
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
          <Ionicons name="wifi" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '90deg' }] }} />
        </View>
      
      <View style={styles.middleRow}>
        <Text style={styles.cardNumber}>
          •••• •••• •••• {card.lastFourDigits || '****'}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerCol}>
          <Text style={styles.label}>{i18n.t('global.exp')}</Text>
          <Text style={styles.value}>
            {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear.toString().slice(-2)}
          </Text>
        </View>
        <View style={[styles.footerCol, { alignItems: 'flex-end', justifyContent: 'center' }]}>
          {renderCardLogo()}
        </View>
      </View>

      <View style={styles.healthContainer}>
        <View style={styles.healthHeader}>
          <Text style={styles.healthText}>
            <Text style={{ fontWeight: 'bold' }}>{formatAmount(totalExpenses.toFixed(0))}</Text> / {formatAmount(card.limit)} Limit
          </Text>
          {getBadge()}
        </View>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${progressPercentage}%`,
                backgroundColor: isLimitExceeded ? dangerColor : '#FFFFFF' 
              }
            ]} 
          />
        </View>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 24,
    minHeight: 200,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  middleRow: {
    marginTop: 28,
    marginBottom: 20,
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    letterSpacing: 3.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerCol: {
    flexDirection: 'column',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginBottom: 4,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  value: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  healthContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 16,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.9,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 9999,
  },
});
