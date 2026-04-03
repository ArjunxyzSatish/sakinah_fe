import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useUser } from '../../context/UserContext';
import { fetchSurahWithTranslation, SurahData, Ayah } from '../../utils/quran';
import { toggleSaveVerse, removeSavedVerse } from '../../utils/storage';
import { IslamicPattern, Mandala } from '../../components/IslamicElements';
import { ChevronLeft, Bookmark as BookmarkIcon } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type AyahLayout = {
  y: number;
  height: number;
};

const AyahItem = React.memo(({
  arabic,
  translation,
  surahNumber,
  surahName,
  isInitiallyBookmarked,
  onLayout,
  colors,
  addBookmark,
  removeBookmark
}: any) => {
  const [isBookmarked, setIsBookmarked] = useState(isInitiallyBookmarked);

  useEffect(() => {
    setIsBookmarked(isInitiallyBookmarked);
  }, [isInitiallyBookmarked]);

  const handleToggle = async () => {
    const newState = !isBookmarked;
    setIsBookmarked(newState); // Instant UI feedback
    
    if (newState) {
      addBookmark({
        surah: surahNumber,
        ayah: arabic.numberInSurah,
        text: translation.text,
      });
      await toggleSaveVerse({
        arabic: arabic.text,
        translation: translation.text,
        reference: `${surahName} ${surahNumber}:${arabic.numberInSurah}`
      });
    } else {
      removeBookmark(surahNumber, arabic.numberInSurah);
      await removeSavedVerse(`${surahName} ${surahNumber}:${arabic.numberInSurah}`);
    }
  };

  return (
    <View 
      style={[styles.ayahContainer, { borderBottomColor: colors.border }]}
      onLayout={onLayout}
    >
      <View style={styles.ayahHeader}>
        <View style={styles.ayahBadge}>
          <Mandala size={30} color={colors.primary} style={{ position: 'absolute' }} />
          <Text style={[styles.ayahBadgeText, { color: colors.primary }]}>{arabic.numberInSurah}</Text>
        </View>
        
        <TouchableOpacity 
          activeOpacity={0.5}
          style={[styles.bookmarkButton, isBookmarked && { backgroundColor: 'rgba(15, 61, 46, 0.1)' }]}
          onPress={handleToggle}
        >
          <BookmarkIcon 
            size={22} 
            color={isBookmarked ? colors.primary : colors.text} 
            fill={isBookmarked ? colors.primary : 'transparent'} 
            opacity={isBookmarked ? 1 : 0.6} 
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.arabicText, { color: colors.text }]}>{arabic.text}</Text>
      <Text style={[styles.translationText, { color: colors.text }]}>{translation.text}</Text>
    </View>
  );
});

export default function QuranReadScreen() {
  const { id, ayah } = useLocalSearchParams();
  const surahNumber = parseInt(id as string, 10);
  const targetAyah = ayah ? parseInt(ayah as string, 10) : null;
  
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const { bookmarks, addBookmark, removeBookmark } = useUser();
  const router = useRouter();

  const scrollViewRef = useRef<ScrollView>(null);
  const ayahLayouts = useRef<{ [key: number]: AyahLayout }>({});

  const [arabicData, setArabicData] = useState<SurahData | null>(null);
  const [translationData, setTranslationData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { arabic, translation } = await fetchSurahWithTranslation(surahNumber, language);
        setArabicData(arabic);
        setTranslationData(translation);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (surahNumber) {
      loadData();
    }
  }, [surahNumber, language]);

  // Scroll to target ayah once everything is rendered
  useEffect(() => {
    if (!loading && targetAyah && scrollViewRef.current && ayahLayouts.current[targetAyah]) {
      setTimeout(() => {
        const layout = ayahLayouts.current[targetAyah];
        scrollViewRef.current?.scrollTo({
          y: layout.y - 100, // Offset to show context
          animated: true,
        });
      }, 500);
    }
  }, [loading, targetAyah]);

  const renderAyah = (arabic: Ayah, translation: Ayah) => {
    const isBookmarked = bookmarks.some(b => b.surah === surahNumber && b.ayah === arabic.numberInSurah);
    
    return (
      <AyahItem
        key={arabic.numberInSurah}
        arabic={arabic}
        translation={translation}
        surahNumber={surahNumber}
        surahName={arabicData?.englishName || `Surah ${surahNumber}`}
        isInitiallyBookmarked={isBookmarked}
        colors={colors}
        addBookmark={addBookmark}
        removeBookmark={removeBookmark}
        onLayout={(e: any) => {
          ayahLayouts.current[arabic.numberInSurah] = e.nativeEvent.layout;
        }}
      />
    );
  };

  if (loading || !arabicData || !translationData) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <IslamicPattern color={isDark ? 'rgba(247, 245, 239, 0.03)' : 'rgba(15, 61, 46, 0.04)'} />
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>{arabicData.englishName}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text }]}>
            {arabicData.name} ({arabicData.englishNameTranslation})
          </Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Bismillah for all but Surah 9 (Tawbah) and Surah 1 (Fatihah - it's included in verse 1) */}
        {surahNumber !== 1 && surahNumber !== 9 && (
          <View style={styles.bismillahContainer}>
            <Text style={[styles.bismillahText, { color: colors.primary }]}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </Text>
          </View>
        )}

        {arabicData.ayahs.map((ayah, index) => {
          const translationAyah = translationData.ayahs[index];
          // Workaround: The AlQuran Cloud API returns Bismillah as verse 1 for Fatihah, 
          // but for other surahs it appends it to ayah 1 text unfortunately.
          // To keep it clean, we'll just render it as provided by the API but formatted.
          return renderAyah(ayah, translationAyah);
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 48, 
    paddingBottom: 16, 
    borderBottomWidth: 1,
    paddingHorizontal: 16
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingRight: 40, // offset the back button
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    letterSpacing: 2, 
    textTransform: 'uppercase' 
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  scrollContent: { 
    padding: 24, 
    paddingBottom: 120 
  },
  bismillahContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  bismillahText: {
    fontFamily: 'Georgia',
    fontSize: 28,
  },
  ayahContainer: {
    marginBottom: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
  },
  ayahHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  ayahBadge: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  bookmarkButton: {
    padding: 8,
    borderRadius: 20,
  },
  arabicText: {
    fontFamily: 'Georgia',
    fontSize: 28,
    lineHeight: 48,
    textAlign: 'right',
    marginBottom: 24,
  },
  translationText: {
    fontSize: 16,
    lineHeight: 28,
    opacity: 0.9,
  },
});
