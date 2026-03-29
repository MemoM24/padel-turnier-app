import { describe, it, expect } from 'vitest';
import { updateGroupMatchScore, updateKOMatchScore, getGroupStandings } from '../lib/groupsKO';
import type { Group, Team, KOBracket, SetScore } from '../types';

// ─── Helper: computeResultFromSets (inline copy for testing) ─────────────────
function computeResult(sets: SetScore[]): { score1: number; score2: number } {
  let s1 = 0, s2 = 0;
  for (const s of sets) {
    if (s.s1 === null || s.s2 === null) continue;
    if (s.s1 > s.s2) s1++;
    else if (s.s2 > s.s1) s2++;
  }
  return { score1: s1, score2: s2 };
}

describe('computeResultFromSets', () => {
  it('6:4, 6:3 → team1 wins 2:0', () => {
    const r = computeResult([{ s1: 6, s2: 4 }, { s1: 6, s2: 3 }]);
    expect(r).toEqual({ score1: 2, score2: 0 });
  });

  it('4:6, 6:3, 10:8 → team1 wins 2:1', () => {
    const r = computeResult([{ s1: 4, s2: 6 }, { s1: 6, s2: 3 }, { s1: 10, s2: 8 }]);
    expect(r).toEqual({ score1: 2, score2: 1 });
  });

  it('3:6, 6:3, 8:10 → team2 wins 1:2', () => {
    const r = computeResult([{ s1: 3, s2: 6 }, { s1: 6, s2: 3 }, { s1: 8, s2: 10 }]);
    expect(r).toEqual({ score1: 1, score2: 2 });
  });

  it('3:6, 2:6 → team2 wins 0:2', () => {
    const r = computeResult([{ s1: 3, s2: 6 }, { s1: 2, s2: 6 }]);
    expect(r).toEqual({ score1: 0, score2: 2 });
  });

  it('ignores sets with null values', () => {
    const r = computeResult([{ s1: 6, s2: 4 }, { s1: null, s2: null }]);
    expect(r).toEqual({ score1: 1, score2: 0 });
  });
});

// ─── updateGroupMatchScore with sets ─────────────────────────────────────────

function makeTeam(id: string, p1: string, p2: string): Team {
  return { id, name: `Team ${id}`, player1: p1, player2: p2 };
}

function makeGroup(teams: Team[]): Group {
  return {
    id: 'g1',
    name: 'Gruppe A',
    teams,
    courtId: 'c1',
    courtName: 'Court 1',
    matches: [
      {
        id: 'm1',
        courtId: 'c1',
        courtName: 'Court 1',
        team1: [teams[0].player1, teams[0].player2],
        team2: [teams[1].player1, teams[1].player2],
        score1: null,
        score2: null,
      },
    ],
  };
}

describe('updateGroupMatchScore', () => {
  it('stores score1/score2 and sets on the match', () => {
    const t1 = makeTeam('t1', 'Alice', 'Bob');
    const t2 = makeTeam('t2', 'Carol', 'Dave');
    const groups = [makeGroup([t1, t2])];
    const sets: SetScore[] = [{ s1: 6, s2: 4 }, { s1: 6, s2: 3 }, { s1: null, s2: null }];

    const updated = updateGroupMatchScore(groups, 'g1', 'm1', 2, 0, sets);
    const match = updated[0].matches[0];
    expect(match.score1).toBe(2);
    expect(match.score2).toBe(0);
    expect(match.sets).toEqual(sets);
  });

  it('works without sets parameter (backward compatible)', () => {
    const t1 = makeTeam('t1', 'Alice', 'Bob');
    const t2 = makeTeam('t2', 'Carol', 'Dave');
    const groups = [makeGroup([t1, t2])];

    const updated = updateGroupMatchScore(groups, 'g1', 'm1', 1, 0);
    const match = updated[0].matches[0];
    expect(match.score1).toBe(1);
    expect(match.score2).toBe(0);
    expect(match.sets).toBeUndefined();
  });
});

// ─── getGroupStandings with set-based scores ──────────────────────────────────

describe('getGroupStandings with set-based scores', () => {
  it('win gives +3 points, loss gives 0', () => {
    const t1 = makeTeam('t1', 'Alice', 'Bob');
    const t2 = makeTeam('t2', 'Carol', 'Dave');
    const t3 = makeTeam('t3', 'Eve', 'Frank');

    const group: Group = {
      id: 'g1',
      name: 'Gruppe A',
      teams: [t1, t2, t3],
      courtId: 'c1',
      courtName: 'Court 1',
      matches: [
        // t1 beats t2: 2:0 sets
        { id: 'm1', courtId: 'c1', courtName: 'Court 1', team1: ['Alice', 'Bob'], team2: ['Carol', 'Dave'], score1: 2, score2: 0 },
        // t1 beats t3: 2:1 sets
        { id: 'm2', courtId: 'c1', courtName: 'Court 1', team1: ['Alice', 'Bob'], team2: ['Eve', 'Frank'], score1: 2, score2: 1 },
        // t2 beats t3: 2:0 sets
        { id: 'm3', courtId: 'c1', courtName: 'Court 1', team1: ['Carol', 'Dave'], team2: ['Eve', 'Frank'], score1: 2, score2: 0 },
      ],
    };

    const standings = getGroupStandings(group, [t1, t2, t3]);
    // t1: 2 wins = 6 pts, t2: 1 win 1 loss = 3 pts, t3: 2 losses = 0 pts
    expect(standings[0].team.id).toBe('t1');
    expect(standings[0].points).toBe(6);
    expect(standings[0].won).toBe(2);

    expect(standings[1].team.id).toBe('t2');
    expect(standings[1].points).toBe(3);
    expect(standings[1].won).toBe(1);

    expect(standings[2].team.id).toBe('t3');
    expect(standings[2].points).toBe(0);
    expect(standings[2].won).toBe(0);
  });

  it('draw (1:1 sets) gives +1 point to each team', () => {
    const t1 = makeTeam('t1', 'Alice', 'Bob');
    const t2 = makeTeam('t2', 'Carol', 'Dave');

    const group: Group = {
      id: 'g1',
      name: 'Gruppe A',
      teams: [t1, t2],
      courtId: 'c1',
      courtName: 'Court 1',
      matches: [
        // 1:1 sets = draw
        { id: 'm1', courtId: 'c1', courtName: 'Court 1', team1: ['Alice', 'Bob'], team2: ['Carol', 'Dave'], score1: 1, score2: 1 },
      ],
    };

    const standings = getGroupStandings(group, [t1, t2]);
    expect(standings[0].points).toBe(1);
    expect(standings[1].points).toBe(1);
    expect(standings[0].drawn).toBe(1);
    expect(standings[1].drawn).toBe(1);
  });
});
