/**
 * Tests for tournament result screen logic:
 *  - isKOComplete: detects when the final match has a winner
 *  - derivePlacements: correctly ranks teams from KO bracket
 */

import { describe, it, expect } from 'vitest';
import type { KOBracket, KOMatch, Team } from '@/types';

// ─── Helpers (copied from tournament-result.tsx for testability) ──────────────

function isKOComplete(bracket: KOBracket): boolean {
  if (!bracket.matches.length) return false;
  const maxRoundIndex = Math.max(...bracket.matches.map((m) => m.roundIndex));
  const finalMatch = bracket.matches.find(
    (m) => m.roundIndex === maxRoundIndex && m.matchIndex === 0,
  );
  return !!(finalMatch?.winner);
}

function derivePlacements(
  matches: KOMatch[],
): { rank: number; team: Team; roundName: string }[] {
  if (!matches.length) return [];
  const maxRoundIndex = Math.max(...matches.map((m) => m.roundIndex));
  const finalMatch = matches.find(
    (m) => m.roundIndex === maxRoundIndex && m.matchIndex === 0,
  );
  if (!finalMatch?.winner) return [];

  const placements: { rank: number; team: Team; roundName: string }[] = [];

  for (let ri = maxRoundIndex; ri >= 0; ri--) {
    const roundMatches = matches.filter((m) => m.roundIndex === ri);
    const matchesInRound = roundMatches.length;
    const loserRank = ri === maxRoundIndex ? 2 : matchesInRound + 1;

    for (const m of roundMatches) {
      if (m.score1 === null || m.score2 === null) continue;
      if (ri === maxRoundIndex && m.winner) {
        placements.push({ rank: 1, team: m.winner, roundName: m.round });
      }
      const loser =
        m.score1 > m.score2
          ? m.team2
          : m.score2 > m.score1
          ? m.team1
          : null;
      if (loser) {
        placements.push({ rank: loserRank, team: loser, roundName: m.round });
      }
    }
  }

  placements.sort((a, b) => a.rank - b.rank || a.team.name.localeCompare(b.team.name));
  return placements;
}

// ─── Test Data Factories ──────────────────────────────────────────────────────

function makeTeam(id: string, name: string): Team {
  return { id, name, player1: 'P1', player2: 'P2' };
}

function makeMatch(
  id: string,
  roundIndex: number,
  matchIndex: number,
  round: string,
  t1: Team | null,
  t2: Team | null,
  score1: number | null,
  score2: number | null,
  winner?: Team,
): KOMatch {
  return {
    id,
    round,
    roundIndex,
    matchIndex,
    team1: t1,
    team2: t2,
    score1,
    score2,
    winner,
    courtId: 'c1',
    courtName: 'Court 1',
  };
}

// ─── isKOComplete ─────────────────────────────────────────────────────────────

describe('isKOComplete', () => {
  const tA = makeTeam('a', 'Alpha');
  const tB = makeTeam('b', 'Beta');

  it('returns false for empty bracket', () => {
    expect(isKOComplete({ rounds: [], matches: [] })).toBe(false);
  });

  it('returns false when final has no winner', () => {
    const m = makeMatch('m1', 0, 0, 'Finale', tA, tB, null, null);
    expect(isKOComplete({ rounds: ['Finale'], matches: [m] })).toBe(false);
  });

  it('returns false when final score is set but winner is missing', () => {
    const m = makeMatch('m1', 0, 0, 'Finale', tA, tB, 2, 1);
    // winner intentionally omitted
    expect(isKOComplete({ rounds: ['Finale'], matches: [m] })).toBe(false);
  });

  it('returns true when final has a winner', () => {
    const m = makeMatch('m1', 0, 0, 'Finale', tA, tB, 2, 1, tA);
    expect(isKOComplete({ rounds: ['Finale'], matches: [m] })).toBe(true);
  });

  it('uses highest roundIndex as final (multi-round bracket)', () => {
    const tC = makeTeam('c', 'Gamma');
    const tD = makeTeam('d', 'Delta');
    const sf1 = makeMatch('sf1', 0, 0, 'Halbfinale', tA, tB, 2, 0, tA);
    const sf2 = makeMatch('sf2', 0, 1, 'Halbfinale', tC, tD, 0, 2, tD);
    // Final not yet played
    const fin = makeMatch('fin', 1, 0, 'Finale', tA, tD, null, null);
    expect(isKOComplete({ rounds: ['Halbfinale', 'Finale'], matches: [sf1, sf2, fin] })).toBe(false);
  });

  it('returns true when all rounds including final are done', () => {
    const tC = makeTeam('c', 'Gamma');
    const tD = makeTeam('d', 'Delta');
    const sf1 = makeMatch('sf1', 0, 0, 'Halbfinale', tA, tB, 2, 0, tA);
    const sf2 = makeMatch('sf2', 0, 1, 'Halbfinale', tC, tD, 0, 2, tD);
    const fin = makeMatch('fin', 1, 0, 'Finale', tA, tD, 2, 1, tA);
    expect(isKOComplete({ rounds: ['Halbfinale', 'Finale'], matches: [sf1, sf2, fin] })).toBe(true);
  });
});

// ─── derivePlacements ─────────────────────────────────────────────────────────

describe('derivePlacements', () => {
  it('returns empty array for empty matches', () => {
    expect(derivePlacements([])).toEqual([]);
  });

  it('returns empty array when final has no winner', () => {
    const tA = makeTeam('a', 'Alpha');
    const tB = makeTeam('b', 'Beta');
    const fin = makeMatch('fin', 0, 0, 'Finale', tA, tB, null, null);
    expect(derivePlacements([fin])).toEqual([]);
  });

  it('correctly assigns rank 1 and 2 from a single final', () => {
    const tA = makeTeam('a', 'Alpha');
    const tB = makeTeam('b', 'Beta');
    const fin = makeMatch('fin', 0, 0, 'Finale', tA, tB, 2, 1, tA);
    const result = derivePlacements([fin]);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ rank: 1, team: tA });
    expect(result[1]).toMatchObject({ rank: 2, team: tB });
  });

  it('correctly assigns rank 1, 2, 3 from semi + final', () => {
    const tA = makeTeam('a', 'Alpha');
    const tB = makeTeam('b', 'Beta');
    const tC = makeTeam('c', 'Gamma');
    const tD = makeTeam('d', 'Delta');
    const sf1 = makeMatch('sf1', 0, 0, 'Halbfinale', tA, tB, 2, 0, tA);
    const sf2 = makeMatch('sf2', 0, 1, 'Halbfinale', tC, tD, 0, 2, tD);
    const fin = makeMatch('fin', 1, 0, 'Finale', tA, tD, 2, 1, tA);

    const result = derivePlacements([sf1, sf2, fin]);

    const rank1 = result.filter((p) => p.rank === 1);
    const rank2 = result.filter((p) => p.rank === 2);
    const rank3 = result.filter((p) => p.rank === 3);

    expect(rank1).toHaveLength(1);
    expect(rank1[0].team.id).toBe('a');

    expect(rank2).toHaveLength(1);
    expect(rank2[0].team.id).toBe('d');

    // Both semi-final losers get rank 3
    expect(rank3).toHaveLength(2);
    const rank3Ids = rank3.map((p) => p.team.id).sort();
    expect(rank3Ids).toEqual(['b', 'c']);
  });

  it('result is sorted by rank ascending', () => {
    const tA = makeTeam('a', 'Alpha');
    const tB = makeTeam('b', 'Beta');
    const fin = makeMatch('fin', 0, 0, 'Finale', tA, tB, 2, 1, tA);
    const result = derivePlacements([fin]);
    expect(result[0].rank).toBeLessThanOrEqual(result[1].rank);
  });
});
