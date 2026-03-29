import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { AppHeader } from '@/components/AppHeader';
import { KOBracketView } from '@/components/KOBracketView';
import {
  getGroupStandings,
  updateGroupMatchScore,
  updateKOMatchScore,
  isGroupPhaseComplete,
  getAdvancingTeams,
  buildKOBracket,
  type GroupStanding,
} from '@/lib/groupsKO';
import type { Group, KOMatch, Match, Team } from '@/types';

type TabId = 'groups' | 'bracket';

// ─── Score Entry Modal ────────────────────────────────────────────────────────

interface ScoreModalState {
  visible: boolean;
  matchId: string;
  team1: string;
  team2: string;
  groupId?: string;
  isKO?: boolean;
}

function ScoreEntryModal({
  state,
  onClose,
  onSave,
}: {
  state: ScoreModalState;
  onClose: () => void;
  onSave: (score1: number, score2: number) => void;
}) {
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');

  useEffect(() => {
    if (state.visible) { setS1(''); setS2(''); }
  }, [state.visible]);

  const handleSave = () => {
    const n1 = parseInt(s1, 10);
    const n2 = parseInt(s2, 10);
    if (isNaN(n1) || isNaN(n2) || n1 < 0 || n2 < 0) {
      Alert.alert('Ungültig', 'Bitte gültige Punktzahlen eingeben.');
      return;
    }
    onSave(n1, n2);
    onClose();
  };

  if (!state.visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Ergebnis eintragen</Text>
          <Text style={modalStyles.subtitle}>{state.team1} vs {state.team2}</Text>

          <View style={modalStyles.row}>
            <View style={modalStyles.teamScore}>
              <Text style={modalStyles.teamLabel} numberOfLines={1}>{state.team1}</Text>
              <TextInput
                style={modalStyles.input}
                keyboardType="number-pad"
                value={s1}
                onChangeText={setS1}
                placeholder="0"
                placeholderTextColor="#9BA1A6"
                maxLength={3}
                autoFocus
              />
            </View>
            <Text style={modalStyles.vs}>:</Text>
            <View style={modalStyles.teamScore}>
              <Text style={modalStyles.teamLabel} numberOfLines={1}>{state.team2}</Text>
              <TextInput
                style={modalStyles.input}
                keyboardType="number-pad"
                value={s2}
                onChangeText={setS2}
                placeholder="0"
                placeholderTextColor="#9BA1A6"
                maxLength={3}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>
          </View>

          <View style={modalStyles.actions}>
            <Pressable style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelText}>Abbrechen</Text>
            </Pressable>
            <Pressable style={modalStyles.saveBtn} onPress={handleSave}>
              <Text style={modalStyles.saveText}>Speichern</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 360, gap: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#111', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teamScore: { flex: 1, alignItems: 'center', gap: 8 },
  teamLabel: { fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'center' },
  input: {
    width: 72,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a9e6f',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    backgroundColor: '#f0faf5',
  },
  vs: { fontSize: 20, fontWeight: '700', color: '#9BA1A6' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#1a9e6f', alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Group Tab Content ────────────────────────────────────────────────────────

function GroupMatchRow({ match, teams, groupId, onPress }: {
  match: Match;
  teams: Team[];
  groupId: string;
  onPress: () => void;
}) {
  const isPlayed = match.score1 !== null && match.score2 !== null;
  const t1Name = teams.find((t) => t.player1 === match.team1[0] && t.player2 === match.team1[1])?.name ?? match.team1.join(' & ');
  const t2Name = teams.find((t) => t.player1 === match.team2[0] && t.player2 === match.team2[1])?.name ?? match.team2.join(' & ');

  return (
    <Pressable
      style={({ pressed }) => [styles.matchRow, isPlayed && styles.matchRowPlayed, pressed && !isPlayed && { opacity: 0.75 }]}
      onPress={isPlayed ? undefined : onPress}
    >
      <Text style={[styles.matchTeam, match.score1 !== null && match.score1 > match.score2! && styles.matchTeamWinner]} numberOfLines={1}>
        {t1Name}
      </Text>
      <View style={styles.matchScoreBox}>
        {isPlayed ? (
          <Text style={styles.matchScore}>{match.score1} : {match.score2}</Text>
        ) : (
          <Text style={styles.matchScoreTBD}>vs</Text>
        )}
      </View>
      <Text style={[styles.matchTeam, styles.matchTeamRight, match.score2 !== null && match.score2 > match.score1! && styles.matchTeamWinner]} numberOfLines={1}>
        {t2Name}
      </Text>
    </Pressable>
  );
}

function StandingsTable({ standings }: { standings: GroupStanding[] }) {
  return (
    <View style={styles.standingsTable}>
      <View style={styles.standingsHeader}>
        <Text style={[styles.standingsCell, styles.standingsTeamCell, styles.standingsHeaderText]}>#</Text>
        <Text style={[styles.standingsCell, { flex: 3 }, styles.standingsHeaderText]}>Team</Text>
        <Text style={[styles.standingsCell, styles.standingsHeaderText]}>Sp</Text>
        <Text style={[styles.standingsCell, styles.standingsHeaderText]}>S</Text>
        <Text style={[styles.standingsCell, styles.standingsHeaderText]}>N</Text>
        <Text style={[styles.standingsCell, styles.standingsHeaderText]}>Pkt</Text>
        <Text style={[styles.standingsCell, styles.standingsHeaderText]}>+/-</Text>
      </View>
      {standings.map((s, idx) => (
        <View key={s.team.id} style={[styles.standingsRow, idx < 2 && styles.standingsRowAdvancing]}>
          <Text style={[styles.standingsCell, styles.standingsTeamCell, idx < 2 && styles.standingsCellAdvancing]}>
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
          <Text style={[styles.standingsCell, idx < 2 && styles.standingsCellAdvancing]}>{s.lost}</Text>
          <Text style={[styles.standingsCell, styles.standingsPtsCell, idx < 2 && styles.standingsCellAdvancing]}>{s.points}</Text>
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
  const [scoreModal, setScoreModal] = useState<ScoreModalState>({
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
    const t1 = teams.find((t) => t.player1 === match.team1[0] && t.player2 === match.team1[1]);
    const t2 = teams.find((t) => t.player1 === match.team2[0] && t.player2 === match.team2[1]);
    setScoreModal({
      visible: true,
      matchId: match.id,
      team1: t1?.name ?? match.team1.join(' & '),
      team2: t2?.name ?? match.team2.join(' & '),
      groupId,
      isKO: false,
    });
  };

  const openKOMatchScore = (match: KOMatch) => {
    if (!match.team1 || !match.team2) return;
    setScoreModal({
      visible: true,
      matchId: match.id,
      team1: match.team1.name,
      team2: match.team2.name,
      isKO: true,
    });
  };

  const handleSaveScore = async (score1: number, score2: number) => {
    if (!tournament) return;

    let updated = { ...tournament };

    if (scoreModal.isKO && koBracket) {
      const newBracket = updateKOMatchScore(koBracket, scoreModal.matchId, score1, score2, teams);
      updated = { ...updated, koBracket: newBracket };
    } else if (scoreModal.groupId) {
      const newGroups = updateGroupMatchScore(
        groups,
        scoreModal.groupId,
        scoreModal.matchId,
        score1,
        score2,
      );
      updated = { ...updated, groups: newGroups };

      // Check if group phase just completed
      if (isGroupPhaseComplete(newGroups) && !groupPhaseComplete) {
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
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.mainTabText, activeTab === 'groups' && styles.mainTabTextActive]}>
            Gruppen
          </Text>
        </Pressable>
        <Pressable
          style={[styles.mainTab, activeTab === 'bracket' && styles.mainTabActive]}
          onPress={() => setActiveTab('bracket')}
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupTabsScroll} contentContainerStyle={styles.groupTabs}>
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

      <ScoreEntryModal
        state={scoreModal}
        onClose={() => setScoreModal((s) => ({ ...s, visible: false }))}
        onSave={handleSaveScore}
      />
    </View>
  );
}

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
  standingsTeamCell: { flex: 1, fontWeight: '700' },
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

  matchesList: { gap: 8 },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#1a9e6f',
    gap: 8,
  },
  matchRowPlayed: {
    borderColor: 'rgba(0,0,0,0.08)',
    opacity: 0.85,
  },
  matchTeam: { flex: 1, fontSize: 13, fontWeight: '600', color: '#374151' },
  matchTeamRight: { textAlign: 'right' },
  matchTeamWinner: { color: '#1a9e6f', fontWeight: '700' },
  matchScoreBox: {
    minWidth: 60,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  matchScore: { fontSize: 15, fontWeight: '700', color: '#111' },
  matchScoreTBD: { fontSize: 12, color: '#9BA1A6', fontWeight: '500' },
});
