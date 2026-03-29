import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { QRModal } from '@/components/QRModal';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { t } from '@/i18n';
import {
  generateNextRound,
  applyRoundScores,
  getStandings,
  getAverage,
} from '@/lib/tournament';
import type { Match, Player } from '@/types';

// ─── Score Modal ──────────────────────────────────────────────────────────────
function ScoreModal({
  visible,
  matchId,
  teamLabel,
  currentScore,
  onSelect,
  onClose,
}: {
  visible: boolean;
  matchId: string;
  teamLabel: string;
  currentScore: number | null;
  onSelect: (score: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(currentScore);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    setSelected(currentScore);
  }, [currentScore, visible]);

  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const handleConfirm = () => {
    if (selected !== null) {
      onSelect(selected);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t('enterScore')}</Text>
          <Text style={styles.modalSubtitle}>{teamLabel}</Text>

          <View style={styles.scoreGrid}>
            {numbers.map((n) => (
              <Pressable
                key={n}
                style={({ pressed }) => [
                  styles.scoreCell,
                  selected === n && styles.scoreCellSelected,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setSelected(n)}
              >
                <Text style={[styles.scoreCellText, selected === n && styles.scoreCellTextSelected]}>
                  {n}
                </Text>
              </Pressable>
            ))}
            {/* 10+ button spanning 2 columns */}
            <Pressable
              style={({ pressed }) => [
                styles.scoreCell,
                styles.scoreCellWide,
                selected !== null && selected >= 10 && styles.scoreCellSelected,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => {
                // Cycle through 10–32
                const next = selected !== null && selected >= 10 ? Math.min(selected + 1, 32) : 10;
                setSelected(next);
              }}
            >
              <Text
                style={[
                  styles.scoreCellText,
                  selected !== null && selected >= 10 && styles.scoreCellTextSelected,
                ]}
              >
                {selected !== null && selected >= 10 ? selected : '10+'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalActions}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                selected === null && styles.confirmBtnDisabled,
                pressed && selected !== null && { opacity: 0.85 },
              ]}
              onPress={handleConfirm}
              disabled={selected === null}
            >
              <Text style={styles.confirmBtnText}>{t('confirm')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Timer Overlay ────────────────────────────────────────────────────────────
function TimerOverlay({
  visible,
  totalSeconds,
  onClose,
}: {
  visible: boolean;
  totalSeconds: number;
  onClose: () => void;
}) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setRemaining(totalSeconds);
      setPaused(false);
    }
  }, [visible, totalSeconds]);

  useEffect(() => {
    if (!visible) return;
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, paused]);

  // Blink animation for danger state
  useEffect(() => {
    if (remaining <= 60 && remaining > 0) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.4, duration: 500, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [remaining <= 60]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;

  const isDanger = remaining <= 60;
  const isWarning = remaining <= 180 && remaining > 60;
  const bgColor = isDanger ? '#b91c1c' : isWarning ? '#d97706' : '#0d6b4a';

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.timerContainer, { backgroundColor: bgColor }]}>
        <Pressable style={styles.timerClose} onPress={onClose}>
          <Text style={styles.timerCloseText}>✕</Text>
        </Pressable>

        <Text style={styles.timerLabel}>{t('timerRunning')}</Text>

        <Animated.Text style={[styles.timerDisplay, isDanger && { opacity: blinkAnim }]}>
          {timeStr}
        </Animated.Text>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.timerActions}>
          <Pressable
            style={({ pressed }) => [styles.timerBtn, pressed && { opacity: 0.7 }]}
            onPress={() => setPaused((p) => !p)}
          >
            <Text style={styles.timerBtnText}>{paused ? t('resume') : t('pause')}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.timerBtn, styles.timerBtnStop, pressed && { opacity: 0.7 }]}
            onPress={onClose}
          >
            <Text style={styles.timerBtnText}>{t('stop')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({
  match,
  scores,
  onScorePress,
}: {
  match: Match;
  scores: Record<string, { s1: number | null; s2: number | null }>;
  onScorePress: (matchId: string, team: 1 | 2) => void;
}) {
  const s = scores[match.id] ?? { s1: null, s2: null };
  const hasScore = s.s1 !== null && s.s2 !== null;

  return (
    <View style={[styles.matchCard, hasScore && styles.matchCardDone]}>
      <Text style={styles.matchCourt}>{match.courtName}</Text>
      <View style={styles.matchTeams}>
        {/* Team 1 */}
        <View style={styles.matchTeam}>
          {match.team1.map((name, i) => (
            <View key={i} style={styles.matchPlayer}>
              <Avatar name={name} size="sm" />
              <Text style={styles.matchPlayerName} numberOfLines={1}>{name}</Text>
            </View>
          ))}
        </View>

        {/* Scores */}
        <View style={styles.matchScores}>
          <Pressable
            style={({ pressed }) => [
              styles.scoreBtn,
              s.s1 !== null && styles.scoreBtnFilled,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => onScorePress(match.id, 1)}
          >
            <Text style={[styles.scoreBtnText, s.s1 !== null && styles.scoreBtnTextFilled]}>
              {s.s1 !== null ? s.s1 : '—'}
            </Text>
          </Pressable>
          <Text style={styles.scoreSep}>:</Text>
          <Pressable
            style={({ pressed }) => [
              styles.scoreBtn,
              s.s2 !== null && styles.scoreBtnFilled,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => onScorePress(match.id, 2)}
          >
            <Text style={[styles.scoreBtnText, s.s2 !== null && styles.scoreBtnTextFilled]}>
              {s.s2 !== null ? s.s2 : '—'}
            </Text>
          </Pressable>
        </View>

        {/* Team 2 */}
        <View style={[styles.matchTeam, styles.matchTeamRight]}>
          {match.team2.map((name, i) => (
            <View key={i} style={[styles.matchPlayer, styles.matchPlayerRight]}>
              <Text style={styles.matchPlayerName} numberOfLines={1}>{name}</Text>
              <Avatar name={name} size="sm" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TournamentMatchesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tournament, saveTournament } = useTournament();

  const [activeTab, setActiveTab] = useState<'matches' | 'standings'>('matches');
  const [scores, setScores] = useState<Record<string, { s1: number | null; s2: number | null }>>({});
  const [scoreModal, setScoreModal] = useState<{
    visible: boolean;
    matchId: string;
    team: 1 | 2;
    teamLabel: string;
    currentScore: number | null;
  }>({ visible: false, matchId: '', team: 1, teamLabel: '', currentScore: null });
  const [timerVisible, setTimerVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  if (!tournament) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('appName')} showBack />
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyText}>Kein aktives Turnier</Text>
        </View>
      </View>
    );
  }

  const currentRoundIndex = tournament.currentRound - 1;
  const currentRound = tournament.rounds[currentRoundIndex];
  const totalRounds =
    tournament.settings.numRounds === 0
      ? Math.max(tournament.players.length - 1, 4)
      : tournament.settings.numRounds;

  const allScoresEntered =
    currentRound?.matches.every((m) => {
      const s = scores[m.id];
      return s && s.s1 !== null && s.s2 !== null;
    }) ?? false;

  const isLastRound = tournament.currentRound >= totalRounds;

  const openScoreModal = (matchId: string, team: 1 | 2) => {
    const match = currentRound?.matches.find((m) => m.id === matchId);
    if (!match) return;
    const teamNames = team === 1 ? match.team1 : match.team2;
    const s = scores[matchId];
    setScoreModal({
      visible: true,
      matchId,
      team,
      teamLabel: teamNames.join(' & '),
      currentScore: team === 1 ? (s?.s1 ?? null) : (s?.s2 ?? null),
    });
  };

  const handleScoreSelect = (score: number) => {
    const { matchId, team } = scoreModal;
    setScores((prev) => {
      const existing = prev[matchId] ?? { s1: null, s2: null };
      return {
        ...prev,
        [matchId]: team === 1 ? { ...existing, s1: score } : { ...existing, s2: score },
      };
    });
  };

  const handleSaveRound = async () => {
    if (!allScoresEntered) {
      Alert.alert('', t('allScoresRequired'));
      return;
    }

    const scoreList = currentRound.matches.map((m) => {
      const s = scores[m.id]!;
      return { matchId: m.id, score1: s.s1!, score2: s.s2! };
    });

    let updated = applyRoundScores(tournament, currentRoundIndex, scoreList);

    if (isLastRound) {
      // End tournament
      updated = { ...updated, finished: true };
      await saveTournament(updated);
      Alert.alert(t('tournamentFinished'), '', [
        { text: t('backToHome'), onPress: () => router.replace('/') },
      ]);
    } else {
      // Generate next round
      const nextRound = generateNextRound(updated);
      if (nextRound) {
        updated = {
          ...updated,
          rounds: [...updated.rounds, nextRound],
          currentRound: updated.currentRound + 1,
        };
      }
      await saveTournament(updated);
      setScores({});
    }
  };

  const standings = getStandings(tournament.players);
  const timerSeconds = (tournament.settings.gameTimeMinutes ?? 10) * 60;

  // Standings Tab
  const renderStandingsTab = () => (
    <ScrollView contentContainerStyle={styles.standingsContent}>
      <View style={styles.standingsCard}>
        {/* Header */}
        <View style={styles.standingsHeader}>
          <Text style={[styles.standingsCell, styles.standingsCellRank]}>{t('rank')}</Text>
          <Text style={[styles.standingsCell, { flex: 1 }]}>{t('player')}</Text>
          <Text style={[styles.standingsCell, styles.standingsCellNum]}>{t('games')}</Text>
          <Text style={[styles.standingsCell, styles.standingsCellNum]}>{t('points')}</Text>
          <Text style={[styles.standingsCell, styles.standingsCellNum]}>{t('avg')}</Text>
        </View>
        {standings.map((player, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
          const isTop3 = idx < 3;
          return (
            <View
              key={player.id}
              style={[
                styles.standingsRow,
                idx === 0 && styles.standingsRowGold,
                idx === 1 && styles.standingsRowSilver,
                idx === 2 && styles.standingsRowBronze,
              ]}
            >
              <Text style={[styles.standingsCell, styles.standingsCellRank]}>
                {medal ?? `${idx + 1}`}
              </Text>
              <View style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 0 }]}>
                <Avatar name={player.name} size="sm" />
                <Text style={styles.standingsPlayerName} numberOfLines={1}>{player.name}</Text>
              </View>
              <Text style={[styles.standingsCell, styles.standingsCellNum]}>{player.games}</Text>
              <Text style={[styles.standingsCell, styles.standingsCellNum, styles.standingsPts]}>
                {player.points}
              </Text>
              <Text style={[styles.standingsCell, styles.standingsCellNum]}>{getAverage(player)}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  // Matches Tab
  const renderMatchesTab = () => (
    <FlatList
      data={currentRound?.matches ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.matchesContent, { paddingBottom: insets.bottom + 120 }]}
      ListHeaderComponent={
        <View style={styles.roundHeader}>
          <Text style={styles.roundTitle}>
            {t('round')} {tournament.currentRound}
          </Text>
          <View style={styles.roundBadge}>
            <Text style={styles.roundBadgeText}>
              {tournament.currentRound}/{totalRounds}
            </Text>
          </View>
          {tournament.settings.gameMode === 'time' && (
            <Pressable
              style={({ pressed }) => [styles.timerStartBtn, pressed && { opacity: 0.7 }]}
              onPress={() => setTimerVisible(true)}
            >
              <Text style={styles.timerStartBtnText}>⏱ Timer</Text>
            </Pressable>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <MatchCard match={item} scores={scores} onScorePress={openScoreModal} />
      )}
      ListFooterComponent={
        currentRound?.byePlayers.length ? (
          <View style={styles.byeBox}>
            <Text style={styles.byeTitle}>{t('bye')}</Text>
            {currentRound.byePlayers.map((name, i) => (
              <View key={i} style={styles.byePlayer}>
                <Avatar name={name} size="sm" />
                <Text style={styles.byePlayerName}>{name}</Text>
              </View>
            ))}
          </View>
        ) : null
      }
    />
  );

  return (
    <View style={[styles.container, { paddingBottom: 0 }]}>
      <AppHeader
        title={tournament.name}
        subtitle={`${t('round')} ${tournament.currentRound}/${totalRounds}`}
        showBack
        showLanguageToggle
        onQRPress={() => setQrVisible(true)}
      />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'matches' && styles.tabActive]}
          onPress={() => setActiveTab('matches')}
        >
          <Text style={[styles.tabText, activeTab === 'matches' && styles.tabTextActive]}>
            {t('matches')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'standings' && styles.tabActive]}
          onPress={() => setActiveTab('standings')}
        >
          <Text style={[styles.tabText, activeTab === 'standings' && styles.tabTextActive]}>
            {t('standings')}
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'matches' ? renderMatchesTab() : renderStandingsTab()}
      </View>

      {/* Footer Action */}
      {activeTab === 'matches' && !tournament.finished && (
        <View style={[styles.actionFooter, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              !allScoresEntered && styles.actionBtnDisabled,
              pressed && allScoresEntered && { opacity: 0.85 },
            ]}
            onPress={handleSaveRound}
            disabled={!allScoresEntered}
          >
            <Text style={styles.actionBtnText}>
              {isLastRound ? t('endTournament') : t('saveNextRound')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Score Modal */}
      <ScoreModal
        visible={scoreModal.visible}
        matchId={scoreModal.matchId}
        teamLabel={scoreModal.teamLabel}
        currentScore={scoreModal.currentScore}
        onSelect={handleScoreSelect}
        onClose={() => setScoreModal((prev) => ({ ...prev, visible: false }))}
      />

      {/* Timer Overlay */}
      <TimerOverlay
        visible={timerVisible}
        totalSeconds={timerSeconds}
        onClose={() => setTimerVisible(false)}
      />

      {/* QR Modal */}
      <QRModal
        visible={qrVisible}
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        onClose={() => setQrVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f3' },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280' },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.09)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#1a9e6f' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#1a9e6f' },

  // Matches
  matchesContent: { padding: 12, gap: 10 },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  roundTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  roundBadge: {
    backgroundColor: '#e0f5ec',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roundBadgeText: { fontSize: 12, fontWeight: '600', color: '#0d6b4a' },
  timerStartBtn: {
    marginLeft: 'auto',
    backgroundColor: '#0d6b4a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerStartBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Match Card
  matchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
    gap: 8,
  },
  matchCardDone: {
    borderColor: '#1a9e6f',
    backgroundColor: '#f0fdf8',
  },
  matchCourt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchTeam: { flex: 1, gap: 4 },
  matchTeamRight: { alignItems: 'flex-end' },
  matchPlayer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  matchPlayerRight: { flexDirection: 'row-reverse' },
  matchPlayerName: { fontSize: 13, color: '#111', fontWeight: '500', flex: 1 },
  matchScores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f4f5f3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  scoreBtnFilled: { backgroundColor: '#e0f5ec', borderColor: '#1a9e6f' },
  scoreBtnText: { fontSize: 16, fontWeight: '700', color: '#6b7280' },
  scoreBtnTextFilled: { color: '#0d6b4a' },
  scoreSep: { fontSize: 16, fontWeight: '700', color: '#6b7280' },

  // Bye Box
  byeBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: 8,
    marginTop: 8,
  },
  byeTitle: { fontSize: 13, fontWeight: '700', color: '#d97706' },
  byePlayer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  byePlayerName: { fontSize: 14, color: '#111' },

  // Standings
  standingsContent: { padding: 12, paddingBottom: 100 },
  standingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  standingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f4f5f3',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.09)',
  },
  standingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  standingsRowGold: { backgroundColor: '#fffbeb' },
  standingsRowSilver: { backgroundColor: '#f9fafb' },
  standingsRowBronze: { backgroundColor: '#fff7ed' },
  standingsCell: {
    fontSize: 13,
    color: '#111',
    fontWeight: '500',
  },
  standingsCellRank: { width: 36, textAlign: 'center' },
  standingsCellNum: { width: 40, textAlign: 'center' },
  standingsPlayerName: { fontSize: 13, color: '#111', fontWeight: '500', flex: 1 },
  standingsPts: { color: '#1a9e6f', fontWeight: '700' },

  // Action Footer
  actionFooter: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.09)',
  },
  actionBtn: {
    backgroundColor: '#1a9e6f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionBtnDisabled: { backgroundColor: '#E5E7EB' },
  actionBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  // Score Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111', textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: -8 },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  scoreCell: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#f4f5f3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  scoreCellWide: { width: 112 },
  scoreCellSelected: { backgroundColor: '#e0f5ec', borderColor: '#1a9e6f' },
  scoreCellText: { fontSize: 18, fontWeight: '700', color: '#111' },
  scoreCellTextSelected: { color: '#0d6b4a' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f4f5f3',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#1a9e6f',
    alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: '#E5E7EB' },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },

  // Timer
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 32,
  },
  timerClose: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCloseText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  timerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '500' },
  timerDisplay: {
    color: '#ffffff',
    fontSize: 88,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    lineHeight: 96,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  timerActions: { flexDirection: 'row', gap: 12 },
  timerBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  timerBtnStop: { backgroundColor: 'rgba(0,0,0,0.2)' },
  timerBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
