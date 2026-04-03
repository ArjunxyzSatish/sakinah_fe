import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useUser } from '../context/UserContext';
import { useLanguage, LANGUAGE_NAMES, LANGUAGE_DESCRIPTIONS, INDIAN_LANGUAGES, Language } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { IslamicPattern, Crescent, OpenBook, Mandala } from '../components/IslamicElements';
import { Check, ChevronDown, ChevronUp, Bell, Compass, Clock } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';

const TOPICS = [
  'anxiety', 'gratitude', 'patience', 'decision-making', 'grief', 'purpose', 'relationships', 'forgiveness', 'inner-peace', 'hardship'
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showIndianLangs, setShowIndianLangs] = useState(false);
  const [freq, setFreq] = useState(5);
  const [times, setTimes] = useState<string[]>(['05:30', '13:00', '16:30', '18:45', '20:15', '21:00', '22:00']);
  const [showPicker, setShowPicker] = useState<number | null>(null);
  
  const router = useRouter();
  const { completeOnboarding, updatePrayerSettings, setOnboardingContext, togglePrayer } = useUser();
  const { setLanguage, t, language, isIndia } = useLanguage();
  const { colors, isDark } = useTheme();

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowPicker(null);
    if (selectedDate && showPicker !== null) {
      const h = selectedDate.getHours().toString().padStart(2, '0');
      const m = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTimes = [...times];
      newTimes[showPicker] = `${h}:${m}`;
      setTimes(newTimes);
    }
  };

  const getPickerDate = (index: number) => {
    const [h, m] = (times[index] || '12:00').split(':').map(Number);
    const d = new Date();
    d.setHours(h);
    d.setMinutes(m);
    return d;
  };

  const requestNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Allow notifications to receive prayer reminders.');
      return false;
    }
    return true;
  };

  const nextStep = () => setStep(step + 1);

  const finish = async () => {
    if (selectedTopics.length === 0) return;
    
    await updatePrayerSettings(freq, times);
    await setOnboardingContext(selectedTopics);
    await completeOnboarding();
    
    const prompt = `I am seeking reflection on: ${selectedTopics.join(', ')}.`;
    router.replace({ pathname: '/chat', params: { initialMessage: prompt } });
  };

  const selectLanguage = async (lang: Language) => {
    await setLanguage(lang);
    setStep(2);
  };

  // Step 1: Language Selection
  if (step === 1) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: 24 }]}>
        <IslamicPattern color={isDark ? 'rgba(247, 245, 239, 0.03)' : 'rgba(15, 61, 46, 0.04)'} />
        <ScrollView contentContainerStyle={styles.langScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            <Crescent size={64} color={colors.primary} style={{ marginBottom: 12 }} />
            <Text style={[styles.brand, { color: colors.text }]}>sakinah</Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>Find quiet in the Qur'an</Text>
            <View style={styles.langContainer}>
              <TouchableOpacity style={[styles.langBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => selectLanguage('en')}>
                <Text style={[styles.langTitle, { color: colors.primary }]}>English</Text>
                <Text style={[styles.langDesc, { color: colors.text, opacity: 0.6 }]}>Reflect in English</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.langBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => selectLanguage('ar')}>
                <Text style={[styles.langTitle, { color: colors.primary, fontFamily: 'serif' }]}>العربية</Text>
                <Text style={[styles.langDesc, { color: colors.text, opacity: 0.6 }]}>تأمل باللغة العربية</Text>
              </TouchableOpacity>
              {isIndia && (
                <>
                  <TouchableOpacity style={[styles.moreBtn, { borderColor: colors.border }]} onPress={() => setShowIndianLangs(!showIndianLangs)}>
                    <View style={[styles.moreLine, { backgroundColor: colors.border }]} /><View style={styles.moreLabelRow}><Text style={[styles.moreLabel, { color: colors.primary }]}>Indian Languages</Text>{showIndianLangs ? <ChevronUp size={16} color={colors.primary} /> : <ChevronDown size={16} color={colors.primary} />}</View><View style={[styles.moreLine, { backgroundColor: colors.border }]} />
                  </TouchableOpacity>
                  {showIndianLangs && INDIAN_LANGUAGES.map((lang) => (
                    <TouchableOpacity key={lang} style={[styles.langBtn, styles.langBtnCompact, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => selectLanguage(lang)}>
                      <Text style={[styles.langTitle, styles.langTitleCompact, { color: colors.primary, fontFamily: (lang === 'ur') ? 'serif' : undefined }]}>{LANGUAGE_NAMES[lang]}</Text>
                      <Text style={[styles.langDesc, { color: colors.text, opacity: 0.6 }]}>{LANGUAGE_DESCRIPTIONS[lang]}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Step 2: Qibla Introduction
  if (step === 2) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: 24 }]}>
        <View style={styles.stepHeader}>
          <Mandala size={120} color={colors.primary} style={{ opacity: 0.8 }} />
          <Text style={[styles.title, { color: colors.primary, marginTop: 24 }]}>{t('onboarding.qibla.title')}</Text>
          <Text style={[styles.description, { color: colors.text, marginBottom: 12 }]}>{t('onboarding.qibla.desc')}</Text>
          <Text style={[styles.description, { color: colors.text, opacity: 0.6, fontSize: 14 }]}>
            Rotate your phone to align the compass. A gentle vibration and visual glow will let you know when you're facing exactly toward the Kaaba in Makkah.
          </Text>
        </View>
        <Compass size={180} color={isDark ? 'rgba(247, 245, 239, 0.1)' : 'rgba(15, 61, 46, 0.1)'} style={styles.bgIcon} />
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.continueBtn, { backgroundColor: colors.primary }]} onPress={nextStep}>
            <Text style={[styles.continueText, { color: colors.background }]}>{t('onboarding.continue')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 3: Prayer Notification Setup
  if (step === 3) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Bell size={64} color={colors.primary} style={{ alignSelf: 'center', marginBottom: 24 }} />
          <Text style={[styles.title, { color: colors.primary }]}>{t('onboarding.notifications.title')}</Text>
          <Text style={[styles.description, { color: colors.text }]}>{t('onboarding.notifications.desc')}</Text>
          
          <View style={[styles.freqContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.freqLabel, { color: colors.text }]}>{t('prayer.times.count')}</Text>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={() => setFreq(Math.max(1, freq - 1))} style={styles.stepBtn}>
                <Text style={[styles.stepBtnText, { color: colors.primary }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.freqValue, { color: colors.primary }]}>{freq}</Text>
              <TouchableOpacity onPress={() => setFreq(Math.min(7, freq + 1))} style={styles.stepBtn}>
                <Text style={[styles.stepBtnText, { color: colors.primary }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.sectionSubtitle, { color: colors.primary, marginTop: 32 }]}>{t('prayer.times.setup')}</Text>
          <View style={styles.timesContainer}>
            {Array.from({ length: freq }).map((_, i) => (
              <TouchableOpacity key={i} style={[styles.timeCardOnboarding, { borderBottomColor: colors.border, borderBottomWidth: 1, paddingVertical: 18 }]} onPress={() => setShowPicker(i)}>
                <View style={styles.timeHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Clock size={18} color={colors.primary} />
                    <Text style={[styles.timeLabel, { color: colors.text }]}>Prayer {i + 1}</Text>
                  </View>
                  <Text style={[styles.timeValueText, { color: colors.primary }]}>{times[i]}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {showPicker !== null && (
            <DateTimePicker
              value={getPickerDate(showPicker)}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'android' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          )}

        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.continueBtn, { backgroundColor: colors.primary }]} onPress={async () => {
            const granted = await requestNotifications();
            if (granted) nextStep();
          }}>
            <Text style={[styles.continueText, { color: colors.background }]}>{t('onboarding.next')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={async () => {
            await togglePrayer(false);
            nextStep();
          }}>
            <Text style={[styles.skipText, { color: colors.text }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 4: Topics Selection (Final Step)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Step 4 of 4</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}><OpenBook size={64} color={colors.primary} /></View>
        <Text style={[styles.title, { color: colors.primary }]}>{t('onboarding.title')}</Text>
        <Text style={[styles.description, { color: colors.text }]}>{t('onboarding.subtitle')}</Text>
        <View style={styles.grid}>
          {TOPICS.map((topic) => {
            const isSelected = selectedTopics.includes(topic);
            return (
              <TouchableOpacity key={topic} style={[styles.topicBtn, { backgroundColor: colors.card, borderColor: colors.border }, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => handleTopicToggle(topic)}>
                {isSelected && <Check size={14} color={colors.background} style={{ marginRight: 6 }} />}
                <Text style={[styles.topicText, { color: isSelected ? colors.background : colors.text }]}>{t(`topics.${topic}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.continueBtn, { backgroundColor: colors.primary }, selectedTopics.length === 0 && { opacity: 0.5 }]} onPress={finish} disabled={selectedTopics.length === 0}>
          <Text style={[styles.continueText, { color: colors.background }]}>{t('onboarding.start')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { alignItems: 'center', gap: 40 },
  langScrollContent: { paddingTop: 80, paddingBottom: 60 },
  brand: { fontSize: 24, letterSpacing: 8, textTransform: 'uppercase' },
  subtitle: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 18, opacity: 0.7 },
  langContainer: { width: '100%', gap: 12, marginTop: 20 },
  langBtn: { padding: 24, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
  langBtnCompact: { padding: 18, borderRadius: 20 },
  langTitle: { fontSize: 20, fontWeight: '500', marginBottom: 8 },
  langTitleCompact: { fontSize: 18, marginBottom: 4 },
  langDesc: { fontSize: 13 },
  moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8, paddingHorizontal: 4 },
  moreLine: { flex: 1, height: 1 },
  moreLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moreLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  header: { paddingVertical: 16, paddingTop: 32, alignItems: 'center', borderBottomWidth: 1 },
  headerTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },
  scrollContent: { padding: 24, paddingBottom: 120 },
  title: { fontSize: 28, fontFamily: 'Georgia', marginBottom: 16, textAlign: 'center' },
  description: { fontSize: 16, lineHeight: 24, textAlign: 'center', opacity: 0.7, marginBottom: 40 },
  stepHeader: { alignItems: 'center', marginTop: 60 },
  bgIcon: { position: 'absolute', top: '40%', alignSelf: 'center', opacity: 0.05 },
  freqContainer: { padding: 24, borderRadius: 24, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  freqLabel: { fontSize: 16, fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(15, 61, 46, 0.1)', alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 20, fontWeight: 'bold' },
  freqValue: { fontSize: 20, fontWeight: 'bold' },
  sectionSubtitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  timesContainer: { gap: 4 },
  timeCardOnboarding: { paddingVertical: 12 },
  timeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  timeLabel: { fontSize: 16, fontWeight: '500' },
  timeValueText: { fontSize: 20, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  topicBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 30, borderWidth: 1 },
  topicText: { fontSize: 15, fontWeight: '500' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, gap: 12 },
  continueBtn: { paddingVertical: 20, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  continueText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 13, fontWeight: '500', opacity: 0.5 },
});
