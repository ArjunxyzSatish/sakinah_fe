import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Animated as RNAnimated, Easing } from 'react-native';
import { Check } from 'lucide-react-native';

const TOPICS = [
  'anxiety',
  'gratitude',
  'patience',
  'decision-making',
  'grief',
  'purpose',
  'relationships',
  'forgiveness',
  'inner-peace',
  'hardship'
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const router = useRouter();
  const { completeOnboarding } = useUser();
  const { setLanguage, t, language } = useLanguage();
  const { colors } = useTheme();

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const finish = async () => {
    if (selectedTopics.length === 0) return;
    
    await completeOnboarding();
    
    const prompt = `I am seeking reflection on: ${selectedTopics.join(', ')}.`;
    router.replace({ pathname: '/chat', params: { initialMessage: prompt } });
  };

  const selectLanguage = async (lang: 'en' | 'ar') => {
    await setLanguage(lang);
    setStep(2);
  };

  if (step === 1) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: 24, justifyContent: 'center' }]}>
        <View style={styles.contentContainer}>
          <Text style={[styles.brand, { color: colors.text }]}>sakinah</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>Find quiet in the Qur'an</Text>
          
          <View style={styles.langContainer}>
            <TouchableOpacity 
              style={[styles.langBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => selectLanguage('en')}
            >
              <Text style={[styles.langTitle, { color: colors.primary }]}>English</Text>
              <Text style={[styles.langDesc, { color: colors.text, opacity: 0.6 }]}>Reflect in English</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.langBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => selectLanguage('ar')}
            >
              <Text style={[styles.langTitle, { color: colors.primary, fontFamily: 'serif' }]}>العربية</Text>
              <Text style={[styles.langDesc, { color: colors.text, opacity: 0.6 }]}>تأمل باللغة العربية</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>{t('onboarding.step2')}</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.primary }]}>{t('onboarding.title')}</Text>
        <Text style={[styles.description, { color: colors.text }]}>{t('onboarding.subtitle')}</Text>
        
        <View style={styles.grid}>
          {TOPICS.map((topic) => {
            const isSelected = selectedTopics.includes(topic);
            return (
              <TouchableOpacity
                key={topic}
                style={[
                  styles.topicBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => handleTopicToggle(topic)}
              >
                {isSelected && <Check size={14} color={colors.background} style={{ marginRight: 6 }} />}
                <Text style={[
                  styles.topicText,
                  { color: isSelected ? colors.background : colors.text }
                ]}>
                  {t(`topics.${topic}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={[
            styles.continueBtn, 
            { backgroundColor: colors.primary },
            selectedTopics.length === 0 && { opacity: 0.5 }
          ]}
          onPress={finish}
          disabled={selectedTopics.length === 0}
        >
          <Text style={[styles.continueText, { color: colors.background }]}>{t('onboarding.start')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    alignItems: 'center',
    gap: 40,
  },
  brand: {
    fontSize: 24,
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 18,
    opacity: 0.7,
  },
  langContainer: {
    width: '100%',
    gap: 16,
    marginTop: 20,
  },
  langBtn: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  langTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  langDesc: {
    fontSize: 14,
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
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Georgia',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  topicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
  },
  topicText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
  },
  continueBtn: {
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
