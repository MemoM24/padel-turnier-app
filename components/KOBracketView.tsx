import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import type { KOBracket, KOMatch, Team } from '@/types';

interface KOBracketViewProps {
  bracket: KOBracket;
  onMatchPress?: (match: KOMatch) => void;
  groupPhaseComplete: boolean;
}

function TeamLabel({ team, score, isWinner }: { team: Team | null; score: number | null; isWinner?: boolean }) {
  const isTBD = !team;
  return (
    <View style={[styles.teamLabel, isWinner && styles.teamLabelWinner]}>
      <Text
        style={[styles.teamName, isTBD && styles.teamNameTBD, isWinner && styles.teamNameWinner]}
        numberOfLines={1}
      >
        {isTBD ? 'TBD' : team.name}
      </Text>
      {score !== null && (
        <View style={[styles.scoreBadge, isWinner && styles.scoreBadgeWinner]}>
          <Text style={[styles.scoreText, isWinner && styles.scoreTextWinner]}>{score}</Text>
        </View>
      )}
    </View>
  );
}

function MatchCard({ match, onPress }: { match: KOMatch; onPress?: () => void }) {
  const canPlay = match.team1 && match.team2 && match.score1 === null;
  const isPlayed = match.score1 !== null && match.score2 !== null;
  const winner1 = isPlayed && match.score1! > match.score2!;
  const winner2 = isPlayed && match.score2! > match.score1!;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.matchCard,
        isPlayed && styles.matchCardPlayed,
        canPlay && styles.matchCardCanPlay,
        pressed && canPlay && { opacity: 0.8 },
      ]}
      onPress={canPlay ? onPress : undefined}
    >
      <TeamLabel team={match.team1} score={match.score1} isWinner={winner1} />
      <View style={styles.matchDivider} />
      <TeamLabel team={match.team2} score={match.score2} isWinner={winner2} />
      {match.courtName && (
        <Text style={styles.courtLabel}>{match.courtName}</Text>
      )}
    </Pressable>
  );
}

export function KOBracketView({ bracket, onMatchPress, groupPhaseComplete }: KOBracketViewProps) {
  if (!groupPhaseComplete) {
    return (
      <View style={styles.pendingContainer}>
        <Text style={styles.pendingIcon}>🏆</Text>
        <Text style={styles.pendingTitle}>KO-Phase</Text>
        <Text style={styles.pendingText}>
          Die KO-Phase beginnt sobald alle Gruppenspiele abgeschlossen sind.
        </Text>
      </View>
    );
  }

  const { rounds, matches } = bracket;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bracketContainer}>
      {rounds.map((roundName, roundIdx) => {
        const roundMatches = matches.filter((m) => m.roundIndex === roundIdx);
        return (
          <View key={roundName} style={styles.roundColumn}>
            <Text style={styles.roundTitle}>{roundName}</Text>
            <View style={styles.matchesColumn}>
              {roundMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onPress={() => onMatchPress?.(match)}
                />
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bracketContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  roundColumn: {
    width: 160,
    gap: 8,
  },
  roundTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  matchesColumn: {
    gap: 12,
  },
  matchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  matchCardPlayed: {
    borderColor: 'rgba(0,0,0,0.08)',
    opacity: 0.9,
  },
  matchCardCanPlay: {
    borderColor: '#1a9e6f',
    borderWidth: 1.5,
  },
  teamLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: '#ffffff',
  },
  teamLabelWinner: {
    backgroundColor: '#f0faf5',
  },
  teamName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  teamNameTBD: {
    color: '#9BA1A6',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  teamNameWinner: {
    color: '#1a9e6f',
    fontWeight: '700',
  },
  scoreBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeWinner: {
    backgroundColor: '#1a9e6f',
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  scoreTextWinner: {
    color: '#ffffff',
  },
  matchDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.07)',
    marginHorizontal: 10,
  },
  courtLabel: {
    fontSize: 10,
    color: '#9BA1A6',
    textAlign: 'center',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },

  pendingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  pendingIcon: { fontSize: 48 },
  pendingTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  pendingText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
});
