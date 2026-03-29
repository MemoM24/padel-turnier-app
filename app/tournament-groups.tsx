import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { AppHeader } from '@/components/AppHeader';
import { KOBracketView } from '@/components/KOBracketView';
import { GroupSchedulePreview } from '@/components/GroupSchedulePreview';
import {
  getGroupStandings,
  updateGroupMatchScore,
  updateKOMatchScore,
  isGroupPhaseComplete,
  getAdvancingTeams,
  buildKOBracket,
  type GroupStanding,
} from '@/lib/groupsKO';
import type { Group, KOMatch, Match, Team, SetScore } from '@/types';
import { haptic } from '@/lib/haptics';

type TabId = 'groups' | 'schedule' | 'bracket';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Determine match result from sets.
 * Returns { score1, score2, sets } where score1/score2 = sets won (0..3).
 * A draw occurs when sets are 1:1 and the tiebreak set (set 3) is equal or missing.
 */
function computeResultFromSets(sets: SetScore[]): { score1: number; score2: number } {
  let s1 = 0;
  let s2 = 0;
  for (const s of sets) {
    if (s.s1 === null || s.s2 === null) continue;
    if (s.s1 > s.s2) s1++;
    else if (s.s2 > s.s1) s2++;
    // equal set counts as neither (should not happen in normal play)
  }
  return { score1: s1, score2: s2 };
}

/** Format a set array as "6:4  3:6  10:8" */
function formatSets(sets: SetScore[]): string {
  return sets
    .filter((s) => s.s1 !== null && s.s2 !== null)
    .map((s) => `${s.s1}:${s.s2}`)
    .join('  ');
}

// ─── Playtomic-Stil Score Modal ───────────────────────────────────────────────

interface SetModalState {
  visible: boolean;
  matchId: string;
  team1: string;
  team2: string;
  groupId?: string;
  isKO?: boolean;
  currentSets?: SetScore[];
}

function PlaytomicScoreModal({
  state,
  onClose,
  onSave,
}: {
  state: SetModalState;
  onClose: () => void;
  onSave: (sets: SetScore[], score1: number, score2: number) => void;
}) {
  const emptySet = (): SetScore => ({ s1: null, s2: null });
  const [sets, setSets] = useState<SetScore[]>([emptySet(), emptySet(), emptySet()]);

  useEffect(() => {
    if (state.visible) {
      if (state.currentSets && state.currentSets.length > 0) {
        // Pre-fill with existing sets, ensure 3 slots
        const filled: SetScore[] = [emptySet(), emptySet(), emptySet()];
        state.currentSets.forEach((s, i) => { if (i < 3) filled[i] = { ...s }; });
        setSets(filled);
      } else {
        setSets([emptySet(), emptySet(), emptySet()]);
      }
    }
  }, [state.visible]);

  const updateSet = (idx: number, side: 's1' | 's2', val: string) => {
    const num = val === '' ? null : parseInt(val, 10);
    setSets((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [side]: isNaN(num as number) ? null : num };
      return next;
    });
  };

  // Determine which sets are "done" (both sides filled)
  const set1Done = sets[0].s1 !== null && sets[0].s2 !== null;
  const set2Done = sets[1].s1 !== null && sets[1].s2 !== null;

  // After 2 sets: who won each?
  const t1WonSet1 = set1Done && (sets[0].s1 ?? 0) > (sets[0].s2 ?? 0);
  const t2WonSet1 = set1Done && (sets[0].s2 ?? 0) > (sets[0].s1 ?? 0);
  const t1WonSet2 = set2Done && (sets[1].s1 ?? 0) > (sets[1].s2 ?? 0);
  const t2WonSet2 = set2Done && (sets[1].s2 ?? 0) > (sets[1].s1 ?? 0);

  // Set 3 (tiebreak) needed when each team won exactly 1 set
  const needsSet3 = set1Done && set2Done && (
    (t1WonSet1 && t2WonSet2) || (t2WonSet1 && t1WonSet2)
  );

  const set3Done = sets[2].s1 !== null && sets[2].s2 !== null;

  // Can confirm when: set1+set2 done AND (no set3 needed OR set3 done)
  const canConfirm = set1Done && set2Done && (!needsSet3 || set3Done);

  // Live result preview
  const activeSets = needsSet3 ? sets : sets.slice(0, 2);
  const { score1: previewS1, score2: previewS2 } = computeResultFromSets(activeSets);

  // Result label
  let resultLabel = '';
  if (canConfirm) {
    if (previewS1 > previewS2) resultLabel = `${state.team1} gewinnt`;
    else if (previewS2 > previewS1) resultLabel = `${state.team2} gewinnt`;
    else resultLabel = 'Unentschieden';
  }

  const handleConfirm = () => {
    if (!canConfirm) {
      haptic.error();
      return;
    }
    haptic.success();
    const finalSets = needsSet3 ? sets : [sets[0], sets[1], emptySet()];
    const { score1, score2 } = computeResultFromSets(needsSet3 ? sets : sets.slice(0, 2));
    onSave(finalSets, score1, score2);
    onClose();
  };

  if (!state.visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={ptStyles.overlay}
      >
        <Pressable style={ptStyles.overlay} onPress={onClose}>
          <Pressable style={ptStyles.sheet} onPress={(e) => e.stopPropagation()}>
            {/* Handle */}
            <View style={ptStyles.handle} />

            {/* Title */}
            <Text style={ptStyles.title}>Ergebnis eintragen</Text>

            {/* Team names */}
            <View style={ptStyles.teamsRow}>
              <Text style={ptStyles.teamName} numberOfLines={1}>{state.team1}</Text>
              <Text style={ptStyles.vsText}>vs</Text>
              <Text style={[ptStyles.teamName, { textAlign: 'right' }]} numberOfLines={1}>{state.team2}</Text>
            </View>

            {/* Set inputs */}
            <SetInputRow
              label="Satz 1"
              set={sets[0]}
              disabled={false}
              onChange={(side, val) => updateSet(0, side, val)}
            />
            <SetInputRow
              label="Satz 2"
              set={sets[1]}
              disabled={!set1Done}
              onChange={(side, val) => updateSet(1, side, val)}
            />
            <SetInputRow
              label="Tiebreak"
              set={sets[2]}
              disabled={!needsSet3}
              isTiebreak
              onChange={(side, val) => updateSet(2, side, val)}
            />

            {/* Live result preview */}
            {canConfirm && (
              <View style={[
                ptStyles.resultBadge,
                previewS1 === previewS2 ? ptStyles.resultDraw : ptStyles.resultWin,
              ]}>
                <Text style={ptStyles.resultText}>{resultLabel}</Text>
                <Text style={ptStyles.resultScore}>{previewS1} : {previewS2} Sätze</Text>
              </View>
            )}

            {/* Actions */}
            <View style={ptStyles.actions}>
              <Pressable
                style={({ pressed }) => [ptStyles.cancelBtn, pressed && { opacity: 0.7 }]}
                onPress={onClose}
              >
                <Text style={ptStyles.cancelText}>Abbrechen</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  ptStyles.confirmBtn,
                  !canConfirm && ptStyles.confirmBtnDisabled,
                  pressed && canConfirm && { opacity: 0.85 },
                ]}
                onPress={handleConfirm}
                disabled={!canConfirm}
              >
                <Text style={ptStyles.confirmText}>Speichern</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Set Input Row ────────────────────────────────────────────────────────────

function SetInputRow({
  label,
  set,
  disabled,
  isTiebreak,
  onChange,
}: {
  label: string;
  set: SetScore;
  disabled: boolean;
  isTiebreak?: boolean;
  onChange: (side: 's1' | 's2', val: string) => void;
}) {
  return (
    <View style={[ptStyles.setRow, disabled && ptStyles.setRowDisabled]}>
      <Text style={[ptStyles.setLabel, disabled && ptStyles.setLabelDisabled]}>{label}</Text>
      <View style={ptStyles.setInputs}>
        <TextInput
          style={[ptStyles.setInput, disabled && ptStyles.setInputDisabled]}
          value={set.s1 !== null ? String(set.s1) : ''}
          onChangeText={(v) => onChange('s1', v)}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor="#aaa"
          editable={!disabled}
          maxLength={2}
          selectTextOnFocus
        />
        <Text style={[ptStyles.setSep, disabled && { color: '#ccc' }]}>:</Text>
        <TextInput
          style={[ptStyles.setInput, disabled && ptStyles.setInputDisabled]}
          value={set.s2 !== null ? String(set.s2) : ''}
          onChangeText={(v) => onChange('s2', v)}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor="#aaa"
          editable={!disabled}
          maxLength={2}
          selectTextOnFocus
        />
      </View>
      {isTiebreak && !disabled && (
        <Text style={ptStyles.tiebreakHint}>Super-Tiebreak</Text>
      )}
    </View>
  );
}

const ptStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    gap: 14,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  teamName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  vsText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },

  // Set row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  setRowDisabled: {
    opacity: 0.35,
  },
  setLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  setLabelDisabled: {
    color: '#64748b',
  },
  setInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setInput: {
    width: 56,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: '#1a9e6f',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  setInputDisabled: {
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#64748b',
  },
  setSep: {
    fontSize: 20,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tiebreakHint: {
    fontSize: 10,
    color: '#1a9e6f',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Result preview
  resultBadge: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 2,
  },
  resultWin: {
    backgroundColor: 'rgba(26,158,111,0.2)',
    borderWidth: 1,
    borderColor: '#1a9e6f',
  },
  resultDraw: {
    backgroundColor: 'rgba(234,179,8,0.15)',
    borderWidth: 1,
    borderColor: '#ca8a04',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  resultScore: {
    fontSize: 12,
    color: '#94a3b8',
  },

  // Buttons
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1a9e6f',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: 'rgba(26,158,111,0.3)',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});

// ─── Group Match Row ──────────────────────────────────────────────────────────

function GroupMatchRow({
  match,
  teams,
  groupId,
  onPress,
}: {
  match: Match;
  teams: Team[];
  groupId: string;
  onPress: () => void;
}) {
  const isPlayed = match.score1 !== null && match.score2 !== null;
  const t1 = teams.find((t) => t.player1 === match.team1[0] && t.player2 === match.team1[1]);
  const t2 = teams.find((t) => t.player1 === match.team2[0] && t.player2 === match.team2[1]);
  const t1Name = t1?.name ?? match.team1.join(' & ');
  const t2Name = t2?.name ?? match.team2.join(' & ');

  const t1Won = isPlayed && (match.score1 ?? 0) > (match.score2 ?? 0);
  const t2Won = isPlayed && (match.score2 ?? 0) > (match.score1 ?? 0);
  const isDraw = isPlayed && match.score1 === match.score2;

  // Format set display: "6:4  3:6  10:8"
  const setDisplay = match.sets
    ? formatSets(match.sets)
    : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.matchRow,
        isPlayed && styles.matchRowPlayed,
        pressed && { opacity: 0.75 },
      ]}
      onPress={onPress}
    >
      {/* Team 1 */}
      <View style={styles.matchTeamBlock}>
        <Text
          style={[styles.matchTeamName, t1Won && styles.matchTeamWinner]}
          numberOfLines={1}
        >
          {t1Name}
        </Text>
        {t1 && (
          <Text style={styles.matchPlayerNames} numberOfLines={1}>
            {t1.player1} & {t1.player2}
          </Text>
        )}
      </View>

      {/* Score center */}
      <View style={styles.matchScoreCenter}>
        {isPlayed ? (
          <>
            <View style={styles.matchScoreBadge}>
              <Text style={[
                styles.matchScoreNum,
                t1Won && styles.matchScoreWinner,
                isDraw && styles.matchScoreDraw,
              ]}>
                {match.score1}
              </Text>
              <Text style={styles.matchScoreColon}>:</Text>
              <Text style={[
                styles.matchScoreNum,
                t2Won && styles.matchScoreWinner,
                isDraw && styles.matchScoreDraw,
              ]}>
                {match.score2}
              </Text>
            </View>
            {setDisplay ? (
              <Text style={styles.matchSetDetail}>{setDisplay}</Text>
            ) : null}
          </>
        ) : (
          <View style={styles.matchVsBadge}>
            <Text style={styles.matchVsText}>vs</Text>
          </View>
        )}
      </View>

      {/* Team 2 */}
      <View style={[styles.matchTeamBlock, styles.matchTeamBlockRight]}>
        <Text
          style={[styles.matchTeamName, styles.matchTeamNameRight, t2Won && styles.matchTeamWinner]}
          numberOfLines={1}
        >
          {t2Name}
        </Text>
        {t2 && (
          <Text style={[styles.matchPlayerNames, { textAlign: 'right' }]} numberOfLines={1}>
            {t2.player1} & {t2.player2}
          </Text>
        )}
      </View>

      {/* Edit indicator for played matches */}
      {isPlayed && (
        <View style={styles.editIndicator}>
          <Text style={styles.editIndicatorText}>✏️</Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Standings Table ──────────────────────────────────────────────────────────

function StandingsTable({ standings }: { standings: GroupStanding[] }) {
  return (
    <View style={styles.standingsTable}>
      <View style={styles.standingsHeader}>
        <Text style={[styles.standingsCell, styles.standingsRankCell, styles.standingsHeaderText]}>#</Text>
        <Text style={[styles.standingsCell, { flex: 3 }, styles.standingsHeaderText]}>Team</Text>
        <Text style={[styles.standingsCell, styles.standingsHeaderText]}>Sp</Text>
        <Text style={[styles.standingsCell, styles.standingsHeaderText]}>S</Text>
        <Text style={[styles.standingsCell, styles.standingsHeaderText]}>U</Text>
        <Text style={[styles.standingsCell, styles.standingsHeaderText]}>N</Text>
        <Text style={[styles.standingsCell, styles.standingsPtsCell, styles.standingsHeaderText]}>Pkt</Text>
        <Text style={[styles.standingsCell, styles.standingsHeaderText]}>+/-</Text>
      </View>
      {standings.map((s, idx) => (
        <View
          key={s.team.id}
          style={[styles.standingsRow, idx < 2 && styles.standingsRowAdvancing]}
        >
          <Text style={[styles.standingsCell, styles.standingsRankCell, idx < 2 && styles.standingsCellAdvancing]}>
            {idx + 1}
          </Text>
          <View style={[styles.standingsCell, { flex: 3 }]}>
            <Text style={[styles.standingsTeamName, idx < 2 && styles.standingsCellAdvancing]} numberOfLines={1}>
              {s.team.name}
            </Text>
            <Text style={styles.standingsPlayerNames} numberOfLines={1}>
              {s.team.player1} & {s.team.player2}
            </Text>
          </View>
          <Text style={[styles.standingsCell, idx < 2 && styles.standingsCellAdvancing]}>{s.played}</Text>
          <Text style={[styles.standingsCell, idx < 2 && styles.standingsCellAdvancing]}>{s.won}</Text>
          <Text style={[styles.standingsCell, idx < 2 && styles.standingsCellAdvancing]}>{s.drawn}</Text>
          <Text style={[styles.standingsCell, idx < 2 && styles.standingsCellAdvancing]}>{s.lost}</Text>
          <Text style={[styles.standingsCell, styles.standingsPtsCell, idx < 2 && styles.standingsCellAdvancing]}>
            {s.points}
          </Text>
          <Text style={[styles.standingsCell, idx < 2 && styles.standingsCellAdvancing]}>
            {s.goalDiff > 0 ? '+' : ''}{s.goalDiff}
          </Text>
        </View>
      ))}
      <Text style={styles.advancingHint}>↑ Top 2 kommen weiter</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TournamentGroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tournament, saveTournament } = useTournament();

  const [activeTab, setActiveTab] = useState<TabId>('groups');
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [scoreModal, setScoreModal] = useState<SetModalState>({
    visible: false,
    matchId: '',
    team1: '',
    team2: '',
  });

  if (!tournament || tournament.settings.type !== 'groups_ko') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Kein Gruppen-KO Turnier aktiv.</Text>
      </View>
    );
  }

  const groups: Group[] = tournament.groups ?? [];
  const teams: Team[] = tournament.teams ?? [];
  const koBracket = tournament.koBracket;
  const groupPhaseComplete = tournament.groupPhaseComplete ?? false;

  const activeGroup = groups[activeGroupIdx];
  const standings = activeGroup ? getGroupStandings(activeGroup, teams) : [];

  const openGroupMatchScore = (match: Match, groupId: string) => {
    haptic.light();
    const t1 = teams.find((t) => t.player1 === match.team1[0] && t.player2 === match.team1[1]);
    const t2 = teams.find((t) => t.player1 === match.team2[0] && t.player2 === match.team2[1]);
    setScoreModal({
      visible: true,
      matchId: match.id,
      team1: t1?.name ?? match.team1.join(' & '),
      team2: t2?.name ?? match.team2.join(' & '),
      groupId,
      isKO: false,
      currentSets: match.sets,
    });
  };

  const openKOMatchScore = (match: KOMatch) => {
    // Allow editing even if already played (re-entry)
    if (!match.team1 || !match.team2) return;
    haptic.light();
    setScoreModal({
      visible: true,
      matchId: match.id,
      team1: match.team1.name,
      team2: match.team2.name,
      isKO: true,
      currentSets: match.sets,
    });
  };

  const handleSaveScore = async (sets: SetScore[], score1: number, score2: number) => {
    if (!tournament) return;

    let updated = { ...tournament };

    if (scoreModal.isKO && koBracket) {
      // For KO: pass sets along with score1/score2
      const newBracket = updateKOMatchScore(koBracket, scoreModal.matchId, score1, score2, teams, sets);
      updated = { ...updated, koBracket: newBracket };
    } else if (scoreModal.groupId) {
      const newGroups = updateGroupMatchScore(
        groups,
        scoreModal.groupId,
        scoreModal.matchId,
        score1,
        score2,
        sets,
      );
      updated = { ...updated, groups: newGroups };

      // Check if group phase just completed
      if (isGroupPhaseComplete(newGroups) && !groupPhaseComplete) {
        haptic.success();
        const activeCourts = tournament.settings.courts.filter((c) => c.active);
        const advancing = getAdvancingTeams(newGroups, teams);
        const newBracket = buildKOBracket(advancing, activeCourts);
        updated = { ...updated, groupPhaseComplete: true, koBracket: newBracket };
        Alert.alert(
          '🏆 Gruppenphase abgeschlossen!',
          `${advancing.filter((t) => t.id !== '__bye__').length} Teams ziehen in die KO-Phase ein.`,
          [{ text: 'Zur KO-Phase', onPress: () => setActiveTab('bracket') }],
        );
      }
    }

    await saveTournament(updated);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <AppHeader
        title={tournament.name}
        subtitle={groupPhaseComplete ? 'KO-Phase' : 'Gruppenphase'}
        showBack
        showLanguageToggle
      />

      {/* Main Tabs */}
      <View style={styles.mainTabs}>
        <Pressable
          style={[styles.mainTab, activeTab === 'groups' && styles.mainTabActive]}
          onPress={() => { haptic.selection(); setActiveTab('groups'); }}
        >
          <Text style={[styles.mainTabText, activeTab === 'groups' && styles.mainTabTextActive]}>
            Gruppen
          </Text>
        </Pressable>
        <Pressable
          style={[styles.mainTab, activeTab === 'schedule' && styles.mainTabActive]}
          onPress={() => { haptic.selection(); setActiveTab('schedule'); }}
        >
          <Text style={[styles.mainTabText, activeTab === 'schedule' && styles.mainTabTextActive]}>
            Spielplan
          </Text>
        </Pressable>
        <Pressable
          style={[styles.mainTab, activeTab === 'bracket' && styles.mainTabActive]}
          onPress={() => { haptic.selection(); setActiveTab('bracket'); }}
        >
          <Text style={[styles.mainTabText, activeTab === 'bracket' && styles.mainTabTextActive]}>
            KO-Baum
          </Text>
          {groupPhaseComplete && <View style={styles.activeDot} />}
        </Pressable>
      </View>

      {activeTab === 'groups' && (
        <>
          {/* Group Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.groupTabsScroll}
            contentContainerStyle={styles.groupTabs}
          >
            {groups.map((g, idx) => (
              <Pressable
                key={g.id}
                style={[styles.groupTab, activeGroupIdx === idx && styles.groupTabActive]}
                onPress={() => setActiveGroupIdx(idx)}
              >
                <Text style={[styles.groupTabText, activeGroupIdx === idx && styles.groupTabTextActive]}>
                  {g.name}
                </Text>
                <Text style={styles.groupCourtLabel}>{g.courtName}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={styles.groupContent}>
            {activeGroup && (
              <>
                {/* Standings */}
                <Text style={styles.sectionTitle}>Tabelle – {activeGroup.name}</Text>
                <StandingsTable standings={standings} />

                {/* Matches */}
                <Text style={styles.sectionTitle}>Spiele</Text>
                <View style={styles.matchesList}>
                  {activeGroup.matches.map((match) => (
                    <GroupMatchRow
                      key={match.id}
                      match={match}
                      teams={teams}
                      groupId={activeGroup.id}
                      onPress={() => openGroupMatchScore(match, activeGroup.id)}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </>
      )}

      {activeTab === 'schedule' && (
        <ScrollView contentContainerStyle={[styles.groupContent, { paddingTop: 16 }]}>
          <GroupSchedulePreview
            groups={groups}
            teams={teams}
            defaultExpanded={groups.length === 1}
          />
        </ScrollView>
      )}

      {activeTab === 'bracket' && koBracket && (
        <KOBracketView
          bracket={koBracket}
          onMatchPress={openKOMatchScore}
          groupPhaseComplete={groupPhaseComplete}
        />
      )}

      {activeTab === 'bracket' && !koBracket && (
        <KOBracketView
          bracket={{ rounds: [], matches: [] }}
          onMatchPress={() => {}}
          groupPhaseComplete={false}
        />
      )}

      <PlaytomicScoreModal
        state={scoreModal}
        onClose={() => setScoreModal((s) => ({ ...s, visible: false }))}
        onSave={handleSaveScore}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f3' },

  mainTabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.09)',
  },
  mainTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  mainTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1a9e6f',
  },
  mainTabText: { fontSize: 14, fontWeight: '600', color: '#9BA1A6' },
  mainTabTextActive: { color: '#1a9e6f' },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#1a9e6f',
  },

  groupTabsScroll: { maxHeight: 72, backgroundColor: '#ffffff' },
  groupTabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  groupTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    minWidth: 80,
  },
  groupTabActive: { backgroundColor: '#1a9e6f' },
  groupTabText: { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  groupTabTextActive: { color: '#ffffff' },
  groupCourtLabel: { fontSize: 10, color: '#9BA1A6', marginTop: 1 },

  groupContent: { padding: 16, gap: 12, paddingBottom: 32 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  // Standings
  standingsTable: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  standingsHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.07)',
  },
  standingsHeaderText: { fontSize: 11, fontWeight: '700', color: '#9BA1A6', textTransform: 'uppercase' },
  standingsRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  standingsRowAdvancing: { backgroundColor: '#f0faf5' },
  standingsCell: { flex: 1, fontSize: 13, color: '#374151', textAlign: 'center' },
  standingsRankCell: { flex: 1, fontWeight: '700' },
  standingsCellAdvancing: { color: '#1a9e6f', fontWeight: '700' },
  standingsPtsCell: { fontWeight: '700' },
  standingsTeamName: { fontSize: 13, fontWeight: '600', color: '#111' },
  standingsPlayerNames: { fontSize: 10, color: '#9BA1A6', marginTop: 1 },
  advancingHint: {
    fontSize: 11,
    color: '#1a9e6f',
    textAlign: 'center',
    paddingVertical: 6,
    backgroundColor: '#f0faf5',
  },

  // Match rows
  matchesList: { gap: 8 },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#1a9e6f',
    gap: 8,
  },
  matchRowPlayed: {
    borderColor: 'rgba(0,0,0,0.08)',
  },
  matchTeamBlock: {
    flex: 1,
    gap: 2,
  },
  matchTeamBlockRight: {
    alignItems: 'flex-end',
  },
  matchTeamName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  matchTeamNameRight: {
    textAlign: 'right',
  },
  matchTeamWinner: {
    color: '#1a9e6f',
    fontWeight: '700',
  },
  matchPlayerNames: {
    fontSize: 10,
    color: '#9BA1A6',
  },

  // Score center
  matchScoreCenter: {
    alignItems: 'center',
    gap: 3,
    minWidth: 72,
  },
  matchScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 4,
  },
  matchScoreNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  matchScoreColon: {
    fontSize: 14,
    color: '#9BA1A6',
    fontWeight: '700',
  },
  matchScoreWinner: {
    color: '#1a9e6f',
  },
  matchScoreDraw: {
    color: '#ca8a04',
  },
  matchSetDetail: {
    fontSize: 10,
    color: '#9BA1A6',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  matchVsBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  matchVsText: {
    fontSize: 12,
    color: '#9BA1A6',
    fontWeight: '500',
  },
  editIndicator: {
    position: 'absolute',
    top: 6,
    right: 8,
  },
  editIndicatorText: {
    fontSize: 11,
  },
});
