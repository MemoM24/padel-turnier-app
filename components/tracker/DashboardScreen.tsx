import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { GameEntry, PlannedGame, TrackerStats } from '@/types/tracker';
import { MOOD_EMOJIS } from '@/types/tracker';

const ACCENT = '#1ed97a';
const BLUE = '#3b82f6';
const AMBER = '#f59e0b';
const BG = '#111111';
const SURFACE = '#1a1a1a';
const SURFACE2 = '#222222';
const BORDER = '#2a2a2a';
const TEXT = '#ECEDEE';
const MUTED = '#6b7280';
const DARK_GREEN = '#0d3d1e';

// ─── Animated Ring ────────────────────────────────────────────────────────────
function Ring({
  value, label, color, size = 72,
}: {
  value: number; label: string; color: string; size?: number;
}) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <View style={ringStyles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="#2a2a2a" strokeWidth={8} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={8} fill="none"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={ringStyles.center}>
        <Text style={[ringStyles.value, { color }]}>{value}%</Text>
      </View>
      <Text style={ringStyles.label}>{label}</Text>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 4 },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 20, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 13, fontWeight: '700' },
  label: { fontSize: 11, color: MUTED, textAlign: 'center' },
});

// ─── Form Bar Chart ───────────────────────────────────────────────────────────
function FormChart({ recentForm }: { recentForm: number[] }) {
  const bars = [...recentForm].reverse();
  return (
    <View style={chartStyles.container}>
      {bars.map((v, i) => (
        <View key={i} style={chartStyles.barWrap}>
          <View style={[chartStyles.bar, { height: v ? 32 : 14, backgroundColor: v ? ACCENT : '#2a2a2a' }]} />
        </View>
      ))}
      {Array.from({ length: Math.max(0, 8 - bars.length) }).map((_, i) => (
        <View key={`e${i}`} style={chartStyles.barWrap}>
          <View style={[chartStyles.bar, { height: 14, backgroundColor: '#1e1e1e' }]} />
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 40 },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
});

// ─── Skill Bar ────────────────────────────────────────────────────────────────
function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={skillStyles.row}>
      <Text style={skillStyles.label}>{label}</Text>
      <View style={skillStyles.track}>
        <View style={[skillStyles.fill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={[skillStyles.value, { color }]}>{value}%</Text>
    </View>
  );
}

const skillStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  label: { width: 70, fontSize: 12, color: MUTED },
  track: { flex: 1, height: 6, backgroundColor: '#2a2a2a', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  value: { width: 36, fontSize: 12, fontWeight: '600', textAlign: 'right' },
});

// ─── Main Dashboard ───────────────────────────────────────────────────────────
interface Props {
  games: GameEntry[];
  planned: PlannedGame[];
  stats: TrackerStats | null;
  onAddGame: () => void;
}

export function DashboardScreen({ games, planned, stats, onAddGame }: Props) {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const nextPlanned = planned
    .filter(p => new Date(p.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const formScore = stats?.formScore ?? 0;
  const winRate = stats?.winRate ?? 0;
  const ownLevel = stats?.ownLevel ?? 3.0;
  const levelProgress = Math.round(((ownLevel - Math.floor(ownLevel)) / 0.5) * 100);

  // Skill bars: derive from shot stats
  const shotStats = stats?.shotStats;
  const skillBars = shotStats ? [
    { label: 'Aufschlag', value: shotStats['Aufschlag']?.rate ?? 0, color: ACCENT },
    { label: 'Netz', value: shotStats['Volley']?.rate ?? 0, color: BLUE },
    { label: 'Rückhand', value: shotStats['Rückhand']?.rate ?? 0, color: '#f87171' },
    { label: 'Vibora', value: shotStats['Vibora']?.rate ?? 0, color: AMBER },
    { label: 'Smash', value: shotStats['Smash']?.rate ?? 0, color: '#a78bfa' },
  ] : [];

  const lastGame = games[0];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting + Level */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.greetingName}>Spieler 👋</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelValue}>{ownLevel.toFixed(1)}</Text>
          <Text style={styles.levelLabel}>Level</Text>
        </View>
      </View>

      {/* 3 Rings */}
      <View style={styles.card}>
        <View style={styles.ringsRow}>
          <Ring value={formScore} label="Form" color={ACCENT} />
          <Ring value={winRate} label="Siege" color={BLUE} />
          <Ring value={levelProgress} label="Level" color={AMBER} />
        </View>
      </View>

      {/* Next Match */}
      {nextPlanned ? (
        <View style={[styles.card, styles.nextMatchCard]}>
          <Text style={styles.nextMatchTitle}>Nächstes Spiel</Text>
          <Text style={styles.nextMatchDate}>
            {new Date(nextPlanned.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
            {nextPlanned.time ? ` · ${nextPlanned.time}` : ''}
          </Text>
          {nextPlanned.location && (
            <Text style={styles.nextMatchLocation}>📍 {nextPlanned.location}</Text>
          )}
          {nextPlanned.partnerName && (
            <Text style={styles.nextMatchPartner}>Partner: {nextPlanned.partnerName}</Text>
          )}
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.card, styles.nextMatchCard, pressed && { opacity: 0.8 }]}
          onPress={onAddGame}
        >
          <Text style={styles.nextMatchTitle}>Kein Spiel geplant</Text>
          <Text style={styles.nextMatchSub}>Tippe hier um ein Spiel einzutragen</Text>
        </Pressable>
      )}

      {/* Form Curve */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Formkurve</Text>
        <Text style={styles.cardSubtitle}>Letzte 8 Sessions</Text>
        <FormChart recentForm={stats?.recentForm ?? []} />
      </View>

      {/* Strengths / Weaknesses */}
      {skillBars.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stärken / Schwächen</Text>
          {skillBars.map(s => (
            <SkillBar key={s.label} label={s.label} value={s.value} color={s.color} />
          ))}
        </View>
      )}

      {/* Monthly Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monatsstats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{stats?.totalGames ?? 0}</Text>
            <Text style={styles.statLabel}>Spiele</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: ACCENT }]}>{stats?.totalWins ?? 0}</Text>
            <Text style={styles.statLabel}>Siege</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: AMBER }]}>{ownLevel.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: BLUE }]}>
              {stats?.partnerStats.length ?? 0}
            </Text>
            <Text style={styles.statLabel}>Partner</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: BG },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  greetingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  greeting: { fontSize: 14, color: MUTED },
  greetingName: { fontSize: 22, fontWeight: '700', color: TEXT },
  levelBadge: {
    backgroundColor: ACCENT, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
    alignItems: 'center',
  },
  levelValue: { fontSize: 20, fontWeight: '800', color: '#000' },
  levelLabel: { fontSize: 10, fontWeight: '600', color: '#000', opacity: 0.7 },
  card: {
    backgroundColor: SURFACE, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: MUTED, marginBottom: 10 },
  ringsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  nextMatchCard: { backgroundColor: DARK_GREEN, borderColor: '#1a5c30' },
  nextMatchTitle: { fontSize: 13, fontWeight: '700', color: ACCENT, marginBottom: 4 },
  nextMatchDate: { fontSize: 16, fontWeight: '700', color: TEXT },
  nextMatchLocation: { fontSize: 13, color: MUTED, marginTop: 2 },
  nextMatchPartner: { fontSize: 13, color: MUTED },
  nextMatchSub: { fontSize: 13, color: MUTED },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCell: {
    flex: 1, minWidth: '40%', backgroundColor: SURFACE2, borderRadius: 10,
    padding: 12, alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: TEXT },
  statLabel: { fontSize: 11, color: MUTED },
});
