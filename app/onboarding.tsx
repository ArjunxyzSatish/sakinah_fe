import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../context/UserContext';
import { useLanguage, LANGUAGE_NAMES, LANGUAGE_DESCRIPTIONS, INDIAN_LANGUAGES, Language } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { IslamicPattern, Crescent, OpenBook, Mandala, Mosque } from '../components/IslamicElements';
import { QiblaCompass } from '../components/QiblaCompass';
import { Check, ChevronDown, ChevronUp, Bell, ChevronLeft } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { Magnetometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';


const TOPICS = [
  'anxiety', 'gratitude', 'patience', 'decision-making', 'grief', 'purpose', 'relationships', 'forgiveness', 'inner-peace', 'hardship'
];

const PRAYER_PREVIEW = [
  { name: 'Fajr',    arabic: 'الفجر', icon: 'moon',   desc: 'Dawn prayer · Before sunrise' },
  { name: 'Dhuhr',   arabic: 'الظهر', icon: 'sun',    desc: 'Midday prayer · After zenith' },
  { name: 'Asr',     arabic: 'العصر', icon: 'sun',    desc: 'Afternoon prayer' },
  { name: 'Maghrib', arabic: 'المغرب', icon: 'sunset', desc: 'Sunset prayer · After dusk' },
  { name: 'Isha',    arabic: 'العشاء', icon: 'moon',   desc: 'Night prayer' },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showIndianLangs, setShowIndianLangs] = useState(false);
  
  const router = useRouter();
  const { completeOnboarding, setOnboardingContext, togglePrayer } = useUser();
  const { setLanguage, t, language, isIndia } = useLanguage();
  const { colors, isDark } = useTheme();


  const previewHeading = useSharedValue(0);
  const previewGlowOpacity = useSharedValue(0);
  const [headingState, setHeadingState] = useState(0);
  const previewQiblaAngle = 45; // Fixed Qibla angle for preview
  const wasFacingPreview = React.useRef(false);

  React.useEffect(() => {
    let subscription: any;
    if (step === 2) {
      subscription = Magnetometer.addListener(result => {
        const { x, y } = result;
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        if (angle < 0) angle += 360;
        const rounded = Math.round(angle);
        setHeadingState(rounded);
        previewHeading.value = withSpring(-angle);
      });
      Magnetometer.setUpdateInterval(100);
    }
    return () => subscription?.remove();
  }, [step]);

  React.useEffect(() => {
    if (step !== 2) return;
    const diff = Math.abs(previewQiblaAngle - headingState);
    const isFacing = diff < 5 || diff > 355;
    
    if (isFacing && !wasFacingPreview.current) {
      wasFacingPreview.current = true;
      previewGlowOpacity.value = withSpring(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (!isFacing && wasFacingPreview.current) {
      wasFacingPreview.current = false;
      previewGlowOpacity.value = withSpring(0);
    }
  }, [headingState, step]);

  const previewAnimatedStyles = useAnimatedStyle(() => ({
    transform: [{ rotate: `${previewHeading.value}deg` }],
  }));

  const previewQiblaPointerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${previewHeading.value + previewQiblaAngle}deg` }],
  }));

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const requestNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      return false;
    }
    return true;
  };

  const nextStep = () => setStep(step + 1);

  const finish = async () => {
    if (selectedTopics.length === 0) return;
    await setOnboardingContext(selectedTopics);
    await completeOnboarding();
    const prompt = `I am seeking reflection on: ${selectedTopics.join(', ')}.`;
    router.replace({ pathname: '/chat', params: { initialMessage: prompt } } as any);
  };

  const skipTopics = async () => {
    await completeOnboarding();
    router.replace('/' as any);
  };

  const selectLanguage = async (lang: Language) => {
    await setLanguage(lang);
    setStep(2);
  };

  // Step 1: Language Selection
  if (step === 1) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <TouchableOpacity style={styles.backBtnAbs} onPress={() => setStep(step - 1)}>
          <ChevronLeft size={28} color={colors.primary} />
        </TouchableOpacity>
        <View style={[styles.stepHeader, { marginTop: 20 }]}>
          <Mandala size={100} color={colors.primary} style={{ opacity: 0.8 }} />
          <Text style={[styles.title, { color: colors.primary, marginTop: 16 }]}>{t('onboarding.qibla.title')}</Text>
          <Text style={[styles.description, { color: colors.text, marginBottom: 8 }]}>{t('onboarding.qibla.desc')}</Text>
          <Text style={[styles.description, { color: colors.text, opacity: 0.6, fontSize: 14 }]}>
            Rotate your phone to align the compass. A gentle vibration and visual glow will let you know when you're facing exactly toward the Kaaba in Makkah.
          </Text>
        </View>
        <View style={{ marginTop: 0, transform: [{scale: 0.85}] }}>
          <QiblaCompass
            glowOpacity={previewGlowOpacity}
            animatedStyles={previewAnimatedStyles}
            qiblaPointerStyle={previewQiblaPointerStyle}
            hideStats={true}
          />
        </View>
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.continueBtn, { backgroundColor: colors.primary }]} onPress={nextStep}>
            <Text style={[styles.continueText, { color: colors.background }]}>{t('onboarding.continue')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 3: Prayer System Introduction
  if (step === 3) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.backBtnAbs} onPress={() => setStep(step - 1)}>
          <ChevronLeft size={28} color={colors.primary} />
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 60 }}>
            <Mosque size={64} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.primary }]}>Prayer Times</Text>
          <Text style={[styles.description, { color: colors.text }]}>
            Sakinah automatically tracks all 5 daily prayers using precise astronomical calculations — no setup needed.
          </Text>

          <View style={styles.prayerNameList}>
            {PRAYER_PREVIEW.map((p) => (
              <View key={p.name} style={[styles.prayerNameRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.prayerNameEn, { color: colors.text }]}>{p.name}</Text>
                <Text style={[styles.prayerNameAr, { color: colors.primary }]}>{p.arabic}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.prayerInfoBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30', marginTop: 24 }]}>
            <Bell size={16} color={colors.primary} />
            <Text style={[styles.prayerInfoText, { color: colors.text }]}>
              Allow notifications to receive a gentle reminder before each prayer begins.
            </Text>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.continueBtn, { backgroundColor: colors.primary }]} onPress={async () => {
            await requestNotifications();
            nextStep();
          }}>
            <Text style={[styles.continueText, { color: colors.background }]}>Allow Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={nextStep}>
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
        <TouchableOpacity style={[styles.backBtnAbs, { top: 24 }]} onPress={() => setStep(step - 1)}>
          <ChevronLeft size={28} color={colors.primary} />
        </TouchableOpacity>
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
        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: colors.primary }, selectedTopics.length === 0 && { opacity: 0.5 }]}
          onPress={finish}
          disabled={selectedTopics.length === 0}
        >
          <Text style={[styles.continueText, { color: colors.background }]}>{t('onboarding.start')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={skipTopics}>
          <Text style={[styles.skipText, { color: colors.text }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { alignItems: 'center', gap: 40 },
  langScrollContent: { paddingTop: 80, paddingBottom: 60, paddingHorizontal: 24 },
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
  backBtnAbs: { position: 'absolute', top: 50, left: 24, zIndex: 10 },

  // Prayer preview (Step 3)
  prayerPreviewList: { gap: 10, marginBottom: 24 },
  prayerPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  prayerPreviewLeft: { flex: 1, gap: 2 },
  prayerPreviewName: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  prayerPreviewArabic: { fontSize: 13, opacity: 0.5, fontFamily: 'serif' },
  prayerPreviewDesc: { fontSize: 12, opacity: 0.55, marginTop: 2 },
  prayerPreviewDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  prayerInfoText: { flex: 1, fontSize: 13, lineHeight: 20, opacity: 0.75 },

  // Compact prayer name list
  prayerNameList: { width: '100%', borderRadius: 20, overflow: 'hidden' },
  prayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  prayerNameEn: { fontSize: 16, fontWeight: '500' },
  prayerNameAr: { fontSize: 18, fontFamily: 'serif', opacity: 0.85 },
});
