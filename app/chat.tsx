import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native';
import { Send, Trash2 } from 'lucide-react-native';
import { streamReflection, saveChat } from '../services/openai';
import { parseStreamedContent, ParsedContent } from '../utils/parser';

const PROMPTS = [
  { emoji: '🌿', text: "I'm feeling overwhelmed. How can Islam help me find peace?" },
  { emoji: '🤲', text: "How do I strengthen my connection with Allah day to day?" },
  { emoji: '💭', text: "I'm struggling to forgive someone. What does Islam say?" },
  { emoji: '⭐', text: "What's the Islamic perspective on gratitude and how do I practice it?" },
  { emoji: '🌙', text: "I have a big decision to make. How can I seek guidance?" },
  { emoji: '📖', text: "Share a verse that can bring me comfort during hardship." },
];
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { IslamicPattern, Mosque } from '../components/IslamicElements';
import { BlurView } from 'expo-blur';
import Paywall from '../components/Paywall';
import { useAppAlert } from '../components/AppAlert';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Chat() {
  const [messages, setMessages] = useState<Array<{ role: string, content: string, parsed?: ParsedContent }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showLimitOverlay, setShowLimitOverlay] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [visuallyClear, setVisuallyClear] = useState(false);
  const { showAlert, alertElement } = useAppAlert();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const inputBottomPadding = isKeyboardVisible
    ? Math.max(insets.bottom, 16)
    : Math.max(insets.bottom + 84, Platform.OS === 'ios' ? 120 : 100);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const params = useLocalSearchParams();
  const router = useRouter();
  const hasProcessedInitialMessage = useRef(false);

  const { language, t } = useLanguage();
  const {
    reflectionCount,
    incrementReflectionCount,
    llmCallsRemaining,
    decrementLlmCallsRemaining,
    user,
    session,
    isSubscribed,
  } = useUser();
  const { colors, isDark } = useTheme();

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.83.228.127:8000/api';

  // Load chat history for logged-in users on mount
  useEffect(() => {
    if (!user || !session?.access_token || params.initialMessage) return;
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/chat/history/`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (data.chats && data.chats.length > 0) {
          const loaded = data.chats.flatMap((chat: { prompt: string; response: string }) => [
            { role: 'user', content: chat.prompt },
            { role: 'assistant', content: chat.response, parsed: parseStreamedContent(chat.response) },
          ]);
          setMessages(loaded);
        }
      } catch (e) {
        console.log('Could not load chat history:', e);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [user, session]);

  useEffect(() => {
    if (params.initialMessage && !hasProcessedInitialMessage.current) {
      hasProcessedInitialMessage.current = true;
      handleSend(params.initialMessage as string);
    }
  }, [params.initialMessage]);

  const handleSend = async (messageText = input) => {
    if (!messageText.trim()) return;

    // Anonymous limit
    if (!user && llmCallsRemaining <= 0) {
      setShowLimitOverlay(true);
      return;
    }
    // Logged-in free limit (Temporarily disabled for all logged-in users)
    // if (user && !isSubscribed && llmCallsRemaining <= 0) {
    //   setShowPaywall(true);
    //   return;
    // }

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const generator = streamReflection(messageText, language, session?.access_token || null);
      let fullResponse = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '', parsed: parseStreamedContent('') }]);

      for await (const chunk of generator) {
        fullResponse += chunk;
        const parsed = parseStreamedContent(fullResponse);

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: fullResponse,
            parsed
          };
          return newMessages;
        });
      }

      incrementReflectionCount();
      decrementLlmCallsRemaining();

      // Sync to backend if logged in
      if (user && session?.access_token) {
        saveChat(messageText, fullResponse, session.access_token).catch(e => {
          console.error('Failed to sync chat to backend:', e);
        });
      }
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes('limit_reached') || error?.message?.includes('403')) {
        if (user) setShowPaywall(true);
        else setShowLimitOverlay(true);
        setMessages(prev => prev.slice(0, -1)); // Remove the empty message
      } else {
        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            role: 'assistant',
            content: 'Error connecting to network',
            parsed: parseStreamedContent(t('chat.error'))
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    showAlert(
      'Clear Conversation',
      'This will clear your chat history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', style: 'destructive', onPress: () => {
            setMessages([]);
            setVisuallyClear(true);
          }
        },
      ],
      '🗑️'
    );
  };

  const renderParsedContent = (parsed: ParsedContent, messageIndex: number) => {
    const isLatestAssistant = messageIndex === messages.length - 1;
    return parsed.elements.map((el, i) => {
      switch (el.type) {
        case 'reflection':
          return <Text key={i} style={[styles.reflectionText, { color: colors.text }]}>{el.content}</Text>;
        case 'verse':
          return (
            <View key={i} style={[styles.verseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {el.arabic && <Text style={[styles.cardArabic, { writingDirection: 'rtl', color: colors.primary }]}>{el.arabic}</Text>}
              {el.reference && (
                <View style={styles.cardRefContainer}>
                  <View style={[styles.cardLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.cardRef, { color: colors.accent }]}>{el.reference}</Text>
                  <View style={[styles.cardLine, { backgroundColor: colors.border }]} />
                </View>
              )}
              {el.translation && <Text style={[styles.cardTranslation, { color: colors.text }]}>"{el.translation}"</Text>}
            </View>
          );
        case 'question':
          return (
            <TouchableOpacity
              key={i}
              style={[styles.questionBox, { backgroundColor: colors.cardDarker, borderColor: colors.primary + '40' }]}
              onPress={() => {
                if (!isLoading && isLatestAssistant) {
                  handleSend(el.content);
                }
              }}
              activeOpacity={0.7}
              disabled={isLoading || !isLatestAssistant}
            >
              <Text style={[styles.questionText, { color: colors.primary, flex: 1 }]}>{el.content}</Text>
              {isLatestAssistant && (
                <Send size={14} color={colors.primary} style={{ opacity: 0.5, marginLeft: 8 }} />
              )}
            </TouchableOpacity>
          );
        case 'action':
          return (
            <View key={i} style={[styles.actionBox, { backgroundColor: colors.card, borderColor: colors.accent }]}>
              <View style={[styles.actionDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.actionText, { color: colors.text }]}>{el.content}</Text>
            </View>
          );
        case 'offtopic':
          return <Text key={i} style={[styles.offtopicText, { color: colors.text, opacity: 0.7 }]}>{el.content}</Text>;
        default:
          return null;
      }
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <IslamicPattern color={isDark ? 'rgba(247, 245, 239, 0.03)' : 'rgba(15, 61, 46, 0.04)'} />
      {alertElement}
      <View style={[styles.header, { borderBottomColor: colors.border }]}><Text style={[styles.headerTitle, { color: colors.primary }]}>{t('nav.reflect')}</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messages}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {historyLoading ? (
          <View style={[styles.emptyState, { paddingTop: 80 }]}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.emptyStateSubtitle, { color: colors.text, marginTop: 16 }]}>
              Loading your reflections...
            </Text>
          </View>
        ) : messages.length === 0 && (
          <View style={styles.emptyState}>
            <Mosque size={72} color={colors.primary} style={{ opacity: 0.12, marginBottom: 20 }} />
            <Text style={[styles.emptyStateTitle, { color: colors.primary }]}>
              {visuallyClear ? 'A fresh start. ✦' : 'What\'s on your mind?'}
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: colors.text }]}>
              {visuallyClear
                ? 'Start a new conversation below.'
                : 'Begin with a thought, or choose a prompt below.'}
            </Text>
            {!visuallyClear && (
              <View style={styles.promptsGrid}>
                {PROMPTS.map((p, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleSend(p.text)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.promptEmoji}>{p.emoji}</Text>
                    <Text style={[styles.promptText, { color: colors.text }]}>{p.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {messages.map((msg, index) => (
          <View key={index} style={[styles.messageWrapper, msg.role === 'user' ? styles.messageWrapperUser : styles.messageWrapperAssistant]}>
            {msg.role === 'user' ? (
              <View style={[styles.userMessage, { backgroundColor: colors.primary }]}>
                <Text style={[styles.userMessageText, { color: colors.background }]}>{msg.content}</Text>
              </View>
            ) : (
              <View style={styles.assistantMessage}>
                {msg.parsed ? renderParsedContent(msg.parsed, index) : <Text style={{ color: colors.text }}>{msg.content}</Text>}
              </View>
            )}
          </View>
        ))}
        {isLoading && (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </ScrollView>

      <View style={[
        styles.inputContainer, 
        { 
          borderTopColor: colors.border, 
          backgroundColor: colors.inputBg,
          paddingBottom: inputBottomPadding
        }
      ]}>
        {messages.length > 0 && (
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
            onPress={handleClearChat}
          >
            <Trash2 size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          value={input}
          onChangeText={setInput}
          placeholder={t('Share your thoughts')}
          placeholderTextColor={isDark ? 'rgba(247, 245, 239, 0.4)' : 'rgba(26,26,26,0.4)'}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: input.trim() || isLoading ? 1 : 0.5 }]}
          onPress={() => handleSend(input)}
          disabled={!input.trim() || isLoading}
        >
          <Send size={18} color={colors.background} />
        </TouchableOpacity>
      </View>

      {showLimitOverlay && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: isDark ? 'rgba(15, 61, 46, 0.7)' : 'rgba(247, 245, 239, 0.7)' }]}>
          <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.limitCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
            <Text style={[styles.limitTitle, { color: colors.primary }]}>Reflection Limit Reached</Text>
            <Text style={[styles.limitDesc, { color: colors.text }]}>
              Sign up to continue your daily reflections without limits, or wait until tomorrow to try again.
            </Text>
            <View style={styles.limitActions}>
              <TouchableOpacity style={styles.limitCancelBtn} onPress={() => setShowLimitOverlay(false)}>
                <Text style={[styles.limitCancelText, { color: colors.text }]}>Explore App</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.limitAuthBtn, { backgroundColor: colors.primary }]} onPress={() => {
                setShowLimitOverlay(false);
                router.push({ pathname: '/auth', params: { mode: 'signup' } });
              }}>
                <Text style={[styles.limitAuthText, { color: colors.background }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Paywall visible={showPaywall} onDismiss={() => setShowPaywall(false)} reason="reflection" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messages: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingTop: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
    gap: 24,
  },
  emptyState: {
    paddingTop: 40,
    alignItems: 'center',
    width: '100%',
  },
  emptyStateTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.55,
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  promptsGrid: {
    width: '100%',
    gap: 10,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  promptEmoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    opacity: 0.85,
  },
  clearBtn: {
    // now rendered inline in input bar
  },
  messageWrapper: {
    width: '100%',
    flexDirection: 'row',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperAssistant: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 24,
    borderBottomRightRadius: 8,
  },
  userMessageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  assistantMessage: {
    maxWidth: '90%',
    gap: 16,
  },
  reflectionText: {
    fontSize: 15,
    lineHeight: 26,
    opacity: 0.9,
  },
  verseCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 8,
  },
  cardArabic: {
    fontFamily: 'serif',
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
  },
  cardRefContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    width: '80%',
  },
  cardLine: {
    flex: 1,
    height: 1,
  },
  cardRef: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardTranslation: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 24,
  },
  questionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 4,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 24,
  },
  actionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  actionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.9,
  },
  offtopicText: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 24,
  },
  loadingWrapper: {
    alignItems: 'flex-start',
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitCard: {
    width: '100%',
    maxWidth: 340,
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  limitTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  limitDesc: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 32,
  },
  limitActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  limitCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  limitCancelText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  limitAuthBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitAuthText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
