import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'pdl1_onboarding_v1';

export type OnboardingScreen =
  | 'home'
  | 'tournament_type'
  | 'tournament_players'
  | 'tournament_matches';

interface OnboardingContextValue {
  isFirstRun: boolean;
  completedScreens: OnboardingScreen[];
  isScreenDone: (screen: OnboardingScreen) => boolean;
  markScreenDone: (screen: OnboardingScreen) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [completedScreens, setCompletedScreens] = useState<OnboardingScreen[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((raw) => {
      if (!raw) {
        // First time ever
        setIsFirstRun(true);
        setCompletedScreens([]);
      } else {
        const data = JSON.parse(raw);
        setIsFirstRun(false);
        setCompletedScreens(data.completedScreens ?? []);
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((screens: OnboardingScreen[]) => {
    AsyncStorage.setItem(
      ONBOARDING_KEY,
      JSON.stringify({ completedScreens: screens, version: 1 })
    );
  }, []);

  const isScreenDone = useCallback(
    (screen: OnboardingScreen) => completedScreens.includes(screen),
    [completedScreens]
  );

  const markScreenDone = useCallback(
    (screen: OnboardingScreen) => {
      setCompletedScreens((prev) => {
        if (prev.includes(screen)) return prev;
        const next = [...prev, screen];
        persist(next);
        // Once all screens done, mark first-run as over
        if (next.length >= 4) setIsFirstRun(false);
        return next;
      });
    },
    [persist]
  );

  const resetOnboarding = useCallback(() => {
    AsyncStorage.removeItem(ONBOARDING_KEY);
    setIsFirstRun(true);
    setCompletedScreens([]);
  }, []);

  if (!loaded) return null;

  return (
    <OnboardingContext.Provider
      value={{ isFirstRun, completedScreens, isScreenDone, markScreenDone, resetOnboarding }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
