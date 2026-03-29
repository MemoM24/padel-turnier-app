import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Tournament, WizardState, TournamentType, TournamentSettings } from '@/types';
import { Language, setLanguage as setI18nLanguage } from '@/i18n';
import { saveActiveTournament } from '@/lib/storage';
import { syncTournamentToServer } from '@/lib/serverSync';

interface TournamentContextValue {
  // Active tournament
  tournament: Tournament | null;
  setTournament: (t: Tournament | null) => void;
  saveTournament: (t: Tournament) => Promise<void>;

  // Wizard state
  wizard: WizardState;
  setWizardType: (type: TournamentType) => void;
  setWizardSettings: (settings: Partial<TournamentSettings>) => void;
  setWizardPlayers: (players: string[]) => void;
  setWizardTeams: (teams: import('@/types').Team[]) => void;
  setWizardName: (name: string) => void;
  resetWizard: () => void;

  // Language
  language: Language;
  toggleLanguage: () => void;

  // Firebase
  firebaseConfig: Record<string, string> | null;
  setFirebaseConfig: (config: Record<string, string> | null) => void;
}

const defaultWizard: WizardState = {
  type: null,
  tournamentName: '',
  settings: {
    pointsPerRound: 24,
    numRounds: 0,
    byePoints: 0,
    gameMode: 'points',
    gameTimeMinutes: 10,
    courts: [
      { id: 'court1', name: 'Court 1', active: true },
      { id: 'court2', name: 'Court 2', active: false },
      { id: 'court3', name: 'Court 3', active: false },
      { id: 'court4', name: 'Court 4', active: false },
    ],
  },
  players: [],
};

const TournamentContext = createContext<TournamentContextValue | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournament, setTournamentState] = useState<Tournament | null>(null);
  const [wizard, setWizard] = useState<WizardState>(defaultWizard);
  const [language, setLanguageState] = useState<Language>('de');
  const [firebaseConfig, setFirebaseConfig] = useState<Record<string, string> | null>(null);

  const setTournament = useCallback((t: Tournament | null) => {
    setTournamentState(t);
  }, []);

  const saveTournament = useCallback(async (t: Tournament) => {
    setTournamentState(t);
    await saveActiveTournament(t);
    // Non-blocking: sync to backend so QR viewer stays up-to-date
    syncTournamentToServer(t).catch(() => {});
  }, []);

  const setWizardType = useCallback((type: TournamentType) => {
    setWizard((prev) => ({ ...prev, type }));
  }, []);

  const setWizardSettings = useCallback((settings: Partial<TournamentSettings>) => {
    setWizard((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  }, []);

  const setWizardPlayers = useCallback((players: string[]) => {
    setWizard((prev) => ({ ...prev, players }));
  }, []);

  const setWizardTeams = useCallback((teams: import('@/types').Team[]) => {
    // Also derive flat player list from teams
    const players = teams.flatMap((t) => [t.player1, t.player2]);
    setWizard((prev) => ({ ...prev, teams, players }));
  }, []);

  const setWizardName = useCallback((tournamentName: string) => {
    setWizard((prev) => ({ ...prev, tournamentName }));
  }, []);

  const resetWizard = useCallback(() => {
    setWizard(defaultWizard);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next: Language = prev === 'de' ? 'en' : 'de';
      setI18nLanguage(next);
      return next;
    });
  }, []);

  return (
    <TournamentContext.Provider
      value={{
        tournament,
        setTournament,
        saveTournament,
        wizard,
        setWizardType,
        setWizardSettings,
        setWizardPlayers,
        setWizardTeams,
        setWizardName,
        resetWizard,
        language,
        toggleLanguage,
        firebaseConfig,
        setFirebaseConfig,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be used within TournamentProvider');
  return ctx;
}
