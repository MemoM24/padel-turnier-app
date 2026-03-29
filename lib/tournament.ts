import type { Player, Court, Match, Round, Tournament, TournamentSettings } from '@/types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createTournament(
  playerNames: string[],
  settings: TournamentSettings,
  tournamentName?: string,
): Tournament {
  const players: Player[] = playerNames.map((name) => ({
    id: generateId(),
    name,
    games: 0,
    points: 0,
  }));

  const tournament: Tournament = {
    id: generateId(),
    name: tournamentName?.trim() || `Turnier ${new Date().toLocaleDateString('de-DE')}`,
    createdAt: new Date().toISOString(),
    settings,
    players,
    rounds: [],
    currentRound: 0,
    finished: false,
  };

  // Generate first round
  const firstRound = generateNextRound(tournament);
  if (firstRound) {
    tournament.rounds.push(firstRound);
    tournament.currentRound = 1;
  }

  return tournament;
}

export function generateNextRound(tournament: Tournament): Round | null {
  const { settings, players, rounds } = tournament;
  const activeCourts = settings.courts.filter((c) => c.active);
  if (activeCourts.length === 0) return null;

  const roundNumber = rounds.length + 1;

  if (settings.type === 'mexicano') {
    return generateMexicanoRound(players, activeCourts, roundNumber);
  }

  return generateAmericanoRound(players, activeCourts, roundNumber, rounds.length);
}

function generateAmericanoRound(
  players: Player[],
  courts: Court[],
  roundNumber: number,
  prevRoundsCount: number,
): Round {
  let playerList = [...players];
  const byePlayers: string[] = [];

  // Add bye placeholder if odd number
  if (playerList.length % 2 !== 0) {
    playerList.push({ id: '__bye__', name: '__bye__', games: 0, points: 0 });
  }

  const n = playerList.length;

  // Rotate: fix first player, rotate the rest
  if (prevRoundsCount > 0) {
    const fixed = playerList[0];
    const rest = playerList.slice(1);
    const rotated = [...rest.slice(prevRoundsCount % rest.length), ...rest.slice(0, prevRoundsCount % rest.length)];
    playerList = [fixed, ...rotated];
  }

  const matches: Match[] = [];
  const half = n / 2;
  const courtIndex = { current: 0 };

  for (let i = 0; i < half; i += 2) {
    const t1p1 = playerList[i];
    const t1p2 = playerList[i + 1];
    const t2p1 = playerList[half + i];
    const t2p2 = playerList[half + i + 1];

    if (!t1p1 || !t1p2 || !t2p1 || !t2p2) continue;

    // Check for bye
    const isBye =
      t1p1.id === '__bye__' ||
      t1p2.id === '__bye__' ||
      t2p1.id === '__bye__' ||
      t2p2.id === '__bye__';

    if (isBye) {
      const byePlayer = [t1p1, t1p2, t2p1, t2p2].find((p) => p.id !== '__bye__');
      if (byePlayer) byePlayers.push(byePlayer.name);
      continue;
    }

    const court = courts[courtIndex.current % courts.length];
    courtIndex.current++;

    matches.push({
      id: generateId(),
      courtId: court.id,
      courtName: court.name,
      team1: [t1p1.name, t1p2.name],
      team2: [t2p1.name, t2p2.name],
      score1: null,
      score2: null,
    });
  }

  return { id: roundNumber, matches, byePlayers };
}

function generateMexicanoRound(
  players: Player[],
  courts: Court[],
  roundNumber: number,
): Round {
  // Sort players by points descending
  const sorted = [...players].sort((a, b) => b.points - a.points || b.games - a.games);
  const byePlayers: string[] = [];

  if (sorted.length % 2 !== 0) {
    const byePlayer = sorted.pop();
    if (byePlayer) byePlayers.push(byePlayer.name);
  }

  const matches: Match[] = [];
  // Pair: 1st + 4th vs 2nd + 3rd, 5th + 8th vs 6th + 7th, etc.
  for (let i = 0; i < sorted.length; i += 4) {
    if (i + 3 >= sorted.length) break;
    const court = courts[(i / 4) % courts.length];
    matches.push({
      id: generateId(),
      courtId: court.id,
      courtName: court.name,
      team1: [sorted[i].name, sorted[i + 3].name],
      team2: [sorted[i + 1].name, sorted[i + 2].name],
      score1: null,
      score2: null,
    });
  }

  return { id: roundNumber, matches, byePlayers };
}

export function applyRoundScores(
  tournament: Tournament,
  roundIndex: number,
  scores: { matchId: string; score1: number; score2: number }[],
): Tournament {
  const updated = { ...tournament };
  const round = { ...updated.rounds[roundIndex] };
  const playerMap = new Map(updated.players.map((p) => [p.name, { ...p }]));

  round.matches = round.matches.map((match) => {
    const score = scores.find((s) => s.matchId === match.id);
    if (!score) return match;

    // Update player stats
    for (const name of match.team1) {
      const p = playerMap.get(name);
      if (p) {
        p.games += 1;
        p.points += score.score1;
        playerMap.set(name, p);
      }
    }
    for (const name of match.team2) {
      const p = playerMap.get(name);
      if (p) {
        p.games += 1;
        p.points += score.score2;
        playerMap.set(name, p);
      }
    }

    return { ...match, score1: score.score1, score2: score.score2 };
  });

  // Apply bye points
  for (const byeName of round.byePlayers) {
    const p = playerMap.get(byeName);
    if (p) {
      p.points += updated.settings.byePoints;
      playerMap.set(byeName, p);
    }
  }

  updated.rounds[roundIndex] = round;
  updated.players = Array.from(playerMap.values());

  return updated;
}

/**
 * Generate a final round based on current standings.
 * Pairing: 1st+3rd vs 2nd+4th, 5th+7th vs 6th+8th, etc.
 */
export function generateFinalRound(tournament: Tournament): Round {
  const { players, rounds, settings } = tournament;
  const activeCourts = settings.courts.filter((c) => c.active);
  const courts = activeCourts.length > 0 ? activeCourts : settings.courts;
  const roundNumber = rounds.length + 1;

  // Sort by standings
  const sorted = getStandings(players);
  const byePlayers: string[] = [];

  // If odd number, last player gets a bye
  const activePlayers = [...sorted];
  if (activePlayers.length % 4 !== 0) {
    // Remove players from end until divisible by 4 (they get bye)
    while (activePlayers.length % 4 !== 0) {
      const byePlayer = activePlayers.pop();
      if (byePlayer) byePlayers.push(byePlayer.name);
    }
  }

  const matches: Match[] = [];
  // Pair: 1st+3rd vs 2nd+4th, 5th+7th vs 6th+8th, etc.
  for (let i = 0; i < activePlayers.length; i += 4) {
    if (i + 3 >= activePlayers.length) break;
    const court = courts[(i / 4) % courts.length];
    matches.push({
      id: generateId(),
      courtId: court.id,
      courtName: court.name,
      team1: [activePlayers[i].name, activePlayers[i + 2].name],   // 1st + 3rd
      team2: [activePlayers[i + 1].name, activePlayers[i + 3].name], // 2nd + 4th
      score1: null,
      score2: null,
    });
  }

  return { id: roundNumber, matches, byePlayers, isFinal: true };
}

/**
 * Generate an extra round (random Americano-style) beyond the planned rounds.
 */
export function generateExtraRound(tournament: Tournament): Round {
  const roundNumber = tournament.rounds.length + 1;
  const extra = generateNextRound({ ...tournament, rounds: tournament.rounds });
  if (extra) return { ...extra, id: roundNumber, isExtra: true };
  // Fallback: empty round
  return { id: roundNumber, matches: [], byePlayers: [], isExtra: true };
}

export function getStandings(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.games - a.games;
  });
}

export function getAverage(player: Player): number {
  if (player.games === 0) return 0;
  return Math.round((player.points / player.games) * 10) / 10;
}

export function estimateDuration(totalMatches: number, gameMode: string, gameTimeMinutes: number): number {
  if (gameMode === 'time') return totalMatches * gameTimeMinutes;
  return totalMatches * 7; // 7 min per match default
}

export function calculateTotalMatches(playerCount: number, numRounds: number, courtsCount: number): number {
  const matchesPerRound = Math.floor(playerCount / 4);
  const rounds = numRounds === 0 ? Math.max(playerCount - 1, 4) : numRounds;
  return matchesPerRound * rounds;
}

export function getAutoRounds(playerCount: number): number {
  return Math.max(playerCount - 1, 4);
}

export function getAvatarColor(name: string): string {
  const colors = [
    '#2563eb', // blue
    '#1a9e6f', // green
    '#ec4899', // pink
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#f97316', // orange
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
