import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { schedulePrayerNotifications, cancelAllNotifications } from '../utils/notifications';

export interface QuranBookmark {
  surah: number;
  ayah: number;
  text: string;
}

interface UserContextType {
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  reflectionCount: number;
  incrementReflectionCount: () => void;
  hasActiveSubscription: boolean;
  subscribe: () => void;
  onboardingContext: string[];
  setOnboardingContext: (context: string[]) => void;
  prayerFrequency: number;
  prayerTimes: string[];
  updatePrayerSettings: (frequency: number, times: string[]) => void;
  prayerEnabled: boolean;
  togglePrayer: (enabled: boolean) => void;
  bookmarks: QuranBookmark[];
  addBookmark: (bookmark: QuranBookmark) => void;
  removeBookmark: (surah: number, ayah: number) => void;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [reflectionCount, setReflectionCount] = useState(0);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [onboardingContext, setOnboardingContext] = useState<string[]>([]);
  const [prayerFrequency, setPrayerFrequency] = useState(5);
  const [prayerTimes, setPrayerTimes] = useState<string[]>(['05:30', '13:00', '16:30', '18:45', '20:15', '21:00', '22:00']);
  const [prayerEnabled, setPrayerEnabled] = useState(true);
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const onboarding = await AsyncStorage.getItem('sakinah_onboarding_complete');
      const count = await AsyncStorage.getItem('sakinah_reflection_count');
      const sub = await AsyncStorage.getItem('sakinah_subscription');
      const context = await AsyncStorage.getItem('sakinah_onboarding_context');
      const freq = await AsyncStorage.getItem('sakinah_prayer_frequency');
      const times = await AsyncStorage.getItem('sakinah_prayer_times');
      const enabled = await AsyncStorage.getItem('sakinah_prayer_enabled');
      const bookmarksData = await AsyncStorage.getItem('sakinah_bookmarks');

      if (onboarding === 'true') setHasCompletedOnboarding(true);
      if (count) setReflectionCount(parseInt(count, 10));
      if (sub === 'true') setHasActiveSubscription(true);
      if (context) setOnboardingContext(JSON.parse(context));

      const loadedFreq = freq ? parseInt(freq, 10) : 5;
      const loadedTimes = times ? JSON.parse(times) : ['05:30', '13:00', '16:30', '18:45', '20:15', '21:00', '22:00'];
      const loadedEnabled = enabled !== 'false'; // default true

      if (freq) setPrayerFrequency(loadedFreq);
      if (times) setPrayerTimes(loadedTimes);
      setPrayerEnabled(loadedEnabled);
      if (bookmarksData) setBookmarks(JSON.parse(bookmarksData));
      
      // Re-schedule notifications on app launch (OS may have cleared them)
      if (loadedEnabled && onboarding === 'true') {
        schedulePrayerNotifications(loadedTimes.slice(0, loadedFreq));
      }

      setIsLoaded(true);
    };
    loadData();
  }, []);

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem('sakinah_onboarding_complete', 'true');
  };

  const incrementReflectionCount = async () => {
    const newCount = reflectionCount + 1;
    setReflectionCount(newCount);
    await AsyncStorage.setItem('sakinah_reflection_count', newCount.toString());
  };

  const subscribe = async () => {
    setHasActiveSubscription(true);
    await AsyncStorage.setItem('sakinah_subscription', 'true');
  };

  const updateOnboardingContext = async (context: string[]) => {
    setOnboardingContext(context);
    await AsyncStorage.setItem('sakinah_onboarding_context', JSON.stringify(context));
  };

  const updatePrayerSettings = async (frequency: number, times: string[]) => {
    setPrayerFrequency(frequency);
    setPrayerTimes(times);
    await AsyncStorage.setItem('sakinah_prayer_frequency', frequency.toString());
    await AsyncStorage.setItem('sakinah_prayer_times', JSON.stringify(times));
    
    // Schedule actual notifications (only for the active frequency) if prayer is enabled
    if (prayerEnabled) {
      await schedulePrayerNotifications(times.slice(0, frequency));
    }
  };

  const togglePrayer = async (enabled: boolean) => {
    setPrayerEnabled(enabled);
    await AsyncStorage.setItem('sakinah_prayer_enabled', enabled.toString());

    if (enabled) {
      // Re-schedule notifications with current settings
      await schedulePrayerNotifications(prayerTimes.slice(0, prayerFrequency));
    } else {
      // Cancel all notifications
      await cancelAllNotifications();
    }
  };

  const addBookmark = async (bookmark: QuranBookmark) => {
    const newBookmarks = [...bookmarks.filter(b => !(b.surah === bookmark.surah && b.ayah === bookmark.ayah)), bookmark];
    setBookmarks(newBookmarks);
    await AsyncStorage.setItem('sakinah_bookmarks', JSON.stringify(newBookmarks));
  };

  const removeBookmark = async (surah: number, ayah: number) => {
    const newBookmarks = bookmarks.filter(b => !(b.surah === surah && b.ayah === ayah));
    setBookmarks(newBookmarks);
    await AsyncStorage.setItem('sakinah_bookmarks', JSON.stringify(newBookmarks));
  };

  if (!isLoaded) return null;

  return (
    <UserContext.Provider
      value={{
        hasCompletedOnboarding,
        completeOnboarding,
        reflectionCount,
        incrementReflectionCount,
        hasActiveSubscription,
        subscribe,
        onboardingContext,
        setOnboardingContext: updateOnboardingContext,
        prayerFrequency,
        prayerTimes,
        updatePrayerSettings,
        prayerEnabled,
        togglePrayer,
        bookmarks,
        addBookmark,
        removeBookmark,
        isLoaded,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};

