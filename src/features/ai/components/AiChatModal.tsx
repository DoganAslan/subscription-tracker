import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';
import { useSubscriptions } from '@/features/subscriptions/hooks/useSubscriptions';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { chatWithSubmateAi, ChatMessage } from '@/services/ai/gemini';
import { triggerHaptic } from '@/utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AiChatModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { currentLanguage } = useTranslation();
  const isTurkish = currentLanguage === 'tr';
  const { data: subscriptions = [] } = useSubscriptions();
  const baseCurrency = useCurrencyStore(state => state.baseCurrency);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: isTurkish
        ? 'Merhaba, ben SubMate YZ. Aboneliklerin ve bütçen hakkında net kararlar vermene yardımcı olacağım.'
        : 'Hi, I’m SubMate AI. I’ll help you make clear decisions about your subscriptions and budget.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollViewRef = useRef<ScrollView>(null);

  const quickPrompts = isTurkish
    ? [
        '💡 Bu ay nereden tasarruf edebilirim?',
        '🎵 Spotify vs Apple Music hangisini seçmeliyim?',
        '📊 Bütçe sağlık durumum nasıl?',
        '⚠️ Hangi aboneliklerimi iptal edebilirim?',
      ]
    : [
        '💡 Where can I save money this month?',
        '🎵 Spotify vs Apple Music comparison?',
        '📊 How is my budget health score?',
        '⚠️ Which subscriptions should I consider pausing?',
      ];

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [visible, messages]);

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    triggerHaptic('impactLight');
    setInput('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const responseText = await chatWithSubmateAi(
        queryText,
        [...messages, userMsg],
        subscriptions,
        baseCurrency,
        isTurkish
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
      triggerHaptic('selection');
    } catch (error) {
      console.error('Chat AI Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleRow}>
            <View style={styles.aiBadgeIcon}>
              <Ionicons name="sparkles" size={18} color="#8B5CF6" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isTurkish ? 'SubMate YZ Danışmanı' : 'SubMate AI Advisor'}
              </Text>
              <Text style={[styles.headerSub, { color: '#10B981' }]}>
                {isTurkish ? 'Kişisel finans desteği' : 'Your personal finance guide'}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Chat history */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.conversation}>
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.msgWrapper,
                  isUser ? styles.msgWrapperUser : styles.msgWrapperAi,
                ]}
              >
                {!isUser && (
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={15} color="#8B5CF6" />
                  </View>
                )}
                <View
                  style={[
                    styles.msgBubble,
                    isUser
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                  ]}
                >
                  {isUser ? (
                    <Text style={[styles.msgText, { color: '#FFFFFF' }]}>{msg.text}</Text>
                  ) : (
                    <Markdown style={markdownStyles(colors.text)}>{msg.text}</Markdown>
                  )}
                  <Text style={[styles.msgTime, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
                    {msg.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={[styles.msgWrapper, styles.msgWrapperAi]}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={15} color="#8B5CF6" />
              </View>
              <View style={[styles.msgBubble, styles.thinkingBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ActivityIndicator size="small" color="#8B5CF6" />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  {isTurkish ? 'Yanıt hazırlanıyor...' : 'Preparing your answer...'}
                </Text>
              </View>
            </View>
          )}
          </View>
        </ScrollView>

        {/* Quick Suggestion Pills */}
        <View style={styles.quickPillsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {quickPrompts.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSend(prompt)}
                style={[styles.quickPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.quickPillText, { color: colors.text }]}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View
          style={[
            styles.inputBarContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom + 6, 12),
            },
          ]}
        >
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder={isTurkish ? 'Aklındaki soruyu yaz...' : 'Ask about your subscriptions...'}
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
            style={[
              styles.sendBtn,
              { backgroundColor: input.trim() && !loading ? colors.primary : 'rgba(99, 102, 241, 0.4)' },
            ]}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const markdownStyles = (color: string) => ({
  body: {
    color,
    fontSize: 14,
    lineHeight: 21,
    margin: 0,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  strong: {
    color,
    fontWeight: '800' as const,
  },
  bullet_list: {
    marginTop: 2,
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexGrow: 1,
  },
  conversation: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    gap: 14,
  },
  msgWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    width: '100%',
  },
  msgWrapperUser: {
    justifyContent: 'flex-end',
  },
  msgWrapperAi: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  msgBubble: {
    maxWidth: '72%',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 21,
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  quickPillsRow: {
    paddingTop: 2,
    paddingBottom: 10,
  },
  quickPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
