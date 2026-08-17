import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryMeta } from '@/utils/categoryMeta';
import { useTranslation } from '@/context/LanguageContext';

interface Props {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  showIconOnly?: boolean;
}

export function CategoryBadge({ category, size = 'md', showIconOnly = false }: Props) {
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const meta = getCategoryMeta(category, isTurkish);

  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconSize = isSm ? 12 : isLg ? 16 : 14;
  const fontSize = isSm ? 10 : isLg ? 13 : 11;
  const paddingH = isSm ? 6 : isLg ? 12 : 8;
  const paddingV = isSm ? 2 : isLg ? 6 : 4;
  const radius = isSm ? 6 : isLg ? 12 : 8;

  return (
    <View style={[styles.badge, { backgroundColor: meta.bg, paddingHorizontal: paddingH, paddingVertical: paddingV, borderRadius: radius }]}>
      <Ionicons name={meta.icon as any} size={iconSize} color={meta.color} style={{ marginRight: showIconOnly ? 0 : 4 }} />
      {!showIconOnly && (
        <Text style={[styles.text, { color: meta.color, fontSize }]}>
          {meta.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
