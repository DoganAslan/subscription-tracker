import i18n from '@/locales/i18n';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export const AboutSignature = () => {
  const { colors } = useTheme();
  const dynamicStyles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.version}>{i18n.t('global.submateV130')}</Text>
      <View style={dynamicStyles.signatureBox}>
        <Text style={dynamicStyles.signatureText}>{i18n.t('global.craftedWithPassionBy')}</Text>
      </View>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  version: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  signatureBox: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signatureText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
  }
});
