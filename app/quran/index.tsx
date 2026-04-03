import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useUser, QuranBookmark } from '../../context/UserContext';
import { fetchSurahsList, SurahInfo, searchQuran, SearchResultMatch } from '../../utils/quran';
import { IslamicPattern, Mandala } from '../../components/IslamicElements';
import { BookOpen, Bookmark as BookmarkIcon, ChevronRight, Search, X } from 'lucide-react-native';

export default function QuranScreen() {
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const { bookmarks } = useUser();
  const router = useRouter();

  const [surahs, setSurahs] = useState<SurahInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'surahs' | 'bookmarks' | 'search'>('surahs');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultMatch[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const loadSurahs = async () => {
      try {
        const data = await fetchSurahsList();
        setSurahs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSurahs();
  }, []);

  const filteredSurahs = surahs.filter(s =>
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number.toString() === searchQuery
  );

  const filteredBookmarks = bookmarks.filter(bm => {
    const surahInfo = surahs.find(s => s.number === bm.surah);
    const surahName = surahInfo ? surahInfo.englishName : `Surah ${bm.surah}`;
    return (
      surahName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bm.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchQuran(searchQuery.trim(), language);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const renderSurahItem = (surah: SurahInfo) => (
    <TouchableOpacity
      key={surah.number}
      style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/quran/${surah.number}`)}
    >
      <View style={styles.listItemLeft}>
        <View style={styles.numberBadge}>
          <Mandala size={36} color={colors.primary} style={{ position: 'absolute' }} />
          <Text style={[styles.numberText, { color: colors.primary }]}>{surah.number}</Text>
        </View>
        <View style={styles.surahInfo}>
          <Text style={[styles.surahEnglishName, { color: colors.text }]} numberOfLines={1}>
            {surah.englishName}
          </Text>
          <Text style={[styles.surahTranslation, { color: colors.text }]} numberOfLines={1}>
            {surah.englishNameTranslation} • {surah.numberOfAyahs} Ayahs
          </Text>
        </View>
      </View>
      <View style={styles.listItemRight}>
        <Text style={[styles.surahArabicName, { color: colors.primary }]}>{surah.name}</Text>
        <ChevronRight size={16} color={colors.text} opacity={0.3} />
      </View>
    </TouchableOpacity>
  );

  const renderBookmarkItem = (bookmark: QuranBookmark, index: number) => {
    // Find the associated Surah string
    const surahInfo = surahs.find(s => s.number === bookmark.surah);
    const surahName = surahInfo ? surahInfo.englishName : `Surah ${bookmark.surah}`;

    return (
      <TouchableOpacity
        key={`${bookmark.surah}-${bookmark.ayah}-${index}`}
        style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/quran/${bookmark.surah}?ayah=${bookmark.ayah}`)}
      >
        <View style={styles.bookmarkInfo}>
          <View style={styles.bookmarkHeader}>
            <BookmarkIcon size={14} color={colors.primary} />
            <Text style={[styles.bookmarkTitle, { color: colors.primary }]}>
              {surahName} • Ayah {bookmark.ayah}
            </Text>
          </View>
          <Text style={[styles.bookmarkText, { color: colors.text }]} numberOfLines={2}>
            {bookmark.text}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.text} opacity={0.3} />
      </TouchableOpacity>
    );
  };

  const renderSearchResultItem = (match: SearchResultMatch, index: number) => (
    <TouchableOpacity
      key={`search-${match.surah.number}-${match.numberInSurah}-${index}`}
      style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/quran/${match.surah.number}?ayah=${match.numberInSurah}`)}
    >
      <View style={styles.bookmarkInfo}>
        <View style={styles.bookmarkHeader}>
          <Search size={14} color={colors.primary} />
          <Text style={[styles.bookmarkTitle, { color: colors.primary }]}>
            {match.surah.englishName} • Ayah {match.numberInSurah}
          </Text>
        </View>
        <Text style={[styles.bookmarkText, { color: colors.text }]} numberOfLines={3}>
          {match.text}
        </Text>
      </View>
      <ChevronRight size={16} color={colors.text} opacity={0.3} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <IslamicPattern color={isDark ? 'rgba(247, 245, 239, 0.03)' : 'rgba(15, 61, 46, 0.04)'} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>{t('nav.quran')}</Text>
      </View>

      <View style={[styles.tabContainer, { borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'surahs' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('surahs')}
        >
          <BookOpen size={16} color={activeTab === 'surahs' ? colors.primary : colors.text} opacity={activeTab === 'surahs' ? 1 : 0.5} />
          <Text style={[styles.tabText, { color: activeTab === 'surahs' ? colors.primary : colors.text, opacity: activeTab === 'surahs' ? 1 : 0.5 }]}>
            {t('quran.surahs')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'bookmarks' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('bookmarks')}
        >
          <BookmarkIcon size={16} color={activeTab === 'bookmarks' ? colors.primary : colors.text} opacity={activeTab === 'bookmarks' ? 1 : 0.5} />
          <Text style={[styles.tabText, { color: activeTab === 'bookmarks' ? colors.primary : colors.text, opacity: activeTab === 'bookmarks' ? 1 : 0.5 }]}>
            {t('quran.bookmarks')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'search' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('search')}
        >
          <Search size={16} color={activeTab === 'search' ? colors.primary : colors.text} opacity={activeTab === 'search' ? 1 : 0.5} />
          <Text style={[styles.tabText, { color: activeTab === 'search' ? colors.primary : colors.text, opacity: activeTab === 'search' ? 1 : 0.5 }]}>
            Search
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={20} color={colors.text} opacity={0.5} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={activeTab === 'search' ? "Search entire Quran text..." : "Search..."}
            placeholderTextColor={colors.text + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={activeTab === 'search' ? handleSearch : undefined}
            returnKeyType={activeTab === 'search' ? "search" : "done"}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); if (activeTab === 'search') setSearchResults([]); }}>
              <X size={20} color={colors.text} opacity={0.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeTab === 'surahs' && filteredSurahs.map(renderSurahItem)}

          {activeTab === 'bookmarks' && (
            filteredBookmarks.length > 0 ? (
              filteredBookmarks.map((bm, index) => renderBookmarkItem(bm, index))
            ) : (
              <View style={styles.emptyContainer}>
                <BookmarkIcon size={48} color={colors.text} style={{ opacity: 0.2, marginBottom: 16 }} />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {searchQuery ? "No bookmarks match your filter" : t('saved.empty')}
                </Text>
              </View>
            )
          )}

          {activeTab === 'search' && (
            searching ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
            ) : searchResults.length > 0 ? (
              searchResults.map((match, index) => renderSearchResultItem(match, index))
            ) : searchQuery.length > 0 ? (
              <View style={styles.emptyContainer}>
                <Search size={48} color={colors.text} style={{ opacity: 0.2, marginBottom: 16 }} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No results found</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Search size={48} color={colors.text} style={{ opacity: 0.2, marginBottom: 16 }} />
                <Text style={[styles.emptyText, { color: colors.text }]}>Search verses in the entire Quran</Text>
              </View>
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 16, paddingTop: 32, alignItems: 'center', borderBottomWidth: 1 },
  headerTitle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scrollContent: { padding: 16, paddingBottom: 120, gap: 12 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  listItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingRight: 12,
  },
  numberBadge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  surahInfo: {
    flex: 1,
    gap: 4,
  },
  surahEnglishName: {
    fontSize: 16,
    fontWeight: '600',
  },
  surahTranslation: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  surahArabicName: {
    fontFamily: 'Georgia',
    fontSize: 20,
  },
  bookmarkInfo: {
    flex: 1,
    gap: 8,
    paddingRight: 16,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookmarkTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bookmarkText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.5,
  },
  searchSection: {
    padding: 16,
    paddingBottom: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
});
