/**
 * Groups KO Tournament Logic
 *
 * Flow:
 * 1. Teams are divided into groups (min 3 teams/group, based on team count + active courts)
 * 2. Within each group: round-robin (every team plays every other team once)
 *    - All matches in a group are played on the same fixed court
 * 3. After group phase: top teams advance to KO bracket
 *    - Bracket size: next power of 2 >= number of advancing teams
 *    - Rounds: Achtelfinale / Viertelfinale / Halbfinale / Finale
 */

import type { Team, Group, Match, KOMatch, KOBracket, Court, Tournament } from '@/types';

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

// ─── Group Formation ──────────────────────────────────────────────────────────

/**
 * Divide teams into groups.
 * Rules:
 * - Number of groups = number of active courts (max)
 * - Minimum 3 teams per group
 * - Teams distributed as evenly as possible
 */
export function formGroups(teams: Team[], activeCourts: Court[]): Group[] {
  const numTeams = teams.length;
  if (numTeams < 3) throw new Error('Mindestens 3 Teams benötigt');

  // Determine number of groups: as many as courts, but at most floor(numTeams/3)
  const maxGroups = Math.floor(numTeams / 3);
  const numGroups = Math.min(activeCourts.length, maxGroups);

  // Shuffle teams for random group assignment
  const shuffled = shuffle(teams);
  const groups: Group[] = [];

  const groupLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let g = 0; g < numGroups; g++) {
    const court = activeCourts[g % activeCourts.length];
    groups.push({
      id: generateId(),
      name: `Gruppe ${groupLetters[g]}`,
      teams: [],
      courtId: court.id,
      courtName: court.name,
      matches: [],
    });
  }

  // Distribute teams round-robin style across groups
  shuffled.forEach((team, idx) => {
    groups[idx % numGroups].teams.push(team);
  });

  // Generate round-robin matches for each group
  groups.forEach((group) => {
    group.matches = generateRoundRobin(group.teams, group.courtId, group.courtName);
  });

  return groups;
}

/**
 * Generate all round-robin matches for a set of teams on a fixed court.
 * Each pair plays exactly once.
 */
function generateRoundRobin(teams: Team[], courtId: string, courtName: string): Match[] {
  const matches: Match[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        id: generateId(),
        courtId,
        courtName,
        team1: [teams[i].player1, teams[i].player2],
        team2: [teams[j].player1, teams[j].player2],
        score1: null,
        score2: null,
      });
    }
  }
  return matches;
}

// ─── Group Standings ──────────────────────────────────────────────────────────

export interface GroupStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;     // 3 for win, 1 for draw, 0 for loss
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
}

export function getGroupStandings(group: Group, teams: Team[]): GroupStanding[] {
  const standingMap = new Map<string, GroupStanding>();

  group.teams.forEach((team) => {
    standingMap.set(team.id, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
    });
  });

  group.matches.forEach((match) => {
    if (match.score1 === null || match.score2 === null) return;

    // Find which teams played this match
    const t1 = group.teams.find(
      (t) => t.player1 === match.team1[0] && t.player2 === match.team1[1]
    );
    const t2 = group.teams.find(
      (t) => t.player1 === match.team2[0] && t.player2 === match.team2[1]
    );
    if (!t1 || !t2) return;

    const s1 = standingMap.get(t1.id)!;
    const s2 = standingMap.get(t2.id)!;

    s1.played++;
    s2.played++;
    s1.goalsFor += match.score1;
    s1.goalsAgainst += match.score2;
    s2.goalsFor += match.score2;
    s2.goalsAgainst += match.score1;
    s1.goalDiff = s1.goalsFor - s1.goalsAgainst;
    s2.goalDiff = s2.goalsFor - s2.goalsAgainst;

    if (match.score1 > match.score2) {
      s1.won++; s1.points += 3;
      s2.lost++;
    } else if (match.score2 > match.score1) {
      s2.won++; s2.points += 3;
      s1.lost++;
    } else {
      s1.drawn++; s1.points += 1;
      s2.drawn++; s2.points += 1;
    }

    standingMap.set(t1.id, s1);
    standingMap.set(t2.id, s2);
  });

  return Array.from(standingMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
}

// ─── KO Bracket Generation ────────────────────────────────────────────────────

const KO_ROUND_NAMES: Record<number, string> = {
  2: 'Finale',
  4: 'Halbfinale',
  8: 'Viertelfinale',
  16: 'Achtelfinale',
  32: 'Runde der 32',
};

function getKORoundName(numTeams: number): string {
  return KO_ROUND_NAMES[numTeams] ?? `Runde der ${numTeams}`;
}

/**
 * Determine how many teams advance from each group.
 * Strategy: top 2 from each group advance, then fill remaining slots with best 3rd-place teams.
 * Total advancing teams is rounded up to next power of 2.
 */
export function getAdvancingTeams(groups: Group[], teams: Team[]): Team[] {
  const numGroups = groups.length;
  const advancing: Team[] = [];

  // Top 2 from each group
  const thirdPlaceTeams: { team: Team; standing: GroupStanding }[] = [];

  groups.forEach((group) => {
    const standings = getGroupStandings(group, teams);
    if (standings[0]) advancing.push(standings[0].team);
    if (standings[1]) advancing.push(standings[1].team);
    if (standings[2]) thirdPlaceTeams.push({ team: standings[2].team, standing: standings[2] });
  });

  // Fill to next power of 2
  const targetSize = nextPowerOf2(advancing.length);
  const slotsLeft = targetSize - advancing.length;

  // Sort 3rd-place teams by points, then goal diff
  thirdPlaceTeams.sort((a, b) => {
    if (b.standing.points !== a.standing.points) return b.standing.points - a.standing.points;
    return b.standing.goalDiff - a.standing.goalDiff;
  });

  for (let i = 0; i < Math.min(slotsLeft, thirdPlaceTeams.length); i++) {
    advancing.push(thirdPlaceTeams[i].team);
  }

  // Pad with byes if needed
  while (!isPowerOf2(advancing.length)) {
    advancing.push({ id: '__bye__', name: 'Freilos', player1: '', player2: '' });
  }

  return advancing;
}

function nextPowerOf2(n: number): number {
  if (n <= 2) return 2;
  let p = 2;
  while (p < n) p *= 2;
  return p;
}

function isPowerOf2(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Build the initial KO bracket from a list of advancing teams.
 * Seeding: Group winners are seeded to avoid meeting each other in the first round.
 */
export function buildKOBracket(advancingTeams: Team[], activeCourts: Court[]): KOBracket {
  const n = advancingTeams.length; // must be power of 2
  const rounds: string[] = [];

  // Build round names from first round to final
  let size = n;
  while (size >= 2) {
    rounds.unshift(getKORoundName(size));
    size = size / 2;
  }

  const matches: KOMatch[] = [];
  let roundIndex = 0;
  const roundName = getKORoundName(n);

  // First round matches
  for (let i = 0; i < n; i += 2) {
    const t1 = advancingTeams[i];
    const t2 = advancingTeams[i + 1];
    const court = activeCourts[(i / 2) % activeCourts.length];

    // Handle byes: if one team is a bye, the other auto-advances
    const isBye = t1.id === '__bye__' || t2.id === '__bye__';
    const winner = t1.id === '__bye__' ? t2 : t2.id === '__bye__' ? t1 : undefined;

    matches.push({
      id: generateId(),
      round: roundName,
      roundIndex,
      matchIndex: i / 2,
      team1: t1.id === '__bye__' ? null : t1,
      team2: t2.id === '__bye__' ? null : t2,
      score1: isBye ? (t1.id !== '__bye__' ? 1 : 0) : null,
      score2: isBye ? (t2.id !== '__bye__' ? 1 : 0) : null,
      winner,
      courtId: court.id,
      courtName: court.name,
    });
  }

  // Placeholder matches for subsequent rounds
  let prevRoundMatchCount = n / 2;
  let ri = 1;
  let size2 = n / 2;
  while (size2 >= 2) {
    const rName = getKORoundName(size2);
    const matchCount = size2 / 2;
    for (let i = 0; i < matchCount; i++) {
      const court = activeCourts[i % activeCourts.length];
      matches.push({
        id: generateId(),
        round: rName,
        roundIndex: ri,
        matchIndex: i,
        team1: null,
        team2: null,
        score1: null,
        score2: null,
        courtId: court.id,
        courtName: court.name,
      });
    }
    ri++;
    size2 = size2 / 2;
  }

  return { rounds, matches };
}

// ─── Score Update & Bracket Propagation ──────────────────────────────────────

/**
 * Update a KO match score and propagate the winner to the next round.
 */
export function updateKOMatchScore(
  bracket: KOBracket,
  matchId: string,
  score1: number,
  score2: number,
  teams: Team[],
): KOBracket {
  const matches = bracket.matches.map((m) => ({ ...m }));
  const matchIdx = matches.findIndex((m) => m.id === matchId);
  if (matchIdx === -1) return bracket;

  const match = matches[matchIdx];
  match.score1 = score1;
  match.score2 = score2;

  // Determine winner
  const winner = score1 > score2 ? match.team1 : score2 > score1 ? match.team2 : null;
  match.winner = winner ?? undefined;

  // Propagate to next round
  if (winner) {
    const nextRoundIndex = match.roundIndex + 1;
    const nextMatchIndex = Math.floor(match.matchIndex / 2);
    const isFirstSlot = match.matchIndex % 2 === 0;

    const nextMatch = matches.find(
      (m) => m.roundIndex === nextRoundIndex && m.matchIndex === nextMatchIndex
    );
    if (nextMatch) {
      if (isFirstSlot) {
        nextMatch.team1 = winner;
      } else {
        nextMatch.team2 = winner;
      }
    }
  }

  return { ...bracket, matches };
}

/**
 * Update a group match score.
 */
export function updateGroupMatchScore(
  groups: Group[],
  groupId: string,
  matchId: string,
  score1: number,
  score2: number,
): Group[] {
  return groups.map((g) => {
    if (g.id !== groupId) return g;
    return {
      ...g,
      matches: g.matches.map((m) => {
        if (m.id !== matchId) return m;
        return { ...m, score1, score2 };
      }),
    };
  });
}

/**
 * Check if all group phase matches are complete.
 */
export function isGroupPhaseComplete(groups: Group[]): boolean {
  return groups.every((g) =>
    g.matches.every((m) => m.score1 !== null && m.score2 !== null)
  );
}

/**
 * Create a Groups KO tournament with groups and initial bracket structure.
 */
export function createGroupsKOTournament(
  teams: Team[],
  activeCourts: Court[],
  tournamentId: string,
  tournamentName: string,
): { groups: Group[]; koBracket: KOBracket } {
  const groups = formGroups(teams, activeCourts);
  // Build a placeholder bracket (will be filled after group phase)
  // We need at least 2 teams to build a bracket
  const placeholderAdvancing = teams.slice(0, nextPowerOf2(Math.max(2, Math.floor(teams.length / groups.length) * groups.length)));
  const koBracket = buildKOBracket(
    placeholderAdvancing.map((t) => ({ ...t })),
    activeCourts,
  );

  // Mark all KO matches as TBD initially
  const emptyBracket: KOBracket = {
    rounds: koBracket.rounds,
    matches: koBracket.matches.map((m) => ({
      ...m,
      team1: null,
      team2: null,
      score1: null,
      score2: null,
      winner: undefined,
    })),
  };

  return { groups, koBracket: emptyBracket };
}
