import { useTranslation } from '@/context/LanguageContext';
import { View, Text, StyleSheet, ViewStyle, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Subscription } from '@/services/firebase/types';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { analyzeCardHealth } from '../services/cardWatchdog';

interface Props {
  card: Card;
  subscriptions: Subscription[];
  style?: ViewStyle;
  showPinToggle?: boolean;
  onTogglePin?: () => void;
}

Dimensions.get('window');

const getCardGradients = (type: string, fallbackColor: string): [string, string] => {
  // Always use the card's own color as the base gradient
  const baseColor = fallbackColor || '#1E3A8A';
  
  // Create a slightly lighter version for the gradient end
  // by mixing with a type-specific tint
  const typeTints: Record<string, string> = {
    visa: '#1E3A8A',
    mastercard: '#BE123C',
    amex: '#047857',
    discover: '#C2410C',
    jcb: '#38EF7D',
    troy: '#B91C1C',
  };
  
  const tint = typeTints[type.toLowerCase()];
  
  // If the card has a custom color (not default), always use it
  if (baseColor !== '#1E3A8A' || !tint) {
    return [baseColor, baseColor + 'CC'];
  }
  
  // For default color, use type-specific gradient
  if (tint) {
    return [baseColor, tint];
  }
  
  return [baseColor, baseColor + 'CC'];
};

export function CardWidget({ card, subscriptions, style, showPinToggle, onTogglePin }: Props) {
  const { t, currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  const linkedSubs = subscriptions?.filter(s => s.cardId === card.id) || [];
  const health = analyzeCardHealth(card, subscriptions);

  const renderCardLogo = () => {
    const containerStyle = { width: 60, height: 32, justifyContent: 'center' as const, alignItems: 'flex-end' as const };
    const textLogoStyle = { paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 6, alignItems: 'center' as const, justifyContent: 'center' as const };
    const textStyle = { color: 'rgba(255,255,255,0.95)', fontWeight: '900' as const, fontStyle: 'italic' as const, fontSize: 12, letterSpacing: 1 };
    
    switch (card.type.toLowerCase()) {
      case 'visa':
        return <View style={containerStyle}><FontAwesome name="cc-visa" size={36} color="#FFFFFF" /></View>;
      case 'mastercard':
        return <View style={containerStyle}><FontAwesome name="cc-mastercard" size={36} color="#FFFFFF" /></View>;
      case 'amex':
        return <View style={containerStyle}><FontAwesome name="cc-amex" size={36} color="#FFFFFF" /></View>;
      case 'discover':
        return <View style={containerStyle}><FontAwesome name="cc-discover" size={36} color="#FFFFFF" /></View>;
      case 'jcb':
        return <View style={containerStyle}><FontAwesome name="cc-jcb" size={36} color="#FFFFFF" /></View>;
      case 'diners':
        return <View style={containerStyle}><FontAwesome name="cc-diners-club" size={36} color="#FFFFFF" /></View>;
      case 'troy':
        return <View style={containerStyle}><View style={textLogoStyle}><Text style={textStyle}>{t.global?.troy || 'TROY'}</Text></View></View>;
      case 'unionpay':
        return <View style={containerStyle}><View style={textLogoStyle}><Text style={textStyle}>UNIONPAY</Text></View></View>;
      case 'maestro':
        return <View style={containerStyle}><View style={textLogoStyle}><Text style={textStyle}>MAESTRO</Text></View></View>;
      default:
        return <View style={containerStyle}><Ionicons name="card" size={32} color="#FFFFFF" /></View>;
    }
  };

  const gradientColors = getCardGradients(card.type, card.color || '#1E3A8A');

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {/* Glassmorphism shine background layers */}
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />
      
      <View style={styles.contentContainer}>
        {/* Header: Card Name & Pin */}
        <View style={styles.header}>
          <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {health.isExpiringSoon && (
              <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '900' }}>{isTurkish ? 'SÜRESİ DOLUYOR' : 'EXPIRING'}</Text>
              </View>
            )}
            {showPinToggle && (
              <TouchableOpacity onPress={onTogglePin} style={styles.pinButton} activeOpacity={0.8}>
                <Ionicons name={card.isPinned ? "star" : "star-outline"} size={14} color={card.isPinned ? "#F59E0B" : "#FFFFFF"} style={{ marginRight: 3 }} />
                <Text style={{ color: card.isPinned ? '#F59E0B' : '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                  {card.isPinned ? (isTurkish ? 'ÖNE ÇIKAN' : 'FEATURED') : (isTurkish ? 'SABİTLE' : 'PIN')}
                </Text>
              </TouchableOpacity>
            )}
            <Ionicons name="wifi-outline" size={22} color="rgba(255,255,255,0.9)" style={{ transform: [{ rotate: '90deg' }] }} />
          </View>
        </View>

        {/* EMV Chip & Linked Subscriptions Pill Row */}
        <View style={styles.chipRow}>
          {/* Metallic Golden EMV Chip */}
          <LinearGradient
            colors={['#FDE047', '#CA8A04']}
            style={styles.emvChip}
          >
            <View style={styles.chipLineHorizontal} />
            <View style={styles.chipLineVertical} />
          </LinearGradient>

          {linkedSubs.length > 0 && (
            <View style={styles.linkedBadge}>
              <Ionicons name="link-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.linkedBadgeText}>
                {linkedSubs.length} Linked Sub{linkedSubs.length === 1 ? '' : 's'}
              </Text>
            </View>
          )}
        </View>

        {/* Card Limit Watchdog Progress Bar */}
        {card.monthlyLimit && card.monthlyLimit > 0 ? (
          <View style={{ marginTop: 8, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700' }}>
                Limit: {health.totalMonthlySpent.toFixed(0)} / {card.monthlyLimit} {card.currency || 'TRY'} ({health.usedPercentage}%)
              </Text>
              {health.isNearLimit && (
                <Text style={{ color: '#FDE047', fontSize: 10, fontWeight: '800' }}>⚠️ %80+ Yük</Text>
              )}
            </View>
            <View style={{ width: '100%', height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
              <View
                style={{
                  height: '100%',
                  width: `${health.usedPercentage}%`,
                  backgroundColor: health.isOverLimit ? '#EF4444' : health.isNearLimit ? '#FDE047' : '#10B981',
                }}
              />
            </View>
          </View>
        ) : null}

        {/* Card Number Row */}
        <View style={styles.middleRow}>
          <Text style={styles.cardNumber}>
            •••• •••• •••• {card.lastFourDigits || '****'}
          </Text>
        </View>

        {/* Footer: Expiration Date & Brand Logo */}
        <View style={styles.footerRow}>
          <View style={styles.footerCol}>
            <Text style={styles.label}>{t.global?.exp || 'VALID THRU'}</Text>
            <Text style={styles.value}>
              {health.expiryFormatted !== '--'
                ? health.expiryFormatted
                : `${card.expiryMonth.toString().padStart(2, '0')}/${card.expiryYear.toString().slice(-2)}`}
            </Text>
          </View>
          <View style={[styles.footerCol, { alignItems: 'flex-end', justifyContent: 'center' }]}>
            {renderCardLogo()}
          </View>
        </View>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 22,
    minHeight: 210,
    marginBottom: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  glowOrb1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
    zIndex: 0,
  },
  glowOrb2: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
    marginRight: 12,
    letterSpacing: 0.5,
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emvChip: {
    width: 44,
    height: 32,
    borderRadius: 7,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  chipLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  chipLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  linkedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  middleRow: {
    marginBottom: 16,
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerCol: {
    flexDirection: 'column',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    marginBottom: 2,
    letterSpacing: 1,
    fontWeight: '700',
  },
  value: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
