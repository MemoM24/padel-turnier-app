/**
 * GroupSchedulePreview
 *
 * Displays the planned match schedule for all groups before the tournament starts.
 * Shows match number, team names, and court assignment per group.
 * Used in the SummaryScreen (groups_ko mode) and accessible from the groups tab.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import type { Group, Team } from '@/types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupSchedulePreviewProps {
  /** List of groups with their matches already generated */
  groups: Group[];
  /** All teams (for name lookup) */
  teams: Team[];
  /** Whether to start with all groups expanded (default: false) */
  defaultExpanded?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Find team by matching player names in a match slot */
function findTeam(teams: Team[], player1: string, player2: string): Team | undefined {
  return teams.find((t) => t.player1 === player1 && t.player2 === player2);
}

/** Compute consecutive-run stats for a match list (for visual indicator) */
function getConsecutiveRuns(matches: Group['matches'], teams: Team[]): Map<string, number[]> {
  // Returns map: teamId → array of consecutive-run lengths per match slot
  const runMap = new Map<string, number[]>();
  const current = new Map<string, number>();
  teams.forEach((t) => { current.set(t.id, 0); runMap.set(t.id, []); });

  matches.forEach((m) => {
    const t1 = findTeam(teams, m.team1[0], m.team1[1]);
    const t2 = findTeam(teams, m.team2[0], m.team2[1]);
    teams.forEach((t) => {
      const plays = t.id === t1?.id || t.id === t2?.id;
      if (plays) {
        current.set(t.id, (current.get(t.id) ?? 0) + 1);
      } else {
        current.set(t.id, 0);
      }
      runMap.get(t.id)!.push(current.get(t.id)!);
    });
  });

  return runMap;
}

// ─── MatchRow ─────────────────────────────────────────────────────────────────

function MatchRow({
  index,
  team1Name,
  team2Name,
  courtName,
  t1Consec,
  t2Consec,
}: {
  index: number;
  team1Name: string;
  team2Name: string;
  courtName: string;
  t1Consec: number;
  t2Consec: number;
}) {
  // Warn if a team is playing its 2nd consecutive match (yellow dot)
  const t1Warn = t1Consec >= 2;
  const t2Warn = t2Consec >= 2;

  return (
    <View style={styles.matchRow}>
      {/* Match number */}
      <View style={styles.matchNumBadge}>
        <Text style={styles.matchNumText}>{index + 1}</Text>
      </View>

      {/* Teams */}
      <View style={styles.matchTeams}>
        <View style={styles.teamNameRow}>
          <Text style={styles.teamName} numberOfLines={1}>{team1Name}</Text>
          {t1Warn && <View style={styles.warnDot} />}
        </View>
        <Text style={styles.vsText}>vs</Text>
        <View style={styles.teamNameRow}>
          <Text style={styles.teamName} numberOfLines={1}>{team2Name}</Text>
          {t2Warn && <View style={styles.warnDot} />}
        </View>
      </View>

      {/* Court */}
      <View style={styles.courtBadge}>
        <Text style={styles.courtText} numberOfLines={1}>{courtName}</Text>
      </View>
    </View>
  );
}

// ─── GroupBlock ───────────────────────────────────────────────────────────────

function GroupBlock({
  group,
  teams,
  defaultExpanded,
}: {
  group: Group;
  teams: Team[];
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const groupTeams = group.teams;
  const runMap = getConsecutiveRuns(group.matches, groupTeams);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={styles.groupBlock}>
      {/* Group header – tap to expand/collapse */}
      <Pressable
        style={({ pressed }) => [styles.groupHeader, pressed && { opacity: 0.75 }]}
        onPress={toggle}
      >
        <View style={styles.groupHeaderLeft}>
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>{group.name.replace('Gruppe ', '')}</Text>
          </View>
          <View>
            <Text style={styles.groupTitle}>{group.name}</Text>
            <Text style={styles.groupMeta}>
              {groupTeams.length} Teams · {group.matches.length} Spiele · {group.courtName}
            </Text>
          </View>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      {/* Team list (always visible) */}
      <View style={styles.teamList}>
        {groupTeams.map((team, idx) => (
          <View key={team.id} style={styles.teamChip}>
            <Text style={styles.teamChipNum}>{idx + 1}</Text>
            <Text style={styles.teamChipName} numberOfLines={1}>{team.name}</Text>
            <Text style={styles.teamChipPlayers} numberOfLines={1}>
              {team.player1} & {team.player2}
            </Text>
          </View>
        ))}
      </View>

      {/* Match schedule (collapsible) */}
      {expanded && (
        <View style={styles.matchList}>
          <View style={styles.matchListHeader}>
            <Text style={styles.matchListHeaderText}>Spielreihenfolge</Text>
            <View style={styles.legendRow}>
              <View style={styles.warnDot} />
              <Text style={styles.legendText}>= 2. Spiel in Folge</Text>
            </View>
          </View>
          {group.matches.map((match, idx) => {
            const t1 = findTeam(groupTeams, match.team1[0], match.team1[1]);
            const t2 = findTeam(groupTeams, match.team2[0], match.team2[1]);
            const t1Consec = t1 ? (runMap.get(t1.id)?.[idx] ?? 0) : 0;
            const t2Consec = t2 ? (runMap.get(t2.id)?.[idx] ?? 0) : 0;
            return (
              <MatchRow
                key={match.id}
                index={idx}
                team1Name={t1?.name ?? match.team1[0]}
                team2Name={t2?.name ?? match.team2[0]}
                courtName={match.courtName}
                t1Consec={t1Consec}
                t2Consec={t2Consec}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GroupSchedulePreview({
  groups,
  teams,
  defaultExpanded = false,
}: GroupSchedulePreviewProps) {
  if (!groups || groups.length === 0) return null;

  const totalMatches = groups.reduce((sum, g) => sum + g.matches.length, 0);

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Spielplan-Vorschau</Text>
        <Text style={styles.sectionMeta}>
          {groups.length} Gruppe{groups.length > 1 ? 'n' : ''} · {totalMatches} Spiele gesamt
        </Text>
      </View>

      {/* Group blocks */}
      {groups.map((group) => (
        <GroupBlock
          key={group.id}
          group={group}
          teams={teams}
          defaultExpanded={defaultExpanded}
        />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  sectionMeta: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Group block
  groupBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.07)',
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  groupBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a9e6f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  groupMeta: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  chevron: {
    fontSize: 11,
    color: '#9BA1A6',
    marginLeft: 8,
  },

  // Team list
  teamList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f5f3',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
    maxWidth: '100%',
  },
  teamChipNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a9e6f',
    minWidth: 14,
  },
  teamChipName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },
  teamChipPlayers: {
    fontSize: 11,
    color: '#6b7280',
  },

  // Match list
  matchList: {
    paddingBottom: 8,
  },
  matchListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  matchListHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#9BA1A6',
  },

  // Match row
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  matchNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  matchNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  matchTeams: {
    flex: 1,
    gap: 2,
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  vsText: {
    fontSize: 10,
    color: '#9BA1A6',
    fontWeight: '500',
    marginLeft: 2,
  },
  warnDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#f59e0b',
    flexShrink: 0,
  },
  courtBadge: {
    backgroundColor: '#e0f5ec',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 80,
  },
  courtText: {
    fontSize: 10,
    color: '#1a9e6f',
    fontWeight: '600',
  },
});
