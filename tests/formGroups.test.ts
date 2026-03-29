import { describe, it, expect } from 'vitest';
import { formGroups } from '../lib/groupsKO';
import type { Team, Court } from '../types';

function makeTeams(n: number): Team[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `t${i}`,
    name: `Team ${i + 1}`,
    player1: `P${i * 2 + 1}`,
    player2: `P${i * 2 + 2}`,
  }));
}

function makeCourts(n: number): Court[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i}`,
    name: `Court ${i + 1}`,
    active: true,
  }));
}

describe('formGroups', () => {
  it('3 teams, 1 court → 1 group with 3 teams', () => {
    const groups = formGroups(makeTeams(3), makeCourts(1));
    expect(groups).toHaveLength(1);
    expect(groups[0].teams).toHaveLength(3);
  });

  it('6 teams, 2 courts → 2 groups with 3 teams each', () => {
    const groups = formGroups(makeTeams(6), makeCourts(2));
    expect(groups).toHaveLength(2);
    groups.forEach(g => expect(g.teams).toHaveLength(3));
  });

  it('7 teams, 2 courts → 2 groups: one with 4, one with 3', () => {
    const groups = formGroups(makeTeams(7), makeCourts(2));
    expect(groups).toHaveLength(2);
    const sizes = groups.map(g => g.teams.length).sort();
    expect(sizes).toEqual([3, 4]);
  });

  it('8 teams, 2 courts → 2 groups with 4 teams each', () => {
    const groups = formGroups(makeTeams(8), makeCourts(2));
    expect(groups).toHaveLength(2);
    groups.forEach(g => expect(g.teams).toHaveLength(4));
  });

  it('10 teams, 2 courts → 2 groups with 5 teams each', () => {
    const groups = formGroups(makeTeams(10), makeCourts(2));
    expect(groups).toHaveLength(2);
    groups.forEach(g => expect(g.teams).toHaveLength(5));
  });

  it('11 teams, 2 courts → 2 groups: one with 6, one with 5', () => {
    const groups = formGroups(makeTeams(11), makeCourts(2));
    expect(groups).toHaveLength(2);
    const sizes = groups.map(g => g.teams.length).sort();
    expect(sizes).toEqual([5, 6]);
  });

  it('12 teams, 3 courts → 3 groups with 4 teams each', () => {
    const groups = formGroups(makeTeams(12), makeCourts(3));
    expect(groups).toHaveLength(3);
    groups.forEach(g => expect(g.teams).toHaveLength(4));
  });

  it('5 teams, 3 courts → falls back to 1 group (min 3 per group)', () => {
    const groups = formGroups(makeTeams(5), makeCourts(3));
    expect(groups).toHaveLength(1);
    expect(groups[0].teams).toHaveLength(5);
  });

  it('all teams are distributed (no team lost)', () => {
    for (const n of [3, 5, 7, 9, 11, 13, 16, 20]) {
      const courts = makeCourts(3);
      const groups = formGroups(makeTeams(n), courts);
      const total = groups.reduce((sum, g) => sum + g.teams.length, 0);
      expect(total).toBe(n);
    }
  });

  it('each group has at least 3 teams', () => {
    for (const n of [3, 4, 5, 6, 7, 8, 9, 10, 12, 15]) {
      const courts = makeCourts(2);
      const groups = formGroups(makeTeams(n), courts);
      groups.forEach(g => expect(g.teams.length).toBeGreaterThanOrEqual(3));
    }
  });

  it('round-robin matches generated correctly for each group', () => {
    const groups = formGroups(makeTeams(6), makeCourts(2));
    groups.forEach(g => expect(g.matches).toHaveLength(3));
  });

  it('each group gets assigned a court', () => {
    const groups = formGroups(makeTeams(9), makeCourts(3));
    groups.forEach(g => {
      expect(g.courtId).toBeTruthy();
      expect(g.courtName).toBeTruthy();
    });
  });
});
