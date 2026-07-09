import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Alert } from 'react-native';
import { t } from '@/locales/i18n';

const KNOWN_KEYS = [
  '@submate_biometric_enabled',
  'hasSeenOnboarding',
  'widget_data',
  'user-language',
  'theme_mode',
  'currency-storage',
  'profile-storage',
  'security-storage'
];

export const exportVaultBackup = async () => {
  try {
    const multiData = await AsyncStorage.multiGet(KNOWN_KEYS);
    const backupObject: Record<string, any> = {
      _manifest: { app: 'SubMate_Sovereign_Vault', version: 2.1, timestamp: Date.now() },
      data: {}
    };

    multiData.forEach(([key, value]) => {
      if (value) {
        try { backupObject.data[key] = JSON.parse(value); } 
        catch { backupObject.data[key] = value; }
      }
    });

    const jsonString = JSON.stringify(backupObject, null, 2);
    const fileName = `SubMate_Backup_${new Date().toISOString().slice(0, 10)}.json`;

    if (Platform.OS === 'web') {
      // Web Browser Safe Blob Download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } else {
      // Native iOS / Android File System Share
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(fileUri);
      else Alert.alert('Başarılı', `Yedek oluşturuldu: ${fileUri}`);
    }
  } catch (e) {
    console.error('[Vault Export Error]:', e);
    Alert.alert('Hata', 'Yedekleme dosyası oluşturulamadı.');
  }
};

export const importVaultBackup = async (onSuccessReload: () => void) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    let fileContent = '';

    if (Platform.OS === 'web' && asset.file) {
      fileContent = await asset.file.text();
    } else {
      fileContent = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
    }

    const parsed = JSON.parse(fileContent);

    // STRICT SECURITY GUARD: Verify manifest
    if (!parsed._manifest || parsed._manifest.app !== 'SubMate_Sovereign_Vault') {
      Alert.alert('Geçersiz Dosya', 'Seçtiğiniz dosya geçerli bir SubMate yedek kasası değil!');
      return;
    }

    const confirmAction = async () => {
      const entries = Object.entries(parsed.data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]);
      await AsyncStorage.multiSet(entries as [string, string][]);
      Alert.alert('Kasa Mühürlendi', 'tüm verileriniz başarıyla geri yüklendi.', [{ text: 'Tamam', onPress: onSuccessReload }]);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Mevcut verileriniz silinip yedeğiniz geri yüklenecek. Onaylıyor musunuz?')) await confirmAction();
    } else {
      Alert.alert('Kayıtları Üzerine Yaz', 'Mevcut tüm kasalarınız silinecek ve bu yedek dosyası işlenecek. Emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Geri Yükle', style: 'destructive', onPress: confirmAction }
      ]);
    }
  } catch (e) {
    console.error('[Vault Import Error]:', e);
    Alert.alert('Hata', 'Dosya okunamadı veya bozuk bir JSON şeması.');
  }
};
