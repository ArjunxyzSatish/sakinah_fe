import React, { createContext, useContext, useState } from 'react';
import { getDailyVerse, Verse } from '../utils/verses';

interface VerseContextType {
  currentVerse: Verse;
  setCurrentVerse: (verse: Verse) => void;
}

const VerseContext = createContext<VerseContextType | undefined>(undefined);

export function VerseProvider({ children }: { children: React.ReactNode }) {
  const [currentVerse, setCurrentVerse] = useState<Verse>(() => getDailyVerse());

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
