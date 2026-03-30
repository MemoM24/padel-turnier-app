/**
 * Tab 3 – Kalender
 * Monatsansicht mit grünen Dots für Spieltage, Statistik-Zeile und Nächstes-Spiel-Card.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  loadGames, loadPlannedGames, savePlannedGame, deletePlannedGame,
} from '@/lib/trackerStorage';
import type { GameEntry, PlannedGame } from '@/types/tracker';

const ACCENT = '#1ed97a';
const BG = '#111111';
const SURFACE = '#1a1a1a';
const SURFACE2 = '#222222';
const BORDER = '#2a2a2a';
const TEXT = '#ECEDEE';
const MUTED = '#6b7280';
const DARK_GREEN = '#0d3d1e';

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ─── Plan Game Modal ──────────────────────────────────────────────────────────
function PlanGameModal({
  date,
  onClose,
  onSave,
}: {
  date: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [partner, setPartner] = useState('');
  const [opponent, setOpponent] = useState('');
  const [note, setNote] = useState('');

  const handleSave = async () => {
    const planned: PlannedGame = {
      id: Date.now().toString(),
      date,
      time,
      location: location || undefined,
      partnerName: partner || undefined,
      opponentName: opponent || undefined,
      note: note || undefined,
    };
    await savePlannedGame(planned);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave();
  };

  const displayDate = new Date(date).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={modalStyles.overlay}
      >
        <Pressable style={modalStyles.backdrop} onPress={onClose} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>Spiel planen</Text>
          <Text style={modalStyles.date}>{displayDate}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={modalStyles.label}>Uhrzeit</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="z.B. 18:00"
              placeholderTextColor={MUTED}
              value={time}
              onChangeText={setTime}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={modalStyles.label}>Ort (optional)</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Padel Club, Court 1"
              placeholderTextColor={MUTED}
              value={location}
              onChangeText={setLocation}
            />

            <Text style={modalStyles.label}>Partner (optional)</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Name des Partners"
              placeholderTextColor={MUTED}
              value={partner}
              onChangeText={setPartner}
              autoCapitalize="words"
            />

            <Text style={modalStyles.label}>Gegner (optional)</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Name des Gegners"
              placeholderTextColor={MUTED}
              value={opponent}
              onChangeText={setOpponent}
              autoCapitalize="words"
            />

            <Text style={modalStyles.label}>Notiz (optional)</Text>
            <TextInput
              style={[modalStyles.input, { minHeight: 60 }]}
              placeholder="Besonderheiten..."
              placeholderTextColor={MUTED}
              value={note}
              onChangeText={setNote}
              multiline
              returnKeyType="done"
            />
          </ScrollView>

          <View style={modalStyles.footer}>
            <Pressable style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelText}>Abbrechen</Text>
            </Pressable>
            <Pressable style={modalStyles.saveBtn} onPress={handleSave}>
              <Text style={modalStyles.saveText}>Speichern</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%', borderWidth: 1, borderColor: BORDER,
  },
  handle: {
    width: 40, height: 4, backgroundColor: BORDER,
    borderRadius: 2, alignSelf: 'center', marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: TEXT, textAlign: 'center' },
  date: { fontSize: 13, color: MUTED, textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: MUTED, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: SURFACE2, borderRadius: 10, padding: 12,
    color: TEXT, fontSize: 14, borderWidth: 1, borderColor: BORDER,
  },
  footer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: MUTED },
  saveBtn: {
    flex: 2, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: ACCENT,
  },
  saveText: { fontSize: 15, fontWeight: '700', color: '#000' },
});

// ─── Main Calendar Screen ─────────────────────────────────────────────────────
export default function KalenderTab() {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [games, setGames] = useState<GameEntry[]>([]);
  const [planned, setPlanned] = useState<PlannedGame[]>([]);
  const [planDate, setPlanDate] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setGames(await loadGames());
    setPlanned(await loadPlannedGames());
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const prevMonth = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  // Build day → events map
  const gameDates = new Set(
    games.map(g => g.date.slice(0, 10)),
  );
  const plannedDates = new Set(
    planned.map(p => p.date.slice(0, 10)),
  );

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Stats for this month
  const monthGames = games.filter(g => {
    const d = new Date(g.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const monthWins = monthGames.filter(g => g.won).length;
  const monthPlanned = planned.filter(p => {
    const d = new Date(p.date);
    return d.getFullYear() === year && d.getMonth() === month && new Date(p.date) >= now;
  }).length;

  // Next planned game
  const nextGame = planned
    .filter(p => new Date(p.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const handleDayPress = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlanDate(dateStr);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PDL<Text style={styles.accent}>1</Text></Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <Pressable style={styles.navBtn} onPress={prevMonth}>
            <Text style={styles.navBtnText}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
          <Pressable style={styles.navBtn} onPress={nextMonth}>
            <Text style={styles.navBtnText}>›</Text>
          </Pressable>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarCard}>
          {/* Weekday headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map(d => (
              <Text key={d} style={styles.weekday}>{d}</Text>
            ))}
          </View>

          {/* Day cells */}
          <View style={styles.daysGrid}>
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <View key={`e${i}`} style={styles.dayCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const hasGame = gameDates.has(dateStr);
              const hasPlan = plannedDates.has(dateStr);

              return (
                <Pressable
                  key={day}
                  style={[styles.dayCell, isToday && styles.dayCellToday]}
                  onPress={() => handleDayPress(day)}
                >
                  <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{day}</Text>
                  <View style={styles.dotRow}>
                    {hasGame && <View style={[styles.dot, { backgroundColor: ACCENT }]} />}
                    {hasPlan && <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{monthGames.length}</Text>
            <Text style={styles.statLabel}>gespielt</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: ACCENT }]}>{monthWins}</Text>
            <Text style={styles.statLabel}>Siege</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#3b82f6' }]}>{monthPlanned}</Text>
            <Text style={styles.statLabel}>geplant</Text>
          </View>
        </View>

        {/* Next Match */}
        {nextGame && (
          <View style={styles.nextCard}>
            <Text style={styles.nextTitle}>Nächstes Spiel</Text>
            <Pressable
              style={styles.nextContent}
              onPress={() => setPlanDate(nextGame.date.slice(0, 10))}
            >
              <View>
                <Text style={styles.nextName}>
                  {nextGame.partnerName ? `${nextGame.partnerName}` : 'Spiel'}
                  {nextGame.opponentName ? ` vs. ${nextGame.opponentName}` : ''}
                </Text>
                <Text style={styles.nextMeta}>
                  {new Date(nextGame.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                  {nextGame.time ? ` · ${nextGame.time}` : ''}
                  {nextGame.location ? ` · ${nextGame.location}` : ''}
                </Text>
              </View>
              <Text style={styles.nextArrow}>›</Text>
            </Pressable>
          </View>
        )}

        {/* Tap hint */}
        <Text style={styles.hint}>Tippe auf einen Tag um ein Spiel zu planen</Text>
      </ScrollView>

      {/* Plan Game Modal */}
      {planDate && (
        <PlanGameModal
          date={planDate}
          onClose={() => setPlanDate(null)}
          onSave={async () => {
            setPlanDate(null);
            await reload();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: TEXT, letterSpacing: 1 },
  accent: { color: ACCENT },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  navBtnText: { fontSize: 22, color: TEXT, lineHeight: 28 },
  monthTitle: { fontSize: 18, fontWeight: '700', color: TEXT },
  calendarCard: {
    backgroundColor: SURFACE, borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  weekdayRow: { flexDirection: 'row', marginBottom: 8 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: MUTED },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center',
    justifyContent: 'center', gap: 2, borderRadius: 8,
  },
  dayCellToday: { backgroundColor: DARK_GREEN },
  dayNum: { fontSize: 14, color: TEXT },
  dayNumToday: { color: ACCENT, fontWeight: '700' },
  dotRow: { flexDirection: 'row', gap: 2, height: 6, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  statsRow: {
    flexDirection: 'row', gap: 8,
  },
  statBox: {
    flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: BORDER,
  },
  statValue: { fontSize: 28, fontWeight: '800', color: TEXT },
  statLabel: { fontSize: 12, color: MUTED },
  nextCard: {
    backgroundColor: DARK_GREEN, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1a5c30',
  },
  nextTitle: { fontSize: 12, fontWeight: '700', color: ACCENT, marginBottom: 8 },
  nextContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextName: { fontSize: 15, fontWeight: '700', color: TEXT },
  nextMeta: { fontSize: 12, color: MUTED, marginTop: 2 },
  nextArrow: { fontSize: 20, color: ACCENT },
  hint: { fontSize: 12, color: MUTED, textAlign: 'center', marginTop: 4 },
});
