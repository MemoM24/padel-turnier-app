export type TournamentType =
  | 'americano'
  | 'americano_mixed'
  | 'mexicano'
  | 'king_of_court'
  | 'groups_ko';

export type GameMode = 'points' | 'time';

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

export interface Match {
  id: string;
  courtId: string;
  courtName: string;
  team1: string[];
  team2: string[];
  score1: number | null;
  score2: number | null;
  isBye?: boolean;
}

export interface Round {
  id: number;
  matches: Match[];
  byePlayers: string[];
}

export interface TournamentSettings {
  type: TournamentType;
  pointsPerRound: number;
  numRounds: number; // 0 = auto
  byePoints: number;
  gameMode: GameMode;
  gameTimeMinutes: number;
  courts: Court[];
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
}
