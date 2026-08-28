import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/theme/colors';

type DashboardHeaderProps = {
  colors: ThemeColors;
  greeting: string;
  userName: string;
  userPhoto?: string | null;
  unreadNotificationCount: number;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
};

export function DashboardHeader({
  colors,
  greeting,
  userName,
  userPhoto,
  unreadNotificationCount,
  onOpenProfile,
  onOpenNotifications,
}: DashboardHeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.profileRow} activeOpacity={0.8} onPress={onOpenProfile}>
        {userPhoto ? (
          <Image source={{ uri: userPhoto }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{userName ? userName.charAt(0).toUpperCase() : 'U'}</Text>
          </View>
        )}
        <Text numberOfLines={1} style={[styles.greeting, { color: colors.text }]}>
          {greeting}, {userName.split(' ')[0]} 👋
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Open notifications"
        style={[styles.bellButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.7}
        onPress={onOpenNotifications}
      >
        <Ionicons name="notifications-outline" size={20} color={colors.text} />
        {unreadNotificationCount > 0 ? <View style={styles.badgeDot} /> : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  greeting: { flex: 1, minWidth: 0, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  bellButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 },
  badgeDot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' },
});
