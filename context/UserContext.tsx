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
  llmCallsRemaining: number;
  decrementLlmCallsRemaining: () => void;
  versesRemaining: number;
  decrementVersesRemaining: () => void;
  hasActiveSubscription: boolean;
  subscribe: () => void;
  isSubscribed: boolean;
  markSubscribed: (plan: 'weekly' | 'monthly', expiresAt: number) => Promise<void>;
  onboardingContext: string[];
  setOnboardingContext: (context: string[]) => void;
  prayerEnabled: boolean;
  togglePrayer: (enabled: boolean, lat: number, lon: number) => void;
  completedPrayers: Record<string, boolean>;
  togglePrayerCompleted: (prayerKey: string) => void;
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
  const [llmCallsRemaining, setLlmCallsRemaining] = useState(5);
  const [versesRemaining, setVersesRemaining] = useState(10);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [onboardingContext, setOnboardingContext] = useState<string[]>([]);
  const [prayerEnabled, setPrayerEnabled] = useState(true);
  const [completedPrayers, setCompletedPrayers] = useState<Record<string, boolean>>({});
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
        const llmRemaining = await AsyncStorage.getItem('sakinah_llm_calls_remaining');
        const versesRemainingStr = await AsyncStorage.getItem('sakinah_verses_remaining');
        const sub = await AsyncStorage.getItem('sakinah_subscription');
        const context = await AsyncStorage.getItem('sakinah_onboarding_context');
        const enabled = await AsyncStorage.getItem('sakinah_prayer_enabled');
        const completed = await AsyncStorage.getItem('sakinah_completed_prayers');
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
          await AsyncStorage.setItem('sakinah_llm_calls_remaining', '5');
          await AsyncStorage.setItem('sakinah_verses_remaining', '10');
          setLlmCallsRemaining(5);
          setVersesRemaining(10);
        } else {
          if (llmRemaining) setLlmCallsRemaining(parseInt(llmRemaining, 10));
          if (versesRemainingStr) setVersesRemaining(parseInt(versesRemainingStr, 10));
        }
        if (context) setOnboardingContext(JSON.parse(context));

        const loadedEnabled = enabled !== 'false'; // default true
        setPrayerEnabled(loadedEnabled);
        
        if (bookmarksData) setBookmarks(JSON.parse(bookmarksData));

        // Supabase session initialization — wrapped in try/catch so missing env vars don't hang the app
        try {
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('free_verses_remaining, free_llm_calls_remaining')
              .eq('id', initialSession.user.id)
              .single();
              
            if (profile) {
              setVersesRemaining(profile.free_verses_remaining);
              setLlmCallsRemaining(profile.free_llm_calls_remaining);
            }
          }
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

  const decrementLlmCallsRemaining = async () => {
    const newVal = Math.max(0, llmCallsRemaining - 1);
    setLlmCallsRemaining(newVal);
    await AsyncStorage.setItem('sakinah_llm_calls_remaining', newVal.toString());
  };

  const decrementVersesRemaining = async () => {
    const newVal = Math.max(0, versesRemaining - 1);
    setVersesRemaining(newVal);
    await AsyncStorage.setItem('sakinah_verses_remaining', newVal.toString());
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

  const togglePrayerCompleted = async (prayerKey: string) => {
    const newCompleted = { ...completedPrayers, [prayerKey]: !completedPrayers[prayerKey] };
    setCompletedPrayers(newCompleted);
    await AsyncStorage.setItem('sakinah_completed_prayers', JSON.stringify(newCompleted));
  };

  const togglePrayer = async (enabled: boolean, lat: number, lon: number) => {
    setPrayerEnabled(enabled);
    await AsyncStorage.setItem('sakinah_prayer_enabled', enabled.toString());

    if (enabled) {
      await schedulePrayerNotifications(lat, lon);
    } else {
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
        llmCallsRemaining,
        decrementLlmCallsRemaining,
        versesRemaining,
        decrementVersesRemaining,
        hasActiveSubscription,
        subscribe,
        isSubscribed,
        markSubscribed,
        onboardingContext,
        setOnboardingContext: updateOnboardingContext,
        prayerEnabled,
        togglePrayer,
        completedPrayers,
        togglePrayerCompleted,
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

