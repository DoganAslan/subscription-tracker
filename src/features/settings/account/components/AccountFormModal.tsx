import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getKeyboardLayout } from '@/components/layout/keyboardLayout';
import type { ThemeColors } from '@/theme/colors';

const ACCOUNT_FORM_HEADER_HEIGHT = 52;

interface AccountFormModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  colors: ThemeColors;
  danger?: boolean;
  pending: boolean;
  children: ReactNode;
  cancelLabel: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: () => void;
}

export function AccountFormModal({
  visible,
  title,
  subtitle,
  colors,
  danger = false,
  pending,
  children,
  cancelLabel,
  submitLabel,
  onClose,
  onSubmit,
}: AccountFormModalProps) {
  const { height: windowHeight } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(ACCOUNT_FORM_HEADER_HEIGHT);
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'web' ? 'web' : 'android';
  const keyboardLayout = getKeyboardLayout(platform, top, headerHeight);
  const availableHeight = Math.max(windowHeight - top - bottom, 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} {...keyboardLayout}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View
          testID="account-form-card"
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: danger ? '#EF4444' : colors.border,
              maxHeight: availableHeight,
            },
          ]}
        >
          <View
            testID="account-form-header"
            onLayout={({ nativeEvent }) => setHeaderHeight(nativeEvent.layout.height)}
            style={styles.header}
          >
            <View style={styles.copy}>
              <Text style={[styles.title, { color: danger ? '#EF4444' : colors.text }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            testID="account-form-scroll"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.form, { paddingBottom: bottom + 20 }]}
          >
            {children}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>{cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={pending}
                style={[
                  styles.button,
                  {
                    backgroundColor: danger ? '#EF4444' : colors.primary,
                    opacity: pending ? 0.55 : 1,
                  },
                ]}
                onPress={onSubmit}
              >
                <Text style={[styles.buttonText, { color: '#FFF' }]}>{submitLabel}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,.62)',
  },
  dismiss: {
    position: 'absolute',
    inset: 0,
  },
  card: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  form: {
    gap: 12,
    paddingTop: 18,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  button: {
    minHeight: 46,
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
