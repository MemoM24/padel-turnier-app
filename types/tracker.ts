/**
 * tracker.ts – Datenmodell für den persönlichen Padel-Begleiter
 */

// ─── Schläge ──────────────────────────────────────────────────────────────────
export type ShotType =
  | 'Vibora'
  | 'Smash'
  | 'Bandeja'
  | 'Bajada'
  | 'Lob'
  | 'Aufschlag'
  | 'Volley'
  | 'Rückhand';

export const ALL_SHOTS: ShotType[] = [
  'Vibora', 'Smash', 'Bandeja', 'Bajada', 'Lob', 'Aufschlag', 'Volley', 'Rückhand',
];

// ─── Faktoren ─────────────────────────────────────────────────────────────────
export type FactorType =
  | 'Müde'
  | 'Verletzt'
  | 'Brille störend'
  | 'Nervös'
  | 'Neue Schuhe'
  | 'Top-Form'
  | 'Hitze'
  | 'Kälte';

export const ALL_FACTORS: FactorType[] = [
  'Müde', 'Verletzt', 'Brille störend', 'Nervös', 'Neue Schuhe', 'Top-Form', 'Hitze', 'Kälte',
];

// ─── Court-Zonen ──────────────────────────────────────────────────────────────
export type CourtZone =
  | 'netz-l'
  | 'netz-r'
  | 'mitte-l'
  | 'mitte-r'
  | 'glas-l'
  | 'glas-r';

export const ALL_ZONES: CourtZone[] = [
  'netz-l', 'netz-r', 'mitte-l', 'mitte-r', 'glas-l', 'glas-r',
];

// ─── Mood ─────────────────────────────────────────────────────────────────────
export type MoodScore = 1 | 2 | 3 | 4 | 5;
export const MOOD_EMOJIS: Record<MoodScore, string> = {
  1: '😫', 2: '😕', 3: '😐', 4: '😊', 5: '🔥',
};

// ─── Spieleintrag ─────────────────────────────────────────────────────────────
export interface GameEntry {
  id: string;
  date: string;           // ISO date string
  location?: string;
  mood: MoodScore;
  won: boolean | null;    // null = kein Ergebnis
  scoreOwn?: number;      // eigene Punkte
  scoreOpponent?: number;
  partnerName?: string;
  partnerLevel?: number;  // Playtomic-Level z.B. 4.0
  opponentName?: string;
  opponentNote?: string;
  position?: 'links' | 'rechts';
  strongZones: CourtZone[];
  weakZones: CourtZone[];
  goodShots: ShotType[];
  badShots: ShotType[];
  factors: FactorType[];
  note?: string;
  weather?: WeatherData;
  conditions: FactorType[]; // alias for factors (used in StatsScreen)
  courtZone?: string;      // primary court zone this game
}

// ─── Wetter ───────────────────────────────────────────────────────────────────
export interface WeatherData {
  temp: number;           // °C
  condition: string;      // 'Sonnig', 'Bewölkt', 'Regen', etc.
  windSpeed: number;      // km/h
}

// ─── Geplantes Spiel ──────────────────────────────────────────────────────────
export interface PlannedGame {
  id: string;
  date: string;           // ISO date string
  time: string;           // "HH:MM"
  location?: string;
  partnerName?: string;
  opponentName?: string;
  note?: string;
}

// ─── Spieler-Profil ───────────────────────────────────────────────────────────
export interface PlayerProfile {
  name: string;
  playtomicLevel?: number;
  joinedAt: string;       // ISO date string
  ownLevel?: number;      // berechnet
}

// ─── Achievement ─────────────────────────────────────────────────────────────
export interface Achievement {
  id: string;
  emoji: string;
  label: string;
  unlockedAt?: string;    // ISO date string, undefined = gesperrt
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_game', emoji: '🎾', label: 'Erstes Spiel' },
  { id: 'first_win', emoji: '🏆', label: 'Erster Sieg' },
  { id: 'streak_5', emoji: '🔥', label: '5er Serie' },
  { id: 'games_10', emoji: '📅', label: '10 Spiele' },
  { id: 'level_45', emoji: '⭐', label: 'Level 4.5' },
  { id: 'tournament_win', emoji: '👑', label: 'Turniersieg' },
  { id: 'rain_warrior', emoji: '🌧️', label: 'Regen-Krieger' },
  { id: 'night_player', emoji: '🌙', label: 'Nacht-Spieler' },
];

// ─── Statistiken (berechnet) ──────────────────────────────────────────────────
export interface TrackerStats {
  totalGames: number;
  totalWins: number;
  winRate: number;        // 0-100
  formScore: number;      // 0-100 (letzte 8 Spiele)
  ownLevel: number;       // berechnet
  shotStats: Record<ShotType, { good: number; bad: number; rate: number }>;
  zoneStats: Record<CourtZone, { strong: number; weak: number }>;
  factorCorrelations: Array<{ factor: FactorType; winRateDelta: number }>;
  partnerStats: Array<{ name: string; games: number; wins: number; winRate: number }>;
  recentForm: number[];   // letzte 8 Sessions: 1=Sieg, 0=Niederlage
  topShot?: ShotType;      // bester Schlag
  weakShot?: ShotType;     // schwächster Schlag
}
