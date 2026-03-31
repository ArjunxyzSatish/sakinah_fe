import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getDailyVerse, DAILY_VERSES, getRandomVerse } from '../utils/verses';
import { generateRandomVerse } from '../services/openai';
import { useVerse } from '../context/VerseContext';
import { toggleSaveVerse, isVerseSaved } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function Home() {
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { currentVerse: dailyVerse, setCurrentVerse: setDailyVerse } = useVerse();
  const { language, t } = useLanguage();
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const newVerse = await generateRandomVerse();
      setDailyVerse(newVerse);
    } catch (error) {
      console.error(error);
      let fallbackVerse = getRandomVerse();
      while (fallbackVerse.reference === dailyVerse.reference && DAILY_VERSES.length > 1) {
        fallbackVerse = getRandomVerse();
      }
      setDailyVerse(fallbackVerse);
    } finally {
      setRefreshing(false);
    }
  }, [dailyVerse, setDailyVerse]);

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
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
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

        <View style={[styles.labelContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.labelText, { color: colors.primary }]}>{t('Verse.Of.The.Day')}</Text>
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
            <Text style={[styles.dividerDot, { color: colors.accent }]}>•</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <Text style={[
            styles.reflection,
            language === 'ar' && styles.reflectionAr,
            { writingDirection: language === 'ar' ? 'rtl' : 'ltr', color: colors.text }
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

      </Animated.View>
    </ScrollView>
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
});
