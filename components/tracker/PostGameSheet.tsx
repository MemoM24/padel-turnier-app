/**
 * PostGameSheet – 3-stufiges Modal für die Spielerfassung
 * Schritt 1: Basics (Ergebnis, Stimmung, Partner)
 * Schritt 2: Court (Position, Zonen)
 * Schritt 3: Schläge & Faktoren
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { saveGame } from '@/lib/trackerStorage';
import type { GameEntry, ShotType, FactorType, CourtZone, MoodScore } from '@/types/tracker';
import { ALL_SHOTS, ALL_FACTORS, MOOD_EMOJIS } from '@/types/tracker';

const ACCENT = '#1ed97a';
const BG = '#111111';
const SURFACE = '#1a1a1a';
const SURFACE2 = '#222222';
const BORDER = '#2a2a2a';
const TEXT = '#ECEDEE';
const MUTED = '#6b7280';
const ERROR = '#f87171';

// ─── Tag Button ───────────────────────────────────────────────────────────────
function TagBtn({
  label, active, color = ACCENT, onPress,
}: {
  label: string; active: boolean; color?: string; onPress: () => void;
}) {
  return (
    <Pressable
      style={[tagStyles.btn, active && { backgroundColor: color, borderColor: color }]}
      onPress={onPress}
    >
      <Text style={[tagStyles.text, active && { color: '#000', fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

const tagStyles = StyleSheet.create({
  btn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE2,
  },
  text: { fontSize: 13, color: MUTED },
});

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepDots({ step }: { step: number }) {
  return (
    <View style={dotStyles.row}>
      {[1, 2, 3].map(s => (
        <View key={s} style={[dotStyles.dot, s === step && dotStyles.active]} />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BORDER },
  active: { backgroundColor: ACCENT, width: 20 },
});

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  onSave: () => void;
}

export function PostGameSheet({ onClose, onSave }: Props) {
  const [step, setStep] = useState(1);

  // Step 1
  const [won, setWon] = useState<boolean | null>(null);
  const [scoreOwn, setScoreOwn] = useState('');
  const [scoreOpp, setScoreOpp] = useState('');
  const [mood, setMood] = useState<MoodScore>(3);
  const [partnerName, setPartnerName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [note, setNote] = useState('');

  // Step 2
  const [position, setPosition] = useState<'links' | 'rechts' | undefined>();
  const [strongZones, setStrongZones] = useState<CourtZone[]>([]);
  const [weakZones, setWeakZones] = useState<CourtZone[]>([]);

  // Step 3
  const [goodShots, setGoodShots] = useState<ShotType[]>([]);
  const [badShots, setBadShots] = useState<ShotType[]>([]);
  const [factors, setFactors] = useState<FactorType[]>([]);

  const toggleArr = <T,>(arr: T[], val: T, set: (v: T[]) => void) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(s => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setStep(s => Math.max(s - 1, 1));
  };

  const handleSave = async () => {
    const entry: GameEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood,
      won,
      scoreOwn: scoreOwn ? parseInt(scoreOwn) : undefined,
      scoreOpponent: scoreOpp ? parseInt(scoreOpp) : undefined,
      partnerName: partnerName || undefined,
      opponentName: opponentName || undefined,
      note: note || undefined,
      position,
      strongZones,
      weakZones,
      goodShots,
      badShots,
      factors,
      conditions: factors,
      courtZone: strongZones[0] ?? weakZones[0],
    };
    await saveGame(entry);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave();
  };

  const ZONE_LABELS: Record<CourtZone, string> = {
    'netz-l': 'Netz L', 'netz-r': 'Netz R',
    'mitte-l': 'Mitte L', 'mitte-r': 'Mitte R',
    'glas-l': 'Glas L', 'glas-r': 'Glas R',
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Title */}
          <Text style={styles.title}>
            {step === 1 ? 'Deine Session' : step === 2 ? 'Court & Position' : 'Schläge & Faktoren'}
          </Text>
          <StepDots step={step} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* ── Step 1: Basics ── */}
            {step === 1 && (
              <>
                {/* Win/Loss */}
                <Text style={styles.label}>Ergebnis</Text>
                <View style={styles.row}>
                  <Pressable
                    style={[styles.resultBtn, won === true && styles.resultBtnWin]}
                    onPress={() => setWon(true)}
                  >
                    <Text style={[styles.resultBtnText, won === true && { color: ACCENT }]}>Sieg</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.resultBtn, won === false && styles.resultBtnLoss]}
                    onPress={() => setWon(false)}
                  >
                    <Text style={[styles.resultBtnText, won === false && { color: ERROR }]}>Niederlage</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.resultBtn, won === null && styles.resultBtnNeutral]}
                    onPress={() => setWon(null)}
                  >
                    <Text style={styles.resultBtnText}>–</Text>
                  </Pressable>
                </View>

                {/* Score */}
                <Text style={styles.label}>Spielstand (optional)</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Eigene"
                    placeholderTextColor={MUTED}
                    keyboardType="number-pad"
                    value={scoreOwn}
                    onChangeText={setScoreOwn}
                    maxLength={2}
                  />
                  <Text style={styles.colon}>:</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Gegner"
                    placeholderTextColor={MUTED}
                    keyboardType="number-pad"
                    value={scoreOpp}
                    onChangeText={setScoreOpp}
                    maxLength={2}
                  />
                </View>

                {/* Mood */}
                <Text style={styles.label}>Stimmung</Text>
                <View style={styles.row}>
                  {([1, 2, 3, 4, 5] as MoodScore[]).map(m => (
                    <Pressable
                      key={m}
                      style={[styles.moodBtn, mood === m && styles.moodBtnActive]}
                      onPress={() => setMood(m)}
                    >
                      <Text style={styles.moodEmoji}>{MOOD_EMOJIS[m]}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Partner */}
                <Text style={styles.label}>Partner (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Name des Partners"
                  placeholderTextColor={MUTED}
                  value={partnerName}
                  onChangeText={setPartnerName}
                  autoCapitalize="words"
                />

                {/* Opponent */}
                <Text style={styles.label}>Gegner (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Name des Gegners"
                  placeholderTextColor={MUTED}
                  value={opponentName}
                  onChangeText={setOpponentName}
                  autoCapitalize="words"
                />

                {/* Note */}
                <Text style={styles.label}>Notiz (optional)</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  placeholder="Was war besonders?"
                  placeholderTextColor={MUTED}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                  returnKeyType="done"
                />
              </>
            )}

            {/* ── Step 2: Court ── */}
            {step === 2 && (
              <>
                <Text style={styles.label}>Wo hast du gespielt?</Text>
                <View style={styles.row}>
                  {(['links', 'rechts'] as const).map(p => (
                    <Pressable
                      key={p}
                      style={[styles.posBtn, position === p && styles.posBtnActive]}
                      onPress={() => setPosition(p)}
                    >
                      <Text style={[styles.posBtnText, position === p && { color: '#000' }]}>
                        {p === 'links' ? 'Links\n(Spielerseite)' : 'Rechts\n(Partnerseite)'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>Starke Zonen</Text>
                <View style={styles.tags}>
                  {(['netz-l', 'netz-r', 'mitte-l', 'mitte-r', 'glas-l', 'glas-r'] as CourtZone[]).map(z => (
                    <TagBtn
                      key={z}
                      label={ZONE_LABELS[z]}
                      active={strongZones.includes(z)}
                      color={ACCENT}
                      onPress={() => toggleArr(strongZones, z, setStrongZones)}
                    />
                  ))}
                </View>

                <Text style={styles.label}>Schwache Zonen</Text>
                <View style={styles.tags}>
                  {(['netz-l', 'netz-r', 'mitte-l', 'mitte-r', 'glas-l', 'glas-r'] as CourtZone[]).map(z => (
                    <TagBtn
                      key={z}
                      label={ZONE_LABELS[z]}
                      active={weakZones.includes(z)}
                      color={ERROR}
                      onPress={() => toggleArr(weakZones, z, setWeakZones)}
                    />
                  ))}
                </View>
              </>
            )}

            {/* ── Step 3: Shots & Factors ── */}
            {step === 3 && (
              <>
                <Text style={styles.label}>Gute Schläge ✓</Text>
                <View style={styles.tags}>
                  {ALL_SHOTS.map(s => (
                    <TagBtn
                      key={s}
                      label={s}
                      active={goodShots.includes(s)}
                      color={ACCENT}
                      onPress={() => toggleArr(goodShots, s, setGoodShots)}
                    />
                  ))}
                </View>

                <Text style={[styles.label, { marginTop: 12 }]}>Schlechte Schläge ✕</Text>
                <View style={styles.tags}>
                  {ALL_SHOTS.map(s => (
                    <TagBtn
                      key={s}
                      label={s}
                      active={badShots.includes(s)}
                      color={ERROR}
                      onPress={() => toggleArr(badShots, s, setBadShots)}
                    />
                  ))}
                </View>

                <Text style={[styles.label, { marginTop: 12 }]}>Heute hatte ich…</Text>
                <View style={styles.tags}>
                  {ALL_FACTORS.map(f => (
                    <TagBtn
                      key={f}
                      label={f}
                      active={factors.includes(f)}
                      color={AMBER}
                      onPress={() => toggleArr(factors, f, setFactors)}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          {/* Navigation */}
          <View style={styles.footer}>
            {step > 1 ? (
              <Pressable style={styles.backBtn} onPress={handleBack}>
                <Text style={styles.backBtnText}>← Zurück</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.backBtn} onPress={onClose}>
                <Text style={styles.backBtnText}>Abbrechen</Text>
              </Pressable>
            )}
            {step < 3 ? (
              <Pressable style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Weiter →</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Speichern ✓</Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const AMBER = '#f59e0b';

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
    borderWidth: 1, borderColor: BORDER,
  },
  handle: {
    width: 40, height: 4, backgroundColor: BORDER,
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: TEXT, textAlign: 'center', marginBottom: 4 },
  body: { paddingBottom: 16, gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: MUTED, marginTop: 12, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    backgroundColor: SURFACE2, borderRadius: 10, padding: 12,
    color: TEXT, fontSize: 14, borderWidth: 1, borderColor: BORDER,
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  colon: { fontSize: 20, color: MUTED, fontWeight: '700' },
  resultBtn: {
    flex: 1, padding: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER,
  },
  resultBtnWin: { borderColor: ACCENT, backgroundColor: '#0d3d1e' },
  resultBtnLoss: { borderColor: ERROR, backgroundColor: '#3d0d0d' },
  resultBtnNeutral: { borderColor: MUTED },
  resultBtnText: { fontSize: 14, fontWeight: '600', color: TEXT },
  moodBtn: {
    flex: 1, padding: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER,
  },
  moodBtnActive: { borderColor: ACCENT, backgroundColor: '#0d3d1e' },
  moodEmoji: { fontSize: 22 },
  posBtn: {
    flex: 1, padding: 16, borderRadius: 12, alignItems: 'center',
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER,
  },
  posBtnActive: { borderColor: ACCENT, backgroundColor: ACCENT },
  posBtnText: { fontSize: 13, fontWeight: '600', color: TEXT, textAlign: 'center' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  backBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER,
  },
  backBtnText: { fontSize: 15, fontWeight: '600', color: MUTED },
  nextBtn: {
    flex: 2, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: ACCENT,
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: ACCENT },
  saveBtn: {
    flex: 2, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: ACCENT,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
});
