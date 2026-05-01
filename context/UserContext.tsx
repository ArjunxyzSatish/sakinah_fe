import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { schedulePrayerNotifications, cancelAllNotifications } from '../utils/notifications';
import { supabase } from '../utils/supabase';
import { Session, User } from '@supabase/supabase-js';

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
  llmCallCount: number;
  incrementLlmCallCount: () => void;
  dailyVerseCount: number;
  incrementDailyVerseCount: () => void;
  hasActiveSubscription: boolean;
  subscribe: () => void;
  isSubscribed: boolean;
  markSubscribed: (plan: 'weekly' | 'monthly', expiresAt: number) => Promise<void>;
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
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [reflectionCount, setReflectionCount] = useState(0);
  const [llmCallCount, setLlmCallCount] = useState(0);
  const [dailyVerseCount, setDailyVerseCount] = useState(0);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [onboardingContext, setOnboardingContext] = useState<string[]>([]);
  const [prayerFrequency, setPrayerFrequency] = useState(5);
  const [prayerTimes, setPrayerTimes] = useState<string[]>(['05:30', '13:00', '16:30', '18:45', '20:15', '21:00', '22:00']);
  const [prayerEnabled, setPrayerEnabled] = useState(true);
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Safety net: always mark loaded after 5 seconds no matter what
    const safetyTimer = setTimeout(() => setIsLoaded(true), 5000);

    const loadData = async () => {
      try {
        const onboarding = await AsyncStorage.getItem('sakinah_onboarding_complete');
        const count = await AsyncStorage.getItem('sakinah_reflection_count');
        const llmCount = await AsyncStorage.getItem('sakinah_llm_call_count');
        const verseCount = await AsyncStorage.getItem('sakinah_daily_verse_count');
        const sub = await AsyncStorage.getItem('sakinah_subscription');
        const context = await AsyncStorage.getItem('sakinah_onboarding_context');
        const freq = await AsyncStorage.getItem('sakinah_prayer_frequency');
        const times = await AsyncStorage.getItem('sakinah_prayer_times');
        const enabled = await AsyncStorage.getItem('sakinah_prayer_enabled');
        const bookmarksData = await AsyncStorage.getItem('sakinah_bookmarks');

        const today = new Date().toDateString();
        const lastUsageDate = await AsyncStorage.getItem('sakinah_last_usage_date');

        if (onboarding === 'true') setHasCompletedOnboarding(true);
        if (sub === 'true') setHasActiveSubscription(true);
        if (context) setOnboardingContext(JSON.parse(context));
        if (count) setReflectionCount(parseInt(count, 10));

        // Check premium subscription (stored after payment)
        const subExpiry = await AsyncStorage.getItem('sakinah_sub_expires_at');
        if (subExpiry && parseInt(subExpiry, 10) > Date.now()) {
          setIsSubscribed(true);
        } else if (subExpiry) {
          // Expired — clear it
          await AsyncStorage.removeItem('sakinah_sub_expires_at');
          await AsyncStorage.removeItem('sakinah_sub_plan');
          setIsSubscribed(false);
        }

        if (lastUsageDate !== today) {
          await AsyncStorage.setItem('sakinah_last_usage_date', today);
          await AsyncStorage.setItem('sakinah_llm_call_count', '0');
          await AsyncStorage.setItem('sakinah_daily_verse_count', '0');
          setLlmCallCount(0);
          setDailyVerseCount(0);
        } else {
          if (llmCount) setLlmCallCount(parseInt(llmCount, 10));
          if (verseCount) setDailyVerseCount(parseInt(verseCount, 10));
        }
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

        // Supabase session initialization — wrapped in try/catch so missing env vars don't hang the app
        try {
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        } catch (authError) {
          console.warn('Supabase auth init failed (check env vars):', authError);
        }
      } catch (e) {
        console.warn('UserContext loadData error:', e);
      } finally {
        clearTimeout(safetyTimer);
        setIsLoaded(true);
      }
    };
    loadData();

    // Listen for auth changes
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      });
      authListener = data;
    } catch (e) {
      console.warn('Supabase onAuthStateChange failed:', e);
    }

    return () => {
      clearTimeout(safetyTimer);
      authListener?.subscription.unsubscribe();
    };
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

  const incrementLlmCallCount = async () => {
    const newCount = llmCallCount + 1;
    setLlmCallCount(newCount);
    await AsyncStorage.setItem('sakinah_llm_call_count', newCount.toString());
  };

  const incrementDailyVerseCount = async () => {
    const newCount = dailyVerseCount + 1;
    setDailyVerseCount(newCount);
    await AsyncStorage.setItem('sakinah_daily_verse_count', newCount.toString());
  };

  const subscribe = async () => {
    setHasActiveSubscription(true);
    await AsyncStorage.setItem('sakinah_subscription', 'true');
  };

  const markSubscribed = async (plan: 'weekly' | 'monthly', expiresAt: number) => {
    setIsSubscribed(true);
    setHasActiveSubscription(true);
    await AsyncStorage.setItem('sakinah_sub_plan', plan);
    await AsyncStorage.setItem('sakinah_sub_expires_at', expiresAt.toString());
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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Don't block rendering — the splash screen covers the loading state
  // and blocking here causes a blank screen on production APKs

  return (
    <UserContext.Provider
      value={{
        hasCompletedOnboarding,
        completeOnboarding,
        reflectionCount,
        incrementReflectionCount,
        llmCallCount,
        incrementLlmCallCount,
        dailyVerseCount,
        incrementDailyVerseCount,
        hasActiveSubscription,
        subscribe,
        isSubscribed,
        markSubscribed,
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
        session,
        user,
        signOut,
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

