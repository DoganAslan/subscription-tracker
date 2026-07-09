import { useTranslation } from '@/context/LanguageContext';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Subscription } from '@/services/firebase/types';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  card: Card;
  subscriptions: Subscription[];
  style?: ViewStyle;
  showPinToggle?: boolean;
  onTogglePin?: () => void;
}

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const getCardGradients = (type: string, fallbackColor: string) => {
  switch (type.toLowerCase()) {
    case 'visa':
      return ['#141E30', '#243B55'];
    case 'mastercard':
      return ['#FF416C', '#FF4B2B'];
    case 'amex':
      return ['#000046', '#1CB5E0'];
    case 'discover':
      return ['#FF8008', '#FFC837'];
    case 'jcb':
      return ['#11998E', '#38EF7D'];
    case 'troy':
      return ['#E52D27', '#B31217'];
    default:
      // Darken the fallback color slightly for gradient
      return [fallbackColor, fallbackColor + 'CC'];
  }
};

export function CardWidget({ card, subscriptions, style, showPinToggle, onTogglePin }: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const renderCardLogo = () => {
    const containerStyle = { width: 50, height: 30, justifyContent: 'center' as const, alignItems: 'flex-end' as const };
    const textLogoStyle = { paddingHorizontal: 4, paddingVertical: 2, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 4, alignItems: 'center' as const, justifyContent: 'center' as const };
    const textStyle = { color: 'rgba(255,255,255,0.9)', fontWeight: '900' as const, fontStyle: 'italic' as const, fontSize: 11, letterSpacing: 1 };
    
    switch (card.type.toLowerCase()) {
      case 'visa':
        return <View style={containerStyle}><FontAwesome name="cc-visa" size={32} color="#FFFFFF" /></View>;
      case 'mastercard':
        return <View style={containerStyle}><FontAwesome name="cc-mastercard" size={32} color="#FFFFFF" /></View>;
      case 'amex':
        return <View style={containerStyle}><FontAwesome name="cc-amex" size={32} color="#FFFFFF" /></View>;
      case 'discover':
        return <View style={containerStyle}><FontAwesome name="cc-discover" size={32} color="#FFFFFF" /></View>;
      case 'jcb':
        return <View style={containerStyle}><FontAwesome name="cc-jcb" size={32} color="#FFFFFF" /></View>;
      case 'diners':
        return <View style={containerStyle}><FontAwesome name="cc-diners-club" size={32} color="#FFFFFF" /></View>;
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

  const gradientColors = getCardGradients(card.type, card.color || '#2B32B2');

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {/* Abstract Glowing Orbs for Glassmorphism Effect */}
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />
      
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showPinToggle && (
              <TouchableOpacity onPress={onTogglePin} style={styles.pinButton}>
                <Ionicons name={card.isPinned ? "star" : "star-outline"} size={16} color={card.isPinned ? "#F59E0B" : "rgba(255,255,255,0.7)"} style={{ marginRight: 4 }} />
                <Text style={{ color: card.isPinned ? '#F59E0B' : 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                  {card.isPinned ? (t.walletPage?.featured || "Featured") : (t.walletPage?.pin || "Pin")}
                </Text>
              </TouchableOpacity>
            )}
            <Ionicons name="wifi" size={24} color="rgba(255,255,255,0.8)" style={{ transform: [{ rotate: '90deg' }] }} />
          </View>
        </View>
      
        <View style={styles.middleRow}>
          <Text style={styles.cardNumber}>
            •••• •••• •••• {card.lastFourDigits || '****'}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerCol}>
            <Text style={styles.label}>{t.global.exp}</Text>
            <Text style={styles.value}>
              {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear.toString().slice(-2)}
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
    padding: 24,
    minHeight: 200,
    marginBottom: 10,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  glowOrb1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 0,
    transform: [{ scale: 1.5 }],
    filter: 'blur(30px)' as any,
  },
  glowOrb2: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 0,
    transform: [{ scale: 1.2 }],
    filter: 'blur(40px)' as any,
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
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
    marginRight: 12,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  middleRow: {
    marginTop: 32,
    marginBottom: 24,
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 26,
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginBottom: 4,
    letterSpacing: 1.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
