import { describe, it, expect } from 'vitest';
import { formGroups } from '../lib/groupsKO';
import type { Team, Court } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTeam(id: string): Team {
  return { id, name: `Team ${id}`, player1: `P${id}a`, player2: `P${id}b` };
}

function makeCourt(id: string): Court {
  return { id, name: `Court ${id}`, active: true };
}

/**
 * For a given match list, compute the maximum number of consecutive matches
 * any single team plays without a break (i.e. without sitting out).
 */
function maxConsecutiveForTeam(matches: { team1: string[]; team2: string[] }[], teamId: string): number {
  // Build player-key → team-id lookup isn't available here, so we use player names directly.
  // We identify a team by its two player strings.
  let maxRun = 0;
  let currentRun = 0;
  for (const m of matches) {
    const plays =
      (m.team1[0] === `P${teamId}a` && m.team1[1] === `P${teamId}b`) ||
      (m.team2[0] === `P${teamId}a` && m.team2[1] === `P${teamId}b`);
    if (plays) {
      currentRun++;
      maxRun = Math.max(maxRun, currentRun);
    } else {
      currentRun = 0;
    }
  }
  return maxRun;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Max-2-Consecutive Scheduling', () => {
  it('3 teams: no team plays more than 2 in a row', () => {
    // 3 teams → 3 matches (A-B, A-C, B-C)
    const teams = ['A', 'B', 'C'].map(makeTeam);
    const courts = [makeCourt('c1')];
    const groups = formGroups(teams, courts);
    const matches = groups[0].matches;

    expect(matches).toHaveLength(3);
    for (const t of teams) {
      expect(maxConsecutiveForTeam(matches, t.id)).toBeLessThanOrEqual(2);
    }
  });

  it('4 teams: no team plays more than 2 in a row', () => {
    // 4 teams → 6 matches
    const teams = ['A', 'B', 'C', 'D'].map(makeTeam);
    const courts = [makeCourt('c1')];
    const groups = formGroups(teams, courts);
    const matches = groups[0].matches;

    expect(matches).toHaveLength(6);
    for (const t of teams) {
      expect(maxConsecutiveForTeam(matches, t.id)).toBeLessThanOrEqual(2);
    }
  });

  it('5 teams: no team plays more than 2 in a row', () => {
    // 5 teams → 10 matches
    const teams = ['A', 'B', 'C', 'D', 'E'].map(makeTeam);
    const courts = [makeCourt('c1')];
    const groups = formGroups(teams, courts);
    const matches = groups[0].matches;

    expect(matches).toHaveLength(10);
    for (const t of teams) {
      expect(maxConsecutiveForTeam(matches, t.id)).toBeLessThanOrEqual(2);
    }
  });

  it('6 teams: no team plays more than 2 in a row', () => {
    // 6 teams → 15 matches
    const teams = ['A', 'B', 'C', 'D', 'E', 'F'].map(makeTeam);
    const courts = [makeCourt('c1')];
    const groups = formGroups(teams, courts);
    const matches = groups[0].matches;

    expect(matches).toHaveLength(15);
    for (const t of teams) {
      expect(maxConsecutiveForTeam(matches, t.id)).toBeLessThanOrEqual(2);
    }
  });

  it('all pairs are present exactly once (no duplicates, no missing)', () => {
    const teams = ['A', 'B', 'C', 'D', 'E'].map(makeTeam);
    const courts = [makeCourt('c1')];
    const groups = formGroups(teams, courts);
    const matches = groups[0].matches;

    // Build set of played pairs (sorted)
    const played = new Set(
      matches.map((m) => {
        const t1 = m.team1[0].replace('P', '').replace('a', '');
        const t2 = m.team2[0].replace('P', '').replace('a', '');
        return [t1, t2].sort().join('-');
      }),
    );

    // Expected pairs: all combinations of 5 teams
    const expected = new Set<string>();
    const ids = ['A', 'B', 'C', 'D', 'E'];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        expected.add(`${ids[i]}-${ids[j]}`);
      }
    }

    expect(played).toEqual(expected);
  });

  it('multiple groups: constraint holds independently per group', () => {
    // 8 teams, 2 courts → 2 groups of 4
    const teams = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(makeTeam);
    const courts = [makeCourt('c1'), makeCourt('c2')];
    const groups = formGroups(teams, courts);

    expect(groups).toHaveLength(2);
    for (const group of groups) {
      expect(group.matches).toHaveLength(6); // 4 teams → 6 matches
      for (const t of group.teams) {
        expect(maxConsecutiveForTeam(group.matches, t.id)).toBeLessThanOrEqual(2);
      }
    }
  });

  it('runs the algorithm 20 times (random shuffle) — constraint always holds for 5 teams', () => {
    // Because the algorithm uses shuffle(), run it many times to catch edge cases
    for (let run = 0; run < 20; run++) {
      const teams = ['A', 'B', 'C', 'D', 'E'].map(makeTeam);
      const courts = [makeCourt('c1')];
      const groups = formGroups(teams, courts);
      const matches = groups[0].matches;
      for (const t of teams) {
        const maxRun = maxConsecutiveForTeam(matches, t.id);
        expect(maxRun).toBeLessThanOrEqual(2);
      }
    }
  });
});
