import React, { useState, useEffect, useRef } from 'react';
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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { QRModal } from '@/components/QRModal';
import { useOnboarding } from '@/context/OnboardingContext';
import { TooltipOverlay } from '@/components/TooltipOverlay';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { useT } from '@/hooks/use-t';
import {
  generateNextRound,
  generateFinalRound,
  generateExtraRound,
  applyRoundScores,
  getStandings,
  getAverage,
} from '@/lib/tournament';
import type { Match, Player, SetScore } from '@/types';

// ─── Classic Score Modal (Set-based) ────────────────────────────────────────
/**
 * For Classic mode: enter scores for Set 1, Set 2, and optionally Set 3.
 * Set 3 is only enabled when each team has won exactly 1 set.
 * Returns sets array + derived score1/score2 (sets won by each team).
 */
function ClassicScoreModal({
  visible,
  teamLabel,
  opponentLabel,
  currentSets,
  onSelect,
  onClose,
}: {
  visible: boolean;
  teamLabel: string;
  opponentLabel: string;
  currentSets?: { s1: number | null; s2: number | null }[];
  onSelect: (sets: { s1: number | null; s2: number | null }[], score1: number, score2: number) => void;
  onClose: () => void;
}) {
  const t = useT();
  const emptySet = { s1: null as number | null, s2: null as number | null };
  const [sets, setSets] = useState<{ s1: number | null; s2: number | null }[]>(
    currentSets ?? [{ ...emptySet }, { ...emptySet }, { ...emptySet }],
  );

  useEffect(() => {
    if (visible) {
      setSets(currentSets ?? [{ ...emptySet }, { ...emptySet }, { ...emptySet }]);
    }
  }, [visible]);

  // Determine if set3 is needed: each team won 1 set
  const set1Done = sets[0].s1 !== null && sets[0].s2 !== null;
  const set2Done = sets[1].s1 !== null && sets[1].s2 !== null;
  const team1WonSet1 = set1Done && (sets[0].s1 ?? 0) > (sets[0].s2 ?? 0);
  const team2WonSet1 = set1Done && (sets[0].s2 ?? 0) > (sets[0].s1 ?? 0);
  const team1WonSet2 = set2Done && (sets[1].s1 ?? 0) > (sets[1].s2 ?? 0);
  const team2WonSet2 = set2Done && (sets[1].s2 ?? 0) > (sets[1].s1 ?? 0);
  const needsSet3 = set1Done && set2Done && (
    (team1WonSet1 && team2WonSet2) || (team2WonSet1 && team1WonSet2)
  );

  const updateSet = (setIdx: number, side: 's1' | 's2', val: string) => {
    const num = val === '' ? null : parseInt(val, 10);
    setSets((prev) => {
      const next = [...prev];
      next[setIdx] = { ...next[setIdx], [side]: isNaN(num as number) ? null : num };
      return next;
    });
  };

  const handleConfirm = () => {
    // Validate: set 1 and set 2 must be filled
    if (!set1Done || !set2Done) {
      return;
    }
    if (needsSet3 && (sets[2].s1 === null || sets[2].s2 === null)) {
      return;
    }
    // Calculate sets won
    let score1 = 0;
    let score2 = 0;
    const activeSets = needsSet3 ? sets : sets.slice(0, 2);
    for (const s of activeSets) {
      if (s.s1 !== null && s.s2 !== null) {
        if (s.s1 > s.s2) score1++;
        else if (s.s2 > s.s1) score2++;
      }
    }
    onSelect(needsSet3 ? sets : [sets[0], sets[1], emptySet], score1, score2);
    onClose();
  };

  const isConfirmable = set1Done && set2Done && (!needsSet3 || (sets[2].s1 !== null && sets[2].s2 !== null));

  const SetInput = ({ setIdx, label, disabled }: { setIdx: number; label: string; disabled?: boolean }) => (
    <View style={[styles.classicSetRow, disabled && { opacity: 0.35 }]}>
      <Text style={styles.classicSetLabel}>{label}</Text>
      <View style={styles.classicSetInputs}>
        <TextInput
          style={[styles.classicSetInput, disabled && styles.classicSetInputDisabled]}
          value={sets[setIdx].s1 !== null ? String(sets[setIdx].s1) : ''}
          onChangeText={(v) => updateSet(setIdx, 's1', v)}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#aaa"
          editable={!disabled}
          maxLength={2}
        />
        <Text style={styles.classicSetSep}>:</Text>
        <TextInput
          style={[styles.classicSetInput, disabled && styles.classicSetInputDisabled]}
          value={sets[setIdx].s2 !== null ? String(sets[setIdx].s2) : ''}
          onChangeText={(v) => updateSet(setIdx, 's2', v)}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#aaa"
          editable={!disabled}
          maxLength={2}
        />
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('enterScore')}</Text>

            {/* Team labels */}
            <View style={styles.classicTeamHeader}>
              <Text style={styles.classicTeamName} numberOfLines={1}>{teamLabel}</Text>
              <Text style={styles.classicVs}>vs</Text>
              <Text style={[styles.classicTeamName, { textAlign: 'right' }]} numberOfLines={1}>{opponentLabel}</Text>
            </View>

            <Text style={styles.classicHint}>{t('classicScoreHint')}</Text>

            <SetInput setIdx={0} label={t('set1')} />
            <SetInput setIdx={1} label={t('set2')} />
            <SetInput setIdx={2} label={t('set3')} disabled={!needsSet3} />

            <View style={styles.customActions}>
              <Pressable
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                onPress={onClose}
              >
                <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmBtn,
                  !isConfirmable && styles.confirmBtnDisabled,
                  pressed && isConfirmable && { opacity: 0.85 },
                ]}
                onPress={handleConfirm}
                disabled={!isConfirmable}
              >
                <Text style={styles.confirmBtnText}>{t('confirm')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Score Modal (Padelmix-style) ─────────────────────────────────────────────
/**
 * Full number grid from 0 to pointsPerRound.
 * When a score is selected, the opponent score is auto-calculated as:
 *   opponentScore = pointsPerRound - selectedScore
 * The caller receives BOTH scores so they can be applied simultaneously.
 */
function ScoreModal({
  visible,
  teamLabel,
  opponentLabel,
  currentScore,
  pointsPerRound,
  onSelect,
  onClose,
}: {
  visible: boolean;
  teamLabel: string;
  opponentLabel: string;
  currentScore: number | null;
  pointsPerRound: number;
  onSelect: (teamScore: number, opponentScore: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(currentScore);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const t = useT();

  useEffect(() => {
    setSelected(currentScore);
    setShowCustom(false);
    setCustomText('');
  }, [currentScore, visible]);

  // Build grid: 0 to pointsPerRound
  const numbers = Array.from({ length: pointsPerRound + 1 }, (_, i) => i);

  const handleSelect = (n: number) => {
    setSelected(n);
    const opp = Math.max(0, pointsPerRound - n);
    onSelect(n, opp);
    onClose();
  };

  const handleCustomConfirm = () => {
    const val = parseInt(customText, 10);
    if (!isNaN(val) && val >= 0) {
      const opp = Math.max(0, pointsPerRound - val);
      onSelect(val, opp);
      onClose();
    }
  };

  const opponentPreview = selected !== null ? Math.max(0, pointsPerRound - selected) : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            {/* Title */}
            <Text style={styles.modalTitle}>
              {t('enterScore')}
            </Text>

            {/* Team labels with auto-opponent preview */}
            <View style={styles.modalTeamRow}>
              <View style={styles.modalTeamBlock}>
                <Text style={styles.modalTeamName} numberOfLines={2}>{teamLabel}</Text>
                <View style={[styles.modalScorePreview, selected !== null && styles.modalScorePreviewActive]}>
                  <Text style={[styles.modalScorePreviewText, selected !== null && styles.modalScorePreviewTextActive]}>
                    {selected !== null ? String(selected).padStart(2, '0') : '—'}
                  </Text>
                </View>
              </View>

              <Text style={styles.modalVs}>:</Text>

              <View style={styles.modalTeamBlock}>
                <Text style={[styles.modalTeamName, { textAlign: 'right' }]} numberOfLines={2}>{opponentLabel}</Text>
                <View style={[styles.modalScorePreview, opponentPreview !== null && styles.modalScorePreviewOpp]}>
                  <Text style={[styles.modalScorePreviewText, opponentPreview !== null && styles.modalScorePreviewTextOpp]}>
                    {opponentPreview !== null ? String(opponentPreview).padStart(2, '0') : '—'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.modalHint}>
              Tippe auf eine Zahl – Gegenpunkte werden automatisch berechnet
            </Text>

            {!showCustom ? (
              <>
                {/* Number grid */}
                <ScrollView style={styles.gridScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.scoreGrid}>
                    {numbers.map((n) => (
                      <Pressable
                        key={n}
                        style={({ pressed }) => [
                          styles.scoreCell,
                          selected === n && styles.scoreCellSelected,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => handleSelect(n)}
                      >
                        <Text style={[styles.scoreCellText, selected === n && styles.scoreCellTextSelected]}>
                          {String(n).padStart(2, '0')}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {/* Custom input link */}
                <Pressable
                  style={({ pressed }) => [styles.customLink, pressed && { opacity: 0.6 }]}
                  onPress={() => setShowCustom(true)}
                >
                  <Text style={styles.customLinkText}>Benutzerdefinierte Punktzahl eingeben</Text>
                </Pressable>
              </>
            ) : (
              /* Custom input mode */
              <View style={styles.customInputArea}>
                <Text style={styles.customInputLabel}>Eigene Punktzahl für {teamLabel}:</Text>
                <TextInput
                  style={styles.customInput}
                  value={customText}
                  onChangeText={setCustomText}
                  keyboardType="number-pad"
                  placeholder="z.B. 18"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCustomConfirm}
                />
                <View style={styles.customActions}>
                  <Pressable
                    style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => setShowCustom(false)}
                  >
                    <Text style={styles.cancelBtnText}>{t('back')}</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.confirmBtn,
                      !customText && styles.confirmBtnDisabled,
                      pressed && customText && { opacity: 0.85 },
                    ]}
                    onPress={handleCustomConfirm}
                    disabled={!customText}
                  >
                    <Text style={styles.confirmBtnText}>{t('confirm')}</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Cancel button */}
            {!showCustom && (
              <Pressable
                style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.7 }]}
                onPress={onClose}
              >
                <Text style={styles.resetBtnText}>{t('cancel')}</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
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
  const t = useT();

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
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
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

// ─── Match Card (Padelmix-style) ──────────────────────────────────────────────
function MatchCard({
  match,
  scores,
  onScorePress,
  scoringMode,
}: {
  match: Match;
  scores: Record<string, { s1: number | null; s2: number | null; sets?: SetScore[] }>;
  onScorePress: (matchId: string, team: 1 | 2) => void;
  scoringMode?: string;
}) {
  const s = scores[match.id] ?? { s1: null, s2: null };
  const hasScore = s.s1 !== null && s.s2 !== null;
  const isClassic = scoringMode === 'classic';

  // For classic mode: show set scores inline
  const setDisplay = isClassic && s.sets
    ? s.sets
        .filter((set) => set.s1 !== null && set.s2 !== null)
        .map((set) => `${set.s1}:${set.s2}`)
        .join('  ')
    : null;

  return (
    <View style={[styles.matchCard, hasScore && styles.matchCardDone]}>
      {/* Score area */}
      <Pressable
        style={({ pressed }) => [styles.matchScoreRow, pressed && { opacity: 0.8 }]}
        onPress={() => onScorePress(match.id, 1)}
      >
        {isClassic ? (
          // Classic: show sets won + set details
          <View style={styles.classicMatchScoreArea}>
            <View style={styles.classicMatchSetsWon}>
              <Text style={[styles.scoreBtnText, hasScore && styles.scoreBtnTextFilled]}>
                {s.s1 !== null ? String(s.s1) : '—'}
              </Text>
              <Text style={styles.classicMatchColon}>:</Text>
              <Text style={[styles.scoreBtnText, hasScore && styles.scoreBtnTextFilled]}>
                {s.s2 !== null ? String(s.s2) : '—'}
              </Text>
            </View>
            {setDisplay && (
              <Text style={styles.classicMatchSetDetail}>{setDisplay}</Text>
            )}
            {!hasScore && (
              <Text style={styles.classicMatchTapHint}>Tippen zum Eingeben</Text>
            )}
          </View>
        ) : (
          // Americano / Super-Tiebreak: two separate buttons
          <>
            <Pressable
              style={({ pressed }) => [
                styles.scoreBtn,
                s.s1 !== null && styles.scoreBtnFilled,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => onScorePress(match.id, 1)}
            >
              <Text style={[styles.scoreBtnText, s.s1 !== null && styles.scoreBtnTextFilled]}>
                {s.s1 !== null ? String(s.s1).padStart(2, '0') : '00'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.scoreBtn,
                s.s2 !== null && styles.scoreBtnFilled,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => onScorePress(match.id, 2)}
            >
              <Text style={[styles.scoreBtnText, s.s2 !== null && styles.scoreBtnTextFilled]}>
                {s.s2 !== null ? String(s.s2).padStart(2, '0') : '00'}
              </Text>
            </Pressable>
          </>
        )}
      </Pressable>

      {/* Teams left and right */}
      <View style={styles.matchTeams}>
        {/* Team 1 – left */}
        <View style={styles.matchTeam}>
          {match.team1.map((name, i) => (
            <Text key={i} style={styles.matchPlayerName} numberOfLines={1}>{name}</Text>
          ))}
        </View>

        {/* Court label center */}
        <View style={styles.matchCourtBadge}>
          <Text style={styles.matchCourtText}>⬛ {match.courtName}</Text>
        </View>

        {/* Team 2 – right */}
        <View style={[styles.matchTeam, styles.matchTeamRight]}>
          {match.team2.map((name, i) => (
            <Text key={i} style={[styles.matchPlayerName, styles.matchPlayerNameRight]} numberOfLines={1}>{name}</Text>
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
  const t = useT();

  const [activeTab, setActiveTab] = useState<'matches' | 'standings'>('matches');
  // scores: for americano/supertiebreak: s1/s2 are total points/sets won
  // for classic: s1/s2 are sets won, sets[] contains individual set scores
  const [scores, setScores] = useState<Record<string, { s1: number | null; s2: number | null; sets?: SetScore[] }>>({});
  const [classicModal, setClassicModal] = useState<{
    visible: boolean;
    matchId: string;
    teamLabel: string;
    opponentLabel: string;
    currentSets?: SetScore[];
  }>({ visible: false, matchId: '', teamLabel: '', opponentLabel: '' });
  const [selectedRound, setSelectedRound] = useState<number | null>(null); // null = current round
  const [scoreModal, setScoreModal] = useState<{
    visible: boolean;
    matchId: string;
    team: 1 | 2;
    teamLabel: string;
    opponentLabel: string;
    currentScore: number | null;
  }>({ visible: false, matchId: '', team: 1, teamLabel: '', opponentLabel: '', currentScore: null });
  const [timerVisible, setTimerVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const { isScreenDone, markScreenDone } = useOnboarding();
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!isScreenDone('tournament_matches')) {
      const timer = setTimeout(() => setShowTooltip(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);


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

  const pointsPerRound = tournament.settings.pointsPerRound ?? 24;
  const currentRoundIndex = tournament.currentRound - 1;
  const currentRound = tournament.rounds[currentRoundIndex];
  // For viewing: if selectedRound is set and it's a past round, show that round read-only
  const viewingRoundIndex = selectedRound !== null ? selectedRound - 1 : currentRoundIndex;
  const viewingRound = tournament.rounds[viewingRoundIndex];
  const isViewingPastRound = selectedRound !== null && selectedRound < tournament.currentRound;
  const totalRounds =
    tournament.settings.numRounds === 0
      ? Math.max(tournament.players.length - 1, 4)
      : tournament.settings.numRounds;

  const scoringMode = tournament.settings.scoringMode ?? 'americano';
  const superTiebreakPoints = tournament.settings.superTiebreakPoints ?? 10;

  const allScoresEntered =
    !isViewingPastRound &&
    (currentRound?.matches.every((m) => {
      const s = scores[m.id];
      return s && s.s1 !== null && s.s2 !== null;
    }) ?? false);

  const isLastRound = tournament.currentRound >= totalRounds;

  const openScoreModal = (matchId: string, team: 1 | 2) => {
    if (isViewingPastRound) return; // read-only for past rounds
    const match = currentRound?.matches.find((m) => m.id === matchId);
    if (!match) return;
    const teamNames = match.team1;
    const oppNames = match.team2;
    const s = scores[matchId];

    if (scoringMode === 'classic') {
      // Classic mode: open the set-based modal (always team1 vs team2)
      setClassicModal({
        visible: true,
        matchId,
        teamLabel: teamNames.join(' & '),
        opponentLabel: oppNames.join(' & '),
        currentSets: s?.sets as SetScore[] | undefined,
      });
      return;
    }

    setScoreModal({
      visible: true,
      matchId,
      team,
      teamLabel: teamNames.join(' & '),
      opponentLabel: oppNames.join(' & '),
      currentScore: team === 1 ? (s?.s1 ?? null) : (s?.s2 ?? null),
    });
  };

  // Americano / Super-Tiebreak: auto-calculate opponent score
  const handleScoreSelect = (teamScore: number, opponentScore: number) => {
    const { matchId, team } = scoreModal;
    setScores((prev) => {
      if (team === 1) {
        return { ...prev, [matchId]: { s1: teamScore, s2: opponentScore } };
      } else {
        return { ...prev, [matchId]: { s1: opponentScore, s2: teamScore } };
      }
    });
  };

  // Classic mode: receive sets array + derived sets-won counts
  const handleClassicScoreSelect = (sets: SetScore[], score1: number, score2: number) => {
    const { matchId } = classicModal;
    setScores((prev) => ({ ...prev, [matchId]: { s1: score1, s2: score2, sets } }));
  };

  const handleSaveRound = async () => {
    if (!allScoresEntered) {
      Alert.alert('', t('allScoresRequired'));
      return;
    }

    const scoreList = currentRound.matches.map((m) => {
      const s = scores[m.id]!;
      return { matchId: m.id, score1: s.s1!, score2: s.s2!, sets: s.sets };
    });

    let updated = applyRoundScores(tournament, currentRoundIndex, scoreList);

    if (isLastRound) {
      updated = { ...updated, finished: true };
      await saveTournament(updated);
      Alert.alert(t('tournamentFinished'), '', [
        { text: t('backToHome'), onPress: () => router.replace('/') },
      ]);
    } else {
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

  // ── Extra Round / Final Round handlers ────────────────────────────────────
  const canAddRound = isLastRound && allScoresEntered && !tournament.finished;

  const handleAddExtraRound = async () => {
    if (!allScoresEntered) {
      Alert.alert('', t('allScoresRequired'));
      return;
    }
    // First save current round scores
    const scoreList = currentRound.matches.map((m) => {
      const s = scores[m.id]!;
      return { matchId: m.id, score1: s.s1!, score2: s.s2!, sets: s.sets };
    });
    let updated = applyRoundScores(tournament, currentRoundIndex, scoreList);
    const extraRound = generateExtraRound(updated);
    updated = {
      ...updated,
      rounds: [...updated.rounds, extraRound],
      currentRound: updated.currentRound + 1,
    };
    await saveTournament(updated);
    setScores({});
    setSelectedRound(null);
  };

  const handleAddFinalRound = async () => {
    if (!allScoresEntered) {
      Alert.alert('', t('allScoresRequired'));
      return;
    }
    // First save current round scores
    const scoreList = currentRound.matches.map((m) => {
      const s = scores[m.id]!;
      return { matchId: m.id, score1: s.s1!, score2: s.s2!, sets: s.sets };
    });
    let updated = applyRoundScores(tournament, currentRoundIndex, scoreList);
    const finalRound = generateFinalRound(updated);
    updated = {
      ...updated,
      rounds: [...updated.rounds, finalRound],
      currentRound: updated.currentRound + 1,
    };
    await saveTournament(updated);
    setScores({});
    setSelectedRound(null);
  };

  // ── Round Tabs (horizontal scroll) ────────────────────────────────────────────
  const activeRoundTab = selectedRound ?? tournament.currentRound;
  const renderRoundTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.roundTabsScroll}
      contentContainerStyle={styles.roundTabsContent}
    >
      {Array.from({ length: tournament.rounds.length }, (_, i) => i + 1).map((r) => {
        const round = tournament.rounds[r - 1];
        const label = round?.isFinal ? '🏆' : round?.isExtra ? `${r}+` : `${r}`;
        return (
          <Pressable
            key={r}
            style={[styles.roundTab, r === activeRoundTab && styles.roundTabActive, round?.isFinal && styles.roundTabFinal]}
            onPress={() => {
              if (r === tournament.currentRound) {
                setSelectedRound(null);
              } else {
                setSelectedRound(r);
              }
            }}
          >
            <Text style={[styles.roundTabText, r === activeRoundTab && styles.roundTabTextActive, round?.isFinal && styles.roundTabTextFinal]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
      {/* + button: only shown when on last round and all scores entered */}
      {canAddRound && (
        <Pressable
          style={styles.roundTabAdd}
          onPress={() => {
            Alert.alert(
              'Runde hinzufügen',
              'Welche Art von Runde möchtest du hinzufügen?',
              [
                { text: 'Abbrechen', style: 'cancel' },
                { text: '🔀 Zufällige Runde', onPress: handleAddExtraRound },
                { text: '🏆 Finalrunde', onPress: handleAddFinalRound },
              ]
            );
          }}
        >
          <Text style={styles.roundTabAddText}>+</Text>
        </Pressable>
      )}
      <Text style={styles.roundTabLabel}>Runden</Text>
    </ScrollView>
  );

  // ── Standings Tab ────────────────────────────────────────────────────────────
  const renderStandingsTab = () => (
    <ScrollView contentContainerStyle={styles.standingsContent}>
      <View style={styles.standingsCard}>
        <View style={styles.standingsHeader}>
          <Text style={[styles.standingsCell, styles.standingsCellRank]}>{t('rank')}</Text>
          <Text style={[styles.standingsCell, { flex: 1 }]}>{t('player')}</Text>
          <Text style={[styles.standingsCell, styles.standingsCellNum]}>{t('games')}</Text>
          <Text style={[styles.standingsCell, styles.standingsCellNum]}>{t('points')}</Text>
          <Text style={[styles.standingsCell, styles.standingsCellNum]}>{t('avg')}</Text>
        </View>
        {standings.map((player, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
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
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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

  // Build read-only scores map from saved round data (for past rounds)
  const pastRoundScores: Record<string, { s1: number | null; s2: number | null; sets?: SetScore[] }> = {};
  if (isViewingPastRound && viewingRound) {
    for (const m of viewingRound.matches) {
      pastRoundScores[m.id] = { s1: m.score1, s2: m.score2, sets: m.sets };
    }
  }
  const displayScores = isViewingPastRound ? pastRoundScores : scores;

  // ── Matches Tab ──────────────────────────────────────────────────────────────
  const renderMatchesTab = () => (
    <FlatList
      data={viewingRound?.matches ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.matchesContent, { paddingBottom: insets.bottom + 120 }]}
      ListHeaderComponent={
        <View style={styles.roundHeader}>
          {isViewingPastRound && (
            <View style={styles.pastRoundBanner}>
              <Text style={styles.pastRoundBannerText}>📋 Runde {selectedRound} – Nur Ansicht</Text>
            </View>
          )}
          {!isViewingPastRound && tournament.settings.gameMode === 'time' && (
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
        <MatchCard match={item} scores={displayScores} onScorePress={openScoreModal} scoringMode={scoringMode} />
      )}
      ListFooterComponent={
        viewingRound?.byePlayers?.length ? (
          <View style={styles.byeBox}>
            <Text style={styles.byeTitle}>⬛ Pausierende Spieler</Text>
            <View style={styles.byePlayersList}>
              {viewingRound.byePlayers.map((name, i) => (
                <Text key={i} style={styles.byePlayerName}>{name}</Text>
              ))}
            </View>
          </View>
        ) : null
      }
    />
  );

  return (
    <View style={[styles.container, { paddingBottom: 0 }]}>
      <AppHeader
        title={tournament.name}
        subtitle={`${tournament.settings.pointsPerRound ?? 24} ⊙  ${tournament.players.length} 👤`}
        showBack
        showLanguageToggle
        onQRPress={() => setQrVisible(true)}
      />

      {/* Round Tabs */}
      {renderRoundTabs()}

      {/* Tab Bar: Matches / Standings */}
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
      {activeTab === 'matches' && !tournament.finished && !isViewingPastRound && (
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

      {/* Score Modal – Americano / Super-Tiebreak */}
      <ScoreModal
        visible={scoreModal.visible}
        teamLabel={scoreModal.teamLabel}
        opponentLabel={scoreModal.opponentLabel}
        currentScore={scoreModal.currentScore}
        pointsPerRound={scoringMode === 'supertiebreak' ? superTiebreakPoints : pointsPerRound}
        onSelect={handleScoreSelect}
        onClose={() => setScoreModal((prev) => ({ ...prev, visible: false }))}
      />

      {/* Classic Score Modal – Set-based */}
      <ClassicScoreModal
        visible={classicModal.visible}
        teamLabel={classicModal.teamLabel}
        opponentLabel={classicModal.opponentLabel}
        currentSets={classicModal.currentSets}
        onSelect={handleClassicScoreSelect}
        onClose={() => setClassicModal((prev) => ({ ...prev, visible: false }))}
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

      {/* Onboarding Tooltip */}
      <TooltipOverlay
        visible={showTooltip}
        steps={[
          {
            icon: '🎾',
            title: 'Dein Turnier läuft!',
            body: 'Hier siehst du alle Matches der aktuellen Runde. Tippe auf ein Ergebnis-Feld um die Punkte einzutragen.',
          },
          {
            icon: '📊',
            title: 'Tabelle & Spielplan',
            body: 'Wechsle oben zwischen Spielplan und Tabelle. Die Tabelle zeigt Punkte, Spiele und Durchschnitt aller Spieler.',
          },
          {
            icon: '📱',
            title: 'Live-Ansicht teilen',
            body: 'Mit dem QR-Code-Button oben kannst du einen Link teilen. Zuschauer sehen die Tabelle live im Browser – ohne App-Download.',
          },
          {
            icon: '⏱️',
            title: 'Timer',
            body: 'Der Timer-Button startet einen Countdown für die Spielzeit. Ideal wenn ihr nach Zeit und nicht nach Punkten spielt.',
          },
        ]}
        onDone={() => {
          setShowTooltip(false);
          markScreenDone('tournament_matches');
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f3' },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280' },

  // Round Tabs
  roundTabsScroll: {
    backgroundColor: '#111',
    maxHeight: 64,
  },
  roundTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  roundTab: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  roundTabActive: {
    backgroundColor: '#1a6bff',
    borderColor: '#1a6bff',
  },
  roundTabText: { fontSize: 16, fontWeight: '700', color: '#888' },
  roundTabTextActive: { color: '#ffffff' },
  roundTabFinal: {
    backgroundColor: '#2a1a0a',
    borderColor: '#f59e0b',
  },
  roundTabTextFinal: { color: '#f59e0b' },
  roundTabAdd: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0a2a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1a9e6f',
    borderStyle: 'dashed',
  },
  roundTabAddText: { fontSize: 22, fontWeight: '700', color: '#1a9e6f', lineHeight: 26 },
  roundTabLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },

  // Tab Bar
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
    justifyContent: 'flex-end',
    marginBottom: 4,
    minHeight: 0,
  },
  timerStartBtn: {
    backgroundColor: '#0d6b4a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerStartBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Past round read-only banner
  pastRoundBanner: {
    flex: 1,
    backgroundColor: '#1e3a5f',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
  },
  pastRoundBannerText: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '600',
  },

  // Match Card (Padelmix-style)
  matchCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
    gap: 10,
  },
  matchCardDone: {
    borderColor: '#1a9e6f',
    backgroundColor: '#0d2b1f',
  },
  matchScoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  scoreBtn: {
    width: 64,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  scoreBtnFilled: { backgroundColor: '#1a3d2b', borderColor: '#1a9e6f' },
  scoreBtnText: { fontSize: 22, fontWeight: '700', color: '#888', fontVariant: ['tabular-nums'] },
  scoreBtnTextFilled: { color: '#4ade80' },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchTeam: { flex: 1, gap: 2 },
  matchTeamRight: { alignItems: 'flex-end' },
  matchPlayerName: { fontSize: 14, color: '#e5e7eb', fontWeight: '500' },
  matchPlayerNameRight: { textAlign: 'right' },
  matchCourtBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  matchCourtText: { fontSize: 11, color: '#888', fontWeight: '600' },

  // Bye Box
  byeBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#444',
    gap: 8,
    marginTop: 8,
  },
  byeTitle: { fontSize: 14, fontWeight: '700', color: '#9ca3af' },
  byePlayersList: { gap: 4 },
  byePlayerName: { fontSize: 14, color: '#e5e7eb' },

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
  standingsCell: { fontSize: 13, color: '#111', fontWeight: '500' },
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  modalTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  modalTeamBlock: { flex: 1, alignItems: 'center', gap: 6 },
  modalTeamName: { fontSize: 13, color: '#9ca3af', textAlign: 'center', fontWeight: '500' },
  modalVs: { fontSize: 22, fontWeight: '700', color: '#fff', marginHorizontal: 4 },
  modalScorePreview: {
    width: 64,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  modalScorePreviewActive: { backgroundColor: '#1a3d2b', borderColor: '#1a9e6f' },
  modalScorePreviewOpp: { backgroundColor: '#2a1a1a', borderColor: '#ef4444' },
  modalScorePreviewText: { fontSize: 22, fontWeight: '700', color: '#888', fontVariant: ['tabular-nums'] },
  modalScorePreviewTextActive: { color: '#4ade80' },
  modalScorePreviewTextOpp: { color: '#f87171' },
  modalHint: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: -4 },
  gridScroll: { maxHeight: 280 },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  scoreCell: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  scoreCellSelected: { backgroundColor: '#1a3d2b', borderColor: '#1a9e6f' },
  scoreCellText: { fontSize: 17, fontWeight: '700', color: '#e5e7eb', fontVariant: ['tabular-nums'] },
  scoreCellTextSelected: { color: '#4ade80' },
  customLink: { alignItems: 'center', paddingVertical: 8 },
  customLinkText: { fontSize: 14, color: '#1a6bff', fontWeight: '500' },
  resetBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1a6bff',
    alignItems: 'center',
    marginTop: 4,
  },
  resetBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  customInputArea: { gap: 12 },
  customInputLabel: { fontSize: 14, color: '#9ca3af' },
  customInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
    fontVariant: ['tabular-nums'],
  },
  customActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#9ca3af' },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#1a9e6f',
    alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: '#333' },
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

  // Classic Score Modal
  classicTeamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  classicTeamName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  classicVs: {
    fontSize: 13,
    color: '#9BA1A6',
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  classicHint: {
    fontSize: 12,
    color: '#9BA1A6',
    marginBottom: 12,
    textAlign: 'center',
  },
  classicSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  classicSetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    width: 50,
  },
  classicSetInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  classicSetInput: {
    width: 56,
    height: 48,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  classicSetInputDisabled: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2a2a2a',
    color: '#555',
  },
  classicSetSep: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9BA1A6',
  },

  // Classic match card score display
  classicMatchScoreArea: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  classicMatchSetsWon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classicMatchColon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#9BA1A6',
  },
  classicMatchSetDetail: {
    fontSize: 12,
    color: '#9BA1A6',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  classicMatchTapHint: {
    fontSize: 11,
    color: '#555',
    fontStyle: 'italic',
  },
});
