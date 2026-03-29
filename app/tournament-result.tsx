/**
 * Tournament Result Screen
 *
 * Shown after the final KO match is played.
 * Displays:
 *  - Champion podium (1st / 2nd / 3rd place)
 *  - Full placement list of all teams
 *  - Buttons: share / new tournament / back to home
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { haptic } from '@/lib/haptics';
import type { KOMatch, Team } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive final placements from a completed KO bracket.
 *
 * Returns an array of placement entries sorted by rank:
 *   rank 1  – champion (winner of final)
 *   rank 2  – runner-up (loser of final)
 *   rank 3  – semi-final losers (shared 3rd)
 *   rank 5+ – quarter-final losers, etc.
 */
function derivePlacements(
  matches: KOMatch[],
): { rank: number; team: Team; roundName: string }[] {
  if (!matches.length) return [];

  const maxRoundIndex = Math.max(...matches.map((m) => m.roundIndex));

  // Final match
  const finalMatch = matches.find(
    (m) => m.roundIndex === maxRoundIndex && m.matchIndex === 0,
  );
  if (!finalMatch?.winner) return [];

  const placements: { rank: number; team: Team; roundName: string }[] = [];

  // Walk rounds from final (highest roundIndex) down to 0
  for (let ri = maxRoundIndex; ri >= 0; ri--) {
    const roundMatches = matches.filter((m) => m.roundIndex === ri);
    const matchesInRound = roundMatches.length;
    // Rank of losers: matchesInRound + 1
    // e.g. 2 semi-final matches → rank 3; 4 QF matches → rank 5
    const loserRank = ri === maxRoundIndex ? 2 : matchesInRound + 1;

    for (const m of roundMatches) {
      if (m.score1 === null || m.score2 === null) continue;

      // Winner of final → rank 1
      if (ri === maxRoundIndex && m.winner) {
        placements.push({ rank: 1, team: m.winner, roundName: m.round });
      }

      // Loser of this match
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

  // Sort by rank, then by team name for stability
  placements.sort((a, b) => a.rank - b.rank || a.team.name.localeCompare(b.team.name));

  return placements;
}

/** Format set array as "6:4  3:6  10:8" */
function formatSets(sets: import('@/types').SetScore[]): string {
  return sets
    .filter((s) => s.s1 !== null && s.s2 !== null)
    .map((s) => `${s.s1}:${s.s2}`)
    .join('  ');
}

// ─── Podium Block ─────────────────────────────────────────────────────────────

function PodiumBlock({
  rank,
  team,
  delay,
}: {
  rank: 1 | 2 | 3;
  team: Team | null;
  delay: number;
}) {
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const MEDAL = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
  const HEIGHT = rank === 1 ? 100 : rank === 2 ? 72 : 56;
  const BG =
    rank === 1
      ? '#FFD700'
      : rank === 2
      ? '#C0C0C0'
      : '#CD7F32';
  const LABEL = rank === 1 ? '1. Platz' : rank === 2 ? '2. Platz' : '3. Platz';

  if (!team) return <View style={[styles.podiumSlot, { flex: rank === 1 ? 1.2 : 1 }]} />;

  return (
    <Animated.View
      style={[
        styles.podiumSlot,
        { flex: rank === 1 ? 1.2 : 1 },
        { transform: [{ translateY }], opacity },
      ]}
    >
      <Text style={styles.podiumMedal}>{MEDAL}</Text>
      <Avatar name={team.name} size="lg" />
      <Text style={styles.podiumTeamName} numberOfLines={1}>
        {team.name}
      </Text>
      <Text style={styles.podiumPlayers} numberOfLines={1}>
        {team.player1} & {team.player2}
      </Text>
      <View style={[styles.podiumBar, { height: HEIGHT, backgroundColor: BG }]}>
        <Text style={styles.podiumBarLabel}>{LABEL}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Placement Row ────────────────────────────────────────────────────────────

function PlacementRow({
  rank,
  team,
  roundName,
}: {
  rank: number;
  team: Team;
  roundName: string;
}) {
  const isTop3 = rank <= 3;
  const MEDAL =
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <View style={[styles.placementRow, isTop3 && styles.placementRowTop]}>
      <View style={styles.placementRankBadge}>
        {MEDAL ? (
          <Text style={styles.placementMedal}>{MEDAL}</Text>
        ) : (
          <Text style={styles.placementRankNum}>{rank}</Text>
        )}
      </View>
      <View style={styles.placementInfo}>
        <Text style={[styles.placementTeam, isTop3 && styles.placementTeamTop]} numberOfLines={1}>
          {team.name}
        </Text>
        <Text style={styles.placementPlayers} numberOfLines={1}>
          {team.player1} & {team.player2}
        </Text>
      </View>
      <Text style={styles.placementRound}>{roundName}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TournamentResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tournament, saveTournament, resetWizard } = useTournament();

  // Trigger success haptic once on mount
  useEffect(() => {
    haptic.success();
  }, []);

  if (!tournament?.koBracket) {
    router.replace('/');
    return null;
  }

  const matches = tournament.koBracket.matches;
  const placements = derivePlacements(matches);

  const champion = placements.find((p) => p.rank === 1)?.team ?? null;
  const runnerUp = placements.find((p) => p.rank === 2)?.team ?? null;
  // There may be two teams at rank 3 (both semi-final losers)
  const thirdPlace = placements.find((p) => p.rank === 3)?.team ?? null;

  // Final match details
  const maxRoundIndex = Math.max(...matches.map((m) => m.roundIndex));
  const finalMatch = matches.find((m) => m.roundIndex === maxRoundIndex && m.matchIndex === 0);
  const finalSetsDisplay = finalMatch?.sets ? formatSets(finalMatch.sets) : null;

  const handleNewTournament = () => {
    haptic.light();
    resetWizard();
    router.replace('/tournament-type');
  };

  const handleGoHome = () => {
    haptic.light();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <AppHeader
        title="Turnierergebnis"
        subtitle={tournament.name}
        showBack={false}
        showLanguageToggle
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Champion banner */}
        {champion && (
          <View style={styles.championBanner}>
            <Text style={styles.championEmoji}>🏆</Text>
            <Text style={styles.championTitle}>Turniersieger</Text>
            <Text style={styles.championName}>{champion.name}</Text>
            <Text style={styles.championPlayers}>
              {champion.player1} & {champion.player2}
            </Text>
            {finalSetsDisplay && (
              <Text style={styles.finalScore}>Finale: {finalSetsDisplay}</Text>
            )}
          </View>
        )}

        {/* Podium */}
        {(champion || runnerUp || thirdPlace) && (
          <View style={styles.podiumSection}>
            <Text style={styles.sectionTitle}>Podium</Text>
            <View style={styles.podiumRow}>
              <PodiumBlock rank={2} team={runnerUp} delay={100} />
              <PodiumBlock rank={1} team={champion} delay={0} />
              <PodiumBlock rank={3} team={thirdPlace} delay={200} />
            </View>
          </View>
        )}

        {/* Full placement list */}
        {placements.length > 0 && (
          <View style={styles.placementsSection}>
            <Text style={styles.sectionTitle}>Platzierungen</Text>
            <View style={styles.placementsList}>
              {placements.map((p, idx) => (
                <PlacementRow
                  key={`${p.rank}-${p.team.id}-${idx}`}
                  rank={p.rank}
                  team={p.team}
                  roundName={p.roundName}
                />
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]}
            onPress={handleNewTournament}
          >
            <Text style={styles.btnPrimaryText}>Neues Turnier</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.75 }]}
            onPress={handleGoHome}
          >
            <Text style={styles.btnSecondaryText}>Zur Startseite</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 24,
  },

  // Champion banner
  championBanner: {
    marginTop: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.4)',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 4,
  },
  championEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  championTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  championName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 4,
  },
  championPlayers: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  finalScore: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },

  // Section title
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Podium
  podiumSection: {
    gap: 0,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 240,
  },
  podiumSlot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  podiumMedal: {
    fontSize: 28,
    marginBottom: 4,
  },
  podiumTeamName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
    textAlign: 'center',
    maxWidth: 90,
  },
  podiumPlayers: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 90,
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  podiumBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
  },

  // Placements
  placementsSection: {
    gap: 0,
  },
  placementsList: {
    gap: 8,
  },
  placementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  placementRowTop: {
    backgroundColor: 'rgba(255,215,0,0.06)',
    borderColor: 'rgba(255,215,0,0.2)',
  },
  placementRankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placementMedal: {
    fontSize: 20,
  },
  placementRankNum: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94a3b8',
  },
  placementInfo: {
    flex: 1,
    gap: 2,
  },
  placementTeam: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  placementTeamTop: {
    color: '#ffffff',
    fontWeight: '700',
  },
  placementPlayers: {
    fontSize: 11,
    color: '#64748b',
  },
  placementRound: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    textAlign: 'right',
    maxWidth: 80,
  },

  // Actions
  actions: {
    gap: 10,
    marginTop: 8,
  },
  btnPrimary: {
    backgroundColor: '#1a9e6f',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
