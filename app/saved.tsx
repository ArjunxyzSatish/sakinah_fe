import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { BookmarkMinus } from 'lucide-react-native';
import { getSavedVerses, removeSavedVerse, SavedVerse } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { IslamicPattern, Crescent } from '../components/IslamicElements';

export default function Saved() {
  const [verses, setVerses] = useState<SavedVerse[]>([]);
  const { language, t } = useLanguage();
  const { colors, isDark } = useTheme();

  const loadVerses = useCallback(async () => {
    const saved = await getSavedVerses();
    setVerses(saved.sort((a, b) => b.savedAt - a.savedAt));
  }, []);

  useEffect(() => {
    loadVerses();
  }, [loadVerses]);

  const handleRemove = (reference: string) => {
    Alert.alert(
      t('saved.remove'),
      t('saved.confirm'),
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            await removeSavedVerse(reference);
            loadVerses();
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <IslamicPattern color={isDark ? 'rgba(247, 245, 239, 0.03)' : 'rgba(15, 61, 46, 0.04)'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>{t('nav.saved')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {verses.length === 0 ? (
          <View style={styles.emptyState}>
            <Crescent size={80} color={colors.primary} style={{ opacity: 0.15, marginBottom: 24 }} />
            <Text style={[styles.emptyText, { color: colors.primary }]}>{t('saved.empty')}</Text>
          </View>
        ) : (
          verses.map((verse) => (
            <View key={verse.reference} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.date, { color: colors.text }]}>
                  {new Date(verse.savedAt).toLocaleDateString()}
                </Text>
                <TouchableOpacity 
                  style={[styles.removeBtn, { backgroundColor: colors.cardBorder }]}
                  onPress={() => handleRemove(verse.reference)}
                >
                  <BookmarkMinus size={20} color={colors.text} opacity={0.5} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.arabic, { writingDirection: 'rtl', color: colors.primary }]}>{verse.arabic}</Text>
              
              <View style={styles.refContainer}>
                <View style={[styles.refLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.reference, { color: colors.accent }]}>{verse.reference}</Text>
                <View style={[styles.refLine, { backgroundColor: colors.border }]} />
              </View>
              
              <Text style={[styles.translation, { color: colors.text }]}>"{verse.translation}"</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
  content: {
    padding: 24,
    paddingBottom: 120, // space for nav
    gap: 24,
  },
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 18,
    opacity: 0.6,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  date: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.4,
  },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabic: {
    fontFamily: 'serif',
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 24,
  },
  refContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    width: '80%',
  },
  refLine: {
    flex: 1,
    height: 1,
  },
  reference: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  translation: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
});
