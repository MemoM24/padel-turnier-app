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
  // Groups KO specific
  teams?: Team[];
  groups?: Group[];
  koBracket?: KOBracket;
  groupPhaseComplete?: boolean;
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
  teams?: Team[];           // for groups_ko mode
  tournamentName: string;
}

/** A fixed pair of two players for Groups KO */
export interface Team {
  id: string;
  name: string;        // e.g. "Team 1" or custom name
  player1: string;
  player2: string;
}

/** A group in the group phase */
export interface Group {
  id: string;
  name: string;        // "Gruppe A", "Gruppe B", ...
  teams: Team[];
  courtId: string;
  courtName: string;
  matches: Match[];    // round-robin matches within this group
}

/** A single KO match in the bracket */
export interface KOMatch {
  id: string;
  round: string;       // e.g. "Achtelfinale", "Viertelfinale", "Halbfinale", "Finale"
  roundIndex: number;  // 0 = first KO round, increases toward final
  matchIndex: number;  // position within the round
  team1: Team | null;  // null = TBD
  team2: Team | null;
  score1: number | null;
  score2: number | null;
  sets?: SetScore[];
  winner?: Team;
  courtId?: string;
  courtName?: string;
}

/** Full KO bracket */
export interface KOBracket {
  rounds: string[];    // ordered round names
  matches: KOMatch[];
}
