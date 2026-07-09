import { Linking, Alert, Platform } from 'react-native';
import { SplitMember } from '@/services/firebase/types';
import { t } from '@/locales/i18n';

export const dispatchWhatsAppReminder = async (member: SplitMember, subName: string, currency = 'TRY') => {
  const cleanPhone = member.phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) {
    Alert.alert('Hata', 'Geçerli bir telefon numarası bulunamadı.');
    return;
  }

  const baseMsg = t.features?.whatsappReminderMsg || `Selam {{name}}! 👋 Bu ayki "{{subName}}" ortaklığımız için {{amount}} {{currency}} ödeme payın bulunuyor. Müsait olduğunda gönderebilirsen süper olur, teşekkürler! 🚀`;
  const msg = baseMsg
    .replace('{{name}}', member.name)
    .replace('{{subName}}', subName)
    .replace('{{amount}}', String(member.shareAmount))
    .replace('{{currency}}', currency);
  const encodedMsg = encodeURIComponent(msg);
  const url = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported || Platform.OS === 'web') {
      await Linking.openURL(url);
    } else {
      Alert.alert('Hata', 'Cihazınızda WhatsApp açılamadı.');
    }
  } catch (e) {
    console.error('[WhatsApp Bridge Error]:', e);
  }
};


