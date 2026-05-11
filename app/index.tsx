import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { Bookmark, Image as ImageIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getDailyVerse, DAILY_VERSES, getRandomVerse } from '../utils/verses';
import { RTL_LANGUAGES } from '../context/LanguageContext';
import { generateRandomVerse } from '../services/openai';
import { useVerse } from '../context/VerseContext';
import { toggleSaveVerse, isVerseSaved } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { IslamicPattern, Crescent } from '../components/IslamicElements';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Paywall from '../components/Paywall';
import { useAppAlert } from '../components/AppAlert';

export default function Home() {
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLimitOverlay, setShowLimitOverlay] = useState(false);
  const { currentVerse: dailyVerse, setCurrentVerse: setDailyVerse } = useVerse();
  const { language, t } = useLanguage();
  const { versesRemaining, decrementVersesRemaining, user, isSubscribed, session } = useUser();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);
  const { showAlert, alertElement } = useAppAlert();

  const onRefresh = useCallback(async () => {
    // Limits
    if (!user && versesRemaining <= 0) {
      setShowLimitOverlay(true);
      return;
    }
    // Logged-in free limit (Temporarily disabled for all logged-in users)
    // if (user && !isSubscribed && versesRemaining <= 0) {
    //   setShowPaywall(true);
    //   return;
    // }

    setRefreshing(true);
    try {
      const newVerse = await generateRandomVerse(language, session?.access_token || null);
      setDailyVerse(newVerse);
      decrementVersesRemaining();
    } catch (error: any) {
      if (error?.message?.includes('403')) {
         if (user) setShowPaywall(true);
         else setShowLimitOverlay(true);
         return;
      }
      console.warn("Could not fetch new verse, using fallback.", error);
      showAlert(
        "Connection Issue",
        "We couldn't fetch a new verse from the AI right now. Please try again later. Enjoy this beautiful classic verse instead while we sort it out!"
      );
      let fallbackVerse = getRandomVerse();
      while (fallbackVerse.reference === dailyVerse.reference && DAILY_VERSES.length > 1) {
        fallbackVerse = getRandomVerse();
      }
      setDailyVerse(fallbackVerse);
    } finally {
      setRefreshing(false);
    }
  }, [dailyVerse, setDailyVerse, versesRemaining, user, language, isSubscribed, session]);

  useEffect(() => {
    const checkSaved = async () => {
      const isSaved = await isVerseSaved(dailyVerse.reference);
      setSaved(isSaved);
    };
    checkSaved();
  }, [dailyVerse]);

  const handleSave = async () => {
    const isSaved = await toggleSaveVerse(dailyVerse);
    setSaved(isSaved);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <IslamicPattern color={isDark ? 'rgba(247, 245, 239, 0.03)' : 'rgba(15, 61, 46, 0.04)'} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Animated.View entering={FadeInDown.duration(800)} style={styles.content}>

          <View style={[styles.labelContainer, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
            {t('home.verseOfDay').split(' ').map((word, index, array) => (
              <React.Fragment key={index}>
                <Text style={[styles.labelText, { color: colors.primary }]}>{word}</Text>
                {index < array.length - 1 && (
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent }} />
                )}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.verseContainer}>
            <Text style={[styles.arabic, { writingDirection: 'rtl', color: colors.primary }]}>
              {dailyVerse.arabic}
            </Text>
            <Text style={[styles.reference, { color: colors.accent }]}>
              {dailyVerse.reference}
            </Text>
            <Text style={[styles.translation, { color: colors.text }]}>
              "{dailyVerse.translation}"
            </Text>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Crescent size={18} color="#D4AF37" />
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Text style={[
              styles.reflection,
              RTL_LANGUAGES.includes(language) && styles.reflectionAr,
              { writingDirection: RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr', color: colors.text }
            ]}>
              {language === 'ar' ? dailyVerse.reflectionAr : dailyVerse.reflection}
            </Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.reflectBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={() => router.push({
                pathname: '/chat',
                params: { initialMessage: `I want to reflect on today's verse: "${dailyVerse.translation}" (${dailyVerse.reference})` }
              })}
            >
              <Text style={[styles.reflectBtnText, { color: colors.background }]}>{t('home.reflect')}</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push('/wallpaper')}
              >
                <ImageIcon
                  size={24}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handleSave}
              >
                <Bookmark
                  size={24}
                  color={colors.primary}
                  fill={saved ? colors.primary : (isDark ? 'rgba(247, 245, 239, 0)' : 'rgba(26, 26, 26, 0)')}
                  strokeWidth={saved ? 2.5 : 2}
                />
              </TouchableOpacity>
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {showLimitOverlay && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: isDark ? 'rgba(15, 61, 46, 0.7)' : 'rgba(247, 245, 239, 0.7)' }]}>
          <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.limitCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
            <Text style={[styles.limitTitle, { color: colors.primary }]}>Daily Limit Reached</Text>
            <Text style={[styles.limitDesc, { color: colors.text }]}>
              Sign up to explore boundless daily verses, or wait until tomorrow for a refreshed connection.
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

      <Paywall visible={showPaywall} onDismiss={() => setShowPaywall(false)} reason="verse" />
      {alertElement}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 120, // Space for nav
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  labelContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 40,
  },
  labelText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  verseContainer: {
    width: '100%',
    alignItems: 'center',
  },
  arabic: {
    fontFamily: 'serif',
    fontSize: 64,
    textAlign: 'center',
    lineHeight: 72,
    marginBottom: 24,
  },
  reference: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  translation: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.9,
    marginBottom: 40,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
    width: '60%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerDot: {
    fontSize: 12,
  },
  reflection: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.8,
  },
  reflectionAr: {
    fontFamily: 'serif',
    fontSize: 20,
    lineHeight: 36,
  },
  actionsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
    marginTop: 48,
  },
  reflectBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  reflectBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  saveBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
