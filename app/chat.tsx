import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Send } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { streamReflection } from '../services/openai';
import { parseStreamedContent, ParsedContent } from '../utils/parser';
import { getSystemInstruction } from '../utils/prompts';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { IslamicPattern, Mosque } from '../components/IslamicElements';

export default function Chat() {
  const [messages, setMessages] = useState<Array<{ role: string, content: string, parsed?: ParsedContent }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const params = useLocalSearchParams();
  const hasProcessedInitialMessage = useRef(false);

  const { language, t } = useLanguage();
  const { reflectionCount, incrementReflectionCount } = useUser();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (params.initialMessage && !hasProcessedInitialMessage.current) {
      hasProcessedInitialMessage.current = true;
      handleSend(params.initialMessage as string);
    }
  }, [params.initialMessage]);

  const handleSend = async (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const generator = streamReflection(messageText, language);
      let fullResponse = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '', parsed: { raw: '', elements: [] } }]);

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
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error connecting to network',
          parsed: {
            raw: '',
            elements: [{ type: 'offtopic', content: t('chat.error') }]
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderParsedContent = (parsed: ParsedContent) => {
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
            <View key={i} style={[styles.questionBox, { backgroundColor: colors.cardDarker, borderColor: colors.border }]}>
              <Text style={[styles.questionText, { color: colors.primary }]}>{el.content}</Text>
            </View>
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <IslamicPattern color={isDark ? 'rgba(247, 245, 239, 0.03)' : 'rgba(15, 61, 46, 0.04)'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>{t('nav.reflect')}</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Mosque size={100} color={colors.primary} style={{ opacity: 0.15, marginBottom: 24 }} />
            <Text style={[styles.emptyStateText, { color: colors.primary }]}>
              {t('chat.placeholder')}
            </Text>
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
                {msg.parsed ? renderParsedContent(msg.parsed) : <Text style={{ color: colors.text }}>{msg.content}</Text>}
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

      <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.inputBg }]}>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.6,
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
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 8,
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
    paddingBottom: Platform.OS === 'ios' ? 120 : 100, // accommodate nav block
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
});
