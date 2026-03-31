import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  reflectionCount: number;
  incrementReflectionCount: () => void;
  hasActiveSubscription: boolean;
  subscribe: () => void;
  onboardingContext: string[];
  setOnboardingContext: (context: string[]) => void;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [reflectionCount, setReflectionCount] = useState(0);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [onboardingContext, setOnboardingContext] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const onboarding = await AsyncStorage.getItem('sakinah_onboarding_complete');
      const count = await AsyncStorage.getItem('sakinah_reflection_count');
      const sub = await AsyncStorage.getItem('sakinah_subscription');
      const context = await AsyncStorage.getItem('sakinah_onboarding_context');

      if (onboarding === 'true') setHasCompletedOnboarding(true);
      if (count) setReflectionCount(parseInt(count, 10));
      if (sub === 'true') setHasActiveSubscription(true);
      if (context) setOnboardingContext(JSON.parse(context));
      
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
