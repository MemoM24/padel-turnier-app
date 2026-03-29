import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Tournament, TournamentHistoryItem } from '@/types';

const KEYS = {
  HISTORY: 'padelHistory',
  SAVED_PLAYERS: 'padelSavedPlayers',
  FIREBASE_CONFIG: 'padelFbCfg',
  ACTIVE_TOURNAMENT: 'padelActiveTournament',
};

// Tournament History
export async function getHistory(): Promise<TournamentHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveToHistory(tournament: Tournament): Promise<void> {
  try {
    const history = await getHistory();
    const item: TournamentHistoryItem = {
      id: tournament.id,
      name: tournament.name,
      type: tournament.settings.type,
      playerCount: tournament.players.length,
      createdAt: tournament.createdAt,
      finished: tournament.finished,
      playerNames: tournament.players.map((p) => p.name),
    };
    const filtered = history.filter((h) => h.id !== tournament.id);
    const updated = [item, ...filtered].slice(0, 20);
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
  } catch {}
}

export async function updateHistoryItem(id: string, updates: Partial<TournamentHistoryItem>): Promise<void> {
  try {
    const history = await getHistory();
    const updated = history.map((h) => (h.id === id ? { ...h, ...updates } : h));
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
  } catch {}
}

// Active Tournament
export async function getActiveTournament(): Promise<Tournament | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE_TOURNAMENT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveActiveTournament(tournament: Tournament): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ACTIVE_TOURNAMENT, JSON.stringify(tournament));
    await AsyncStorage.setItem(`padelT_${tournament.id}`, JSON.stringify(tournament));
    await saveToHistory(tournament);
  } catch {}
}

export async function loadTournamentById(id: string): Promise<Tournament | null> {
  try {
    // First check active tournament
    const active = await getActiveTournament();
    if (active && active.id === id) return active;
    // Then check per-id storage
    const raw = await AsyncStorage.getItem(`padelT_${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Saved Players
export async function getSavedPlayers(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SAVED_PLAYERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addSavedPlayers(names: string[]): Promise<void> {
  try {
    const existing = await getSavedPlayers();
    const merged = Array.from(new Set([...existing, ...names]));
    await AsyncStorage.setItem(KEYS.SAVED_PLAYERS, JSON.stringify(merged));
  } catch {}
}

// Firebase Config
export async function getFirebaseConfig(): Promise<Record<string, string> | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.FIREBASE_CONFIG);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveFirebaseConfig(config: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.FIREBASE_CONFIG, JSON.stringify(config));
  } catch {}
}
