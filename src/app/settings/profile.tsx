import { Text, SafeAreaView } from 'react-native';
import { useTranslation } from '@/context/LanguageContext';

export default function ProfileScreen() {
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#030712', padding: 24 }}>
      <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>{isTurkish ? 'Profil bilgileri' : 'Profile details'}</Text>
      <Text style={{ color: '#94A3B8', marginTop: 12 }}>{isTurkish ? 'Ad: dogan aslan' : 'Name: dogan aslan'}</Text>
      <Text style={{ color: '#94A3B8' }}>{isTurkish ? 'Durum: Bilgisayar mühendisliği öğrencisi' : 'Status: Computer engineering student'}</Text>
    </SafeAreaView>
  );
}


