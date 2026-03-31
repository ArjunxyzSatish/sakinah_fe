import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedVerse {
  arabic: string;
  translation: string;
  reference: string;
  savedAt: number;
}

export async function getSavedVerses(): Promise<SavedVerse[]> {
  try {
    const data = await AsyncStorage.getItem('sakinah_saved_verses');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function toggleSaveVerse(verse: Omit<SavedVerse, 'savedAt'>): Promise<boolean> {
  const saved = await getSavedVerses();
  const exists = saved.findIndex(v => v.reference === verse.reference);
  
  if (exists >= 0) {
    saved.splice(exists, 1);
    await AsyncStorage.setItem('sakinah_saved_verses', JSON.stringify(saved));
    return false;
  } else {
    saved.unshift({ ...verse, savedAt: Date.now() });
    await AsyncStorage.setItem('sakinah_saved_verses', JSON.stringify(saved));
    return true;
  }
}

export async function isVerseSaved(reference: string): Promise<boolean> {
  const saved = await getSavedVerses();
  return saved.some(v => v.reference === reference);
}

export async function removeSavedVerse(reference: string): Promise<boolean> {
  const saved = await getSavedVerses();
  const exists = saved.findIndex(v => v.reference === reference);
  if (exists >= 0) {
    saved.splice(exists, 1);
    await AsyncStorage.setItem('sakinah_saved_verses', JSON.stringify(saved));
    return true;
  }
  return false;
}
