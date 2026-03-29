/**
 * Tests for the GroupSchedulePreview logic:
 * - formGroups produces groups with correct match counts
 * - consecutive-run indicator logic is correct
 * - preview groups are consistent with tournament groups
 */

import { describe, it, expect } from 'vitest';
import { formGroups } from '../lib/groupsKO';
import type { Team, Court } from '../types';

function makeTeam(id: string): Team {
  return { id, name: `Team ${id}`, player1: `P${id}a`, player2: `P${id}b` };
}
function makeCourt(id: string, name = `Court ${id}`): Court {
  return { id, name, active: true };
}

/** Compute max consecutive games per team in a match list */
function maxConsecutiveForTeam(
  matches: { team1: string[]; team2: string[] }[],
  teamId: string,
): number {
  let run = 0, best = 0;
  for (const m of matches) {
    const plays =
      (m.team1[0] === `P${teamId}a` && m.team1[1] === `P${teamId}b`) ||
      (m.team2[0] === `P${teamId}a` && m.team2[1] === `P${teamId}b`);
    if (plays) { run++; best = Math.max(best, run); }
    else { run = 0; }
  }
  return best;
}

/** Expected number of round-robin matches for n teams: n*(n-1)/2 */
function expectedMatchCount(n: number) {
  return (n * (n - 1)) / 2;
}

describe('GroupSchedulePreview – group generation', () => {
  it('produces correct match count for 4 teams in 1 group', () => {
    const teams = ['A', 'B', 'C', 'D'].map(makeTeam);
    const courts = [makeCourt('c1')];
    const groups = formGroups(teams, courts);
    expect(groups).toHaveLength(1);
    expect(groups[0].matches).toHaveLength(expectedMatchCount(4)); // 6
    expect(groups[0].teams).toHaveLength(4);
  });

  it('produces correct match count for 6 teams in 2 groups', () => {
    const teams = ['A', 'B', 'C', 'D', 'E', 'F'].map(makeTeam);
    const courts = [makeCourt('c1'), makeCourt('c2')];
    const groups = formGroups(teams, courts);
    expect(groups).toHaveLength(2);
    const totalMatches = groups.reduce((s, g) => s + g.matches.length, 0);
    // Each group has 3 teams → 3 matches each → 6 total
    expect(totalMatches).toBe(6);
  });

  it('all matches in a group use the correct court', () => {
    const teams = ['A', 'B', 'C', 'D'].map(makeTeam);
    const courts = [makeCourt('c1', 'Platz 1')];
    const groups = formGroups(teams, courts);
    groups[0].matches.forEach((m) => {
      expect(m.courtId).toBe('c1');
      expect(m.courtName).toBe('Platz 1');
    });
  });

  it('every team appears in exactly (n-1) matches within its group', () => {
    const teams = ['A', 'B', 'C', 'D', 'E'].map(makeTeam);
    const courts = [makeCourt('c1')];
    const groups = formGroups(teams, courts);
    const group = groups[0];
    for (const team of group.teams) {
      const appearances = group.matches.filter(
        (m) =>
          (m.team1[0] === team.player1 && m.team1[1] === team.player2) ||
          (m.team2[0] === team.player1 && m.team2[1] === team.player2),
      ).length;
      expect(appearances).toBe(group.teams.length - 1);
    }
  });

  it('no team plays more than 2 consecutive matches (5 teams, 50 runs)', () => {
    const teams = ['A', 'B', 'C', 'D', 'E'].map(makeTeam);
    const courts = [makeCourt('c1')];
    for (let i = 0; i < 50; i++) {
      const groups = formGroups(teams, courts);
      for (const t of teams) {
        const c = maxConsecutiveForTeam(groups[0].matches, t.id);
        expect(c).toBeLessThanOrEqual(2);
      }
    }
  });

  it('no team plays more than 2 consecutive matches (4 teams, 50 runs)', () => {
    const teams = ['A', 'B', 'C', 'D'].map(makeTeam);
    const courts = [makeCourt('c1')];
    for (let i = 0; i < 50; i++) {
      const groups = formGroups(teams, courts);
      for (const t of teams) {
        const c = maxConsecutiveForTeam(groups[0].matches, t.id);
        expect(c).toBeLessThanOrEqual(2);
      }
    }
  });

  it('all matches have initial score null (unplayed)', () => {
    const teams = ['A', 'B', 'C', 'D'].map(makeTeam);
    const courts = [makeCourt('c1')];
    const groups = formGroups(teams, courts);
    groups[0].matches.forEach((m) => {
      expect(m.score1).toBeNull();
      expect(m.score2).toBeNull();
    });
  });

  it('group names are assigned alphabetically (A, B, C, ...)', () => {
    const teams = Array.from({ length: 9 }, (_, i) => makeTeam(String(i + 1)));
    const courts = [makeCourt('c1'), makeCourt('c2'), makeCourt('c3')];
    const groups = formGroups(teams, courts);
    expect(groups[0].name).toBe('Gruppe A');
    expect(groups[1].name).toBe('Gruppe B');
    expect(groups[2].name).toBe('Gruppe C');
  });
});
