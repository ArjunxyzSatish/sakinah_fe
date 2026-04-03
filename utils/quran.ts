import { Language } from '../context/LanguageContext';

const BASE_URL = 'https://api.alquran.cloud/v1';

export type SurahInfo = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

export type Ayah = {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | object;
};

export type QuranEdition = {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
};

export type SurahData = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
  edition: QuranEdition;
};

// Map languages to specific translation editions in AlQuran.cloud API
const languageEditionMap: Partial<Record<Language, string>> = {
  en: 'en.asad',
  ar: 'ar.muyassar', // For Arabic speakers, provide Tafseer Muyassar alongside Uthmani text
  hi: 'hi.hindi',
  ur: 'ur.jalandhry',
  bn: 'bn.bengali',
  ta: 'ta.tamil',
  ml: 'ml.abdulhameed',
  // Telugu, Kannada, Gujarati will fallback to 'en.asad'
};

export const getTranslationEdition = (language: Language): string => {
  return languageEditionMap[language] || 'en.asad';
};

/**
 * Fetch the list of all 114 Surahs
 */
export const fetchSurahsList = async (): Promise<SurahInfo[]> => {
  try {
    const response = await fetch(`${BASE_URL}/surah`);
    const data = await response.json();
    if (data.code === 200) {
      return data.data;
    }
    throw new Error('Failed to fetch Surahs');
  } catch (error) {
    console.error('Error fetching Surah list:', error);
    throw error;
  }
};

/**
 * Fetch a specific Surah with original Arabic text and the selected translation
 */
export const fetchSurahWithTranslation = async (
  surahNumber: number,
  language: Language
): Promise<{ arabic: SurahData; translation: SurahData }> => {
  try {
    const translationEdition = getTranslationEdition(language);
    // quran-uthmani for standard Arabic text
    const response = await fetch(`${BASE_URL}/surah/${surahNumber}/editions/quran-uthmani,${translationEdition}`);
    const data = await response.json();
    
    if (data.code === 200 && data.data && data.data.length === 2) {
      return {
        arabic: data.data[0],
        translation: data.data[1],
      };
    }
    throw new Error('Failed to fetch Surah texts');
  } catch (error) {
    console.error(`Error fetching Surah ${surahNumber}:`, error);
    throw error;
  }
};

export type SearchResultMatch = {
  number: number;
  text: string;
  edition: QuranEdition;
  surah: SurahInfo;
  numberInSurah: number;
};

export type SearchResult = {
  count: number;
  results: SearchResultMatch[];
};

/**
 * Search the entire Quran for a keyword in the given language
 */
export const searchQuran = async (
  keyword: string,
  language: Language
): Promise<SearchResultMatch[]> => {
  try {
    const translationEdition = getTranslationEdition(language);
    const response = await fetch(`${BASE_URL}/search/${encodeURIComponent(keyword)}/all/${translationEdition}`);
    const data = await response.json();
    
    if (data.code === 200 && data.data && data.data.matches) {
      return data.data.matches;
    }
    return [];
  } catch (error) {
    console.error(`Error searching Quran for ${keyword}:`, error);
    throw error;
  }
};

