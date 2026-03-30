/**
 * trackerStorage.ts – AsyncStorage-Layer für den persönlichen Padel-Begleiter
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  GameEntry,
  PlannedGame,
  PlayerProfile,
  Achievement,
  TrackerStats,
  ShotType,
  CourtZone,
  FactorType,
} from '@/types/tracker';
import { ACHIEVEMENTS, ALL_SHOTS, ALL_ZONES, ALL_FACTORS } from '@/types/tracker';

const KEYS = {
  GAMES: 'tracker:games',
  PLANNED: 'tracker:planned',
  PROFILE: 'tracker:profile',
  ACHIEVEMENTS: 'tracker:achievements',
  ONBOARDING_DONE: 'tracker:onboarding_done',
} as const;

// ─── Game Entries ─────────────────────────────────────────────────────────────
export async function loadGames(): Promise<GameEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.GAMES);
  if (!raw) return [];
  try { return JSON.parse(raw) as GameEntry[]; } catch { return []; }
}

export async function saveGame(entry: GameEntry): Promise<void> {
  const games = await loadGames();
  const idx = games.findIndex(g => g.id === entry.id);
  if (idx >= 0) games[idx] = entry;
  else games.unshift(entry);
  await AsyncStorage.setItem(KEYS.GAMES, JSON.stringify(games));
  await updateAchievements(games);
}

export async function deleteGame(id: string): Promise<void> {
  const games = await loadGames();
  await AsyncStorage.setItem(KEYS.GAMES, JSON.stringify(games.filter(g => g.id !== id)));
}

// ─── Planned Games ────────────────────────────────────────────────────────────
export async function loadPlannedGames(): Promise<PlannedGame[]> {
  const raw = await AsyncStorage.getItem(KEYS.PLANNED);
  if (!raw) return [];
  try { return JSON.parse(raw) as PlannedGame[]; } catch { return []; }
}

export async function savePlannedGame(game: PlannedGame): Promise<void> {
  const games = await loadPlannedGames();
  const idx = games.findIndex(g => g.id === game.id);
  if (idx >= 0) games[idx] = game;
  else games.push(game);
  await AsyncStorage.setItem(KEYS.PLANNED, JSON.stringify(games));
}

export async function deletePlannedGame(id: string): Promise<void> {
  const games = await loadPlannedGames();
  await AsyncStorage.setItem(KEYS.PLANNED, JSON.stringify(games.filter(g => g.id !== id)));
}

// ─── Player Profile ───────────────────────────────────────────────────────────
export async function loadProfile(): Promise<PlayerProfile | null> {
  const raw = await AsyncStorage.getItem(KEYS.PROFILE);
  if (!raw) return null;
  try { return JSON.parse(raw) as PlayerProfile; } catch { return null; }
}

export async function saveProfile(profile: PlayerProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

// ─── Achievements ─────────────────────────────────────────────────────────────
export async function loadAchievements(): Promise<Achievement[]> {
  const raw = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
  if (!raw) return ACHIEVEMENTS.map(a => ({ ...a }));
  try {
    const saved = JSON.parse(raw) as Achievement[];
    // Merge with base list to pick up new achievements
    return ACHIEVEMENTS.map(base => {
      const found = saved.find(s => s.id === base.id);
      return found ? { ...base, unlockedAt: found.unlockedAt } : { ...base };
    });
  } catch { return ACHIEVEMENTS.map(a => ({ ...a })); }
}

async function updateAchievements(games: GameEntry[]): Promise<void> {
  const achievements = await loadAchievements();
  const wins = games.filter(g => g.won === true);
  const now = new Date().toISOString();

  const unlock = (id: string) => {
    const a = achievements.find(x => x.id === id);
    if (a && !a.unlockedAt) a.unlockedAt = now;
  };

  if (games.length >= 1) unlock('first_game');
  if (wins.length >= 1) unlock('first_win');
  if (games.length >= 10) unlock('games_10');

  // 5er Siegesserie
  let streak = 0;
  for (const g of games) {
    if (g.won === true) { streak++; if (streak >= 5) { unlock('streak_5'); break; } }
    else streak = 0;
  }

  // Nacht-Spieler: Spiel nach 20:00
  if (games.some(g => {
    const h = new Date(g.date).getHours();
    return h >= 20;
  })) unlock('night_player');

  // Regen-Krieger
  if (games.some(g => g.weather?.condition?.toLowerCase().includes('regen'))) {
    unlock('rain_warrior');
  }

  await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
export async function isOnboardingDone(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return val === 'true';
}

export async function markOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
}

// ─── Statistics ───────────────────────────────────────────────────────────────
export function computeStats(games: GameEntry[]): TrackerStats {
  const totalGames = games.length;
  const totalWins = games.filter(g => g.won === true).length;
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  // Form Score: letzte 8 Spiele, Siegquote × 100
  const recent8 = games.slice(0, 8);
  const recentWins = recent8.filter(g => g.won === true).length;
  const formScore = recent8.length > 0 ? Math.round((recentWins / recent8.length) * 100) : 0;
  const recentForm = recent8.map(g => (g.won === true ? 1 : 0));

  // Own Level: Basiswert 3.0 + Bonus aus Siegquote + Gegner-Levels
  const avgOpponentLevel = games
    .filter(g => g.partnerLevel != null)
    .reduce((sum, g) => sum + (g.partnerLevel ?? 0), 0) / Math.max(1, games.filter(g => g.partnerLevel != null).length);
  const ownLevel = Math.min(5.0, Math.max(1.0,
    parseFloat((3.0 + (winRate / 100) * 1.5 + (avgOpponentLevel > 0 ? (avgOpponentLevel - 3.0) * 0.3 : 0)).toFixed(1))
  ));

  // Shot Stats
  const shotStats = {} as TrackerStats['shotStats'];
  for (const shot of ALL_SHOTS) {
    const good = games.filter(g => g.goodShots.includes(shot)).length;
    const bad = games.filter(g => g.badShots.includes(shot)).length;
    const total = good + bad;
    shotStats[shot] = { good, bad, rate: total > 0 ? Math.round((good / total) * 100) : 0 };
  }

  // Zone Stats
  const zoneStats = {} as TrackerStats['zoneStats'];
  for (const zone of ALL_ZONES) {
    const strong = games.filter(g => g.strongZones.includes(zone)).length;
    const weak = games.filter(g => g.weakZones.includes(zone)).length;
    zoneStats[zone] = { strong, weak };
  }

  // Factor Correlations
  const baseWinRate = winRate;
  const factorCorrelations = ALL_FACTORS.map(factor => {
    const withFactor = games.filter(g => g.factors.includes(factor));
    if (withFactor.length < 2) return { factor, winRateDelta: 0 };
    const factorWinRate = Math.round(
      (withFactor.filter(g => g.won === true).length / withFactor.length) * 100
    );
    return { factor, winRateDelta: factorWinRate - baseWinRate };
  }).filter(f => f.winRateDelta !== 0);

  // Partner Stats
  const partnerMap = new Map<string, { games: number; wins: number }>();
  for (const g of games) {
    if (!g.partnerName) continue;
    const p = partnerMap.get(g.partnerName) ?? { games: 0, wins: 0 };
    p.games++;
    if (g.won === true) p.wins++;
    partnerMap.set(g.partnerName, p);
  }
  const partnerStats = Array.from(partnerMap.entries())
    .map(([name, s]) => ({ name, ...s, winRate: Math.round((s.wins / s.games) * 100) }))
    .sort((a, b) => b.winRate - a.winRate);

  return {
    totalGames, totalWins, winRate, formScore, ownLevel,
    shotStats, zoneStats, factorCorrelations, partnerStats, recentForm,
  };
}

// ─── Weather (Open-Meteo, kein API-Key) ──────────────────────────────────────
export async function fetchWeather(lat: number, lon: number): Promise<import('@/types/tracker').WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation`;
    const res = await fetch(url);
    const data = await res.json();
    const cw = data.current_weather;
    const condition = weatherCodeToLabel(cw.weathercode ?? 0);
    return { temp: Math.round(cw.temperature), condition, windSpeed: Math.round(cw.windspeed) };
  } catch {
    return null;
  }
}

function weatherCodeToLabel(code: number): string {
  if (code === 0) return 'Sonnig';
  if (code <= 3) return 'Bewölkt';
  if (code <= 49) return 'Neblig';
  if (code <= 67) return 'Regen';
  if (code <= 77) return 'Schnee';
  if (code <= 82) return 'Schauer';
  return 'Gewitter';
}
