import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDailyVerse, Verse } from '../utils/verses';
import { generateRandomVerse } from '../services/openai';
import { useLanguage } from './LanguageContext';

interface VerseContextType {
  currentVerse: Verse;
  setCurrentVerse: (verse: Verse) => void;
}

const VerseContext = createContext<VerseContextType | undefined>(undefined);

export function VerseProvider({ children }: { children: React.ReactNode }) {
  const [currentVerse, setCurrentVerse] = useState<Verse>(() => getDailyVerse());
  const { language } = useLanguage();

  useEffect(() => {
    const loadDailyVerse = async () => {
      const today = new Date().toDateString();
      const cacheKey = `sakinah_daily_verse_${language}`;

      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const { date, verse } = JSON.parse(cached);
          if (date === today) {
            setCurrentVerse(verse);
            return;
          }
        }

        // No valid cache for today — fetch a real verse
        const verse = await generateRandomVerse(language);
        if (verse) {
          setCurrentVerse(verse);
          await AsyncStorage.setItem(cacheKey, JSON.stringify({ date: today, verse }));
        }
      } catch {
        // Keep the hardcoded fallback verse silently
      }
    };

    loadDailyVerse();
  }, [language]);

  return (
    <VerseContext.Provider value={{ currentVerse, setCurrentVerse }}>
      {children}
    </VerseContext.Provider>
  );
}

export const useVerse = () => {
  const context = useContext(VerseContext);
  if (!context) throw new Error('useVerse must be used within VerseProvider');
  return context;
};
