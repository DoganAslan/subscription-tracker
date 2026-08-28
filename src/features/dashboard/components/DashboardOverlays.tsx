import type { User } from 'firebase/auth';
import type { Subscription } from '@/services/firebase/types';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ProfileDrawerModal } from '@/components/ProfileDrawerModal';
import { SubmateWrappedModal } from '@/features/analytics/components/SubmateWrappedModal';
import { AiChatModal } from '@/features/ai/components/AiChatModal';
import { HeroThemePickerModal } from './HeroThemePickerModal';
import type { ThemeColors } from '@/theme/colors';

type DashboardOverlaysProps = {
  colors: ThemeColors;
  isTurkish: boolean;
  user: User | null;
  userName: string;
  profileImage?: string | null;
  subscriptions: Subscription[];
  baseCurrency: string;
  isAiChatVisible: boolean;
  isHeroThemePickerVisible: boolean;
  isProfileDrawerVisible: boolean;
  isWrappedVisible: boolean;
  onOpenAiChat: () => void;
  onCloseAiChat: () => void;
  onCloseHeroThemePicker: () => void;
  onSelectHeroTheme: (colors: [string, string, string]) => void;
  onCloseProfileDrawer: () => void;
  onOpenWrapped: () => void;
  onCloseWrapped: () => void;
};

export function DashboardOverlays({
  colors,
  isTurkish,
  user,
  userName,
  profileImage,
  subscriptions,
  baseCurrency,
  isAiChatVisible,
  isHeroThemePickerVisible,
  isProfileDrawerVisible,
  isWrappedVisible,
  onOpenAiChat,
  onCloseAiChat,
  onCloseHeroThemePicker,
  onSelectHeroTheme,
  onCloseProfileDrawer,
  onOpenWrapped,
  onCloseWrapped,
}: DashboardOverlaysProps) {
  return (
    <>
      <FloatingActionButton
        color="#8B5CF6"
        icon="sparkles"
        label={isTurkish ? 'SubMate AI’a sor' : 'Ask SubMate AI'}
        onPress={onOpenAiChat}
      />
      <AiChatModal visible={isAiChatVisible} onClose={onCloseAiChat} />
      <HeroThemePickerModal
        visible={isHeroThemePickerVisible}
        colors={colors}
        isTurkish={isTurkish}
        onClose={onCloseHeroThemePicker}
        onSelect={onSelectHeroTheme}
      />
      <ProfileDrawerModal
        visible={isProfileDrawerVisible}
        onClose={onCloseProfileDrawer}
        userName={userName}
        userEmail={user?.email || undefined}
        userPhoto={profileImage || user?.photoURL || undefined}
        subscriptions={subscriptions}
        onOpenWrapped={onOpenWrapped}
      />
      <SubmateWrappedModal
        visible={isWrappedVisible}
        onClose={onCloseWrapped}
        subscriptions={subscriptions}
        baseCurrency={baseCurrency}
      />
    </>
  );
}
