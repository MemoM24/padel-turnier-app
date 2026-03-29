export type TournamentType =
  | 'americano'
  | 'americano_mixed'
  | 'mexicano'
  | 'king_of_court'
  | 'groups_ko';

export type GameMode = 'points' | 'time';

/** How match results are recorded and standings calculated */
export type ScoringMode = 'americano' | 'classic' | 'supertiebreak';

export interface Player {
  id: string;
  name: string;
  games: number;
  points: number;
}

export interface Court {
  id: string;
  name: string;
  active: boolean;
}

export interface SetScore {
  s1: number | null; // team1 score for this set
  s2: number | null; // team2 score for this set
}

export interface Match {
  id: string;
  courtId: string;
  courtName: string;
  team1: string[];
  team2: string[];
  score1: number | null; // total points / sets won (team1)
  score2: number | null; // total points / sets won (team2)
  sets?: SetScore[];     // for classic mode: [set1, set2, set3?]
  isBye?: boolean;
}

export interface Round {
  id: number;
  matches: Match[];
  byePlayers: string[];
  isFinal?: boolean;   // true for ranking-based final round
  isExtra?: boolean;  // true for extra rounds beyond planned numRounds
}

export interface TournamentSettings {
  type: TournamentType;
  pointsPerRound: number;
  numRounds: number; // 0 = auto
  byePoints: number;
  gameMode: GameMode;
  gameTimeMinutes: number;
  courts: Court[];
  scoringMode?: ScoringMode;    // 'americano' | 'classic' | 'supertiebreak'
  superTiebreakPoints?: number; // target points for super-tiebreak (default 10)
}

export interface Tournament {
  id: string;
  name: string;
  createdAt: string;
  settings: TournamentSettings;
  players: Player[];
  rounds: Round[];
  currentRound: number;
  finished: boolean;
  firebaseId?: string;
}

export interface TournamentHistoryItem {
  id: string;
  name: string;
  type: TournamentType;
  playerCount: number;
  createdAt: string;
  finished: boolean;
  playerNames: string[];
}

export interface WizardState {
  type: TournamentType | null;
  settings: Partial<TournamentSettings>;
  players: string[];
  tournamentName: string;
}
