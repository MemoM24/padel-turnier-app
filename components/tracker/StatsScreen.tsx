import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
} from 'react-native';
import Svg, { Rect, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import type { GameEntry, TrackerStats } from '@/types/tracker';

const ACCENT = '#1ed97a';
const BLUE = '#3b82f6';
const AMBER = '#f59e0b';
const ERROR = '#f87171';
const BG = '#111111';
const SURFACE = '#1a1a1a';
const SURFACE2 = '#222222';
const BORDER = '#2a2a2a';
const TEXT = '#ECEDEE';
const MUTED = '#6b7280';

// ─── Shot Bar ─────────────────────────────────────────────────────────────────
function ShotBar({ name, good, bad }: { name: string; good: number; bad: number }) {
  const total = good + bad;
  const rate = total > 0 ? Math.round((good / total) * 100) : 0;
  const goodW = total > 0 ? (good / total) * 100 : 0;
  const badW = total > 0 ? (bad / total) * 100 : 0;

  return (
    <View style={shotStyles.row}>
      <Text style={shotStyles.name}>{name}</Text>
      <View style={shotStyles.barTrack}>
        <View style={[shotStyles.barGood, { width: `${goodW}%` }]} />
        <View style={[shotStyles.barBad, { width: `${badW}%` }]} />
      </View>
      <Text style={[shotStyles.rate, { color: rate >= 50 ? ACCENT : ERROR }]}>{rate}%</Text>
    </View>
  );
}

const shotStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  name: { width: 72, fontSize: 12, color: TEXT },
  barTrack: { flex: 1, height: 8, backgroundColor: '#2a2a2a', borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },
  barGood: { height: '100%', backgroundColor: ACCENT },
  barBad: { height: '100%', backgroundColor: ERROR },
  rate: { width: 36, fontSize: 12, fontWeight: '700', textAlign: 'right' },
});

// ─── Court Heatmap ────────────────────────────────────────────────────────────
function CourtHeatmap({ zones }: { zones: Record<string, { good: number; bad: number }> }) {
  const W = 240;
  const H = 320;
  const cols = 2;
  const rows = 3;
  const cw = W / cols;
  const ch = H / rows;

  const zoneKeys = [
    ['net-left', 'net-right'],
    ['mid-left', 'mid-right'],
    ['back-left', 'back-right'],
  ];

  const zoneLabels: Record<string, string> = {
    'net-left': 'Netz', 'net-right': 'Netz',
    'mid-left': 'Mitte', 'mid-right': 'Mitte',
    'back-left': 'Glas', 'back-right': 'Glas',
  };

  const getColor = (key: string) => {
    const z = zones[key];
    if (!z || (z.good + z.bad) === 0) return '#1a1a1a';
    const rate = z.good / (z.good + z.bad);
    if (rate >= 0.65) return '#0d3d1e';
    if (rate >= 0.45) return '#3d3d0d';
    return '#3d0d0d';
  };

  const getRate = (key: string) => {
    const z = zones[key];
    if (!z || (z.good + z.bad) === 0) return null;
    return Math.round((z.good / (z.good + z.bad)) * 100);
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={W} height={H} style={{ borderRadius: 12, overflow: 'hidden' }}>
        {/* Court outline */}
        <Rect x={0} y={0} width={W} height={H} fill="#1a2a1a" rx={12} />
        {/* Net line */}
        <Rect x={8} y={H / 2 - 2} width={W - 16} height={3} fill="#ffffff" opacity={0.5} />
        {/* Zone cells */}
        {zoneKeys.map((row, ri) =>
          row.map((key, ci) => {
            const rate = getRate(key);
            const color = getColor(key);
            return (
              <React.Fragment key={key}>
                <Rect
                  x={ci * cw + 4} y={ri * ch + 4}
                  width={cw - 8} height={ch - 8}
                  fill={color} rx={8}
                />
                {rate !== null && (
                  <>
                    <SvgText
                      x={ci * cw + cw / 2} y={ri * ch + ch / 2 - 6}
                      textAnchor="middle" fill="#fff" fontSize={12} fontWeight="600"
                    >
                      {zoneLabels[key]}
                    </SvgText>
                    <SvgText
                      x={ci * cw + cw / 2} y={ri * ch + ch / 2 + 12}
                      textAnchor="middle"
                      fill={rate >= 65 ? ACCENT : rate >= 45 ? AMBER : ERROR}
                      fontSize={16} fontWeight="800"
                    >
                      {rate}%
                    </SvgText>
                  </>
                )}
              </React.Fragment>
            );
          })
        )}
      </Svg>
      <View style={heatStyles.legend}>
        <View style={heatStyles.legendItem}>
          <View style={[heatStyles.dot, { backgroundColor: ACCENT }]} />
          <Text style={heatStyles.legendText}>Stärke</Text>
        </View>
        <View style={heatStyles.legendItem}>
          <View style={[heatStyles.dot, { backgroundColor: ERROR }]} />
          <Text style={heatStyles.legendText}>Fehler</Text>
        </View>
      </View>
    </View>
  );
}

const heatStyles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: MUTED },
});

// ─── Disruptors ───────────────────────────────────────────────────────────────
function DisruptorCard({ label, impact, positive }: { label: string; impact: number; positive: boolean }) {
  return (
    <View style={disStyles.card}>
      <View style={disStyles.left}>
        <Text style={disStyles.label}>{label}</Text>
        <Text style={disStyles.sub}>→ Siegquote</Text>
      </View>
      <Text style={[disStyles.value, { color: positive ? ACCENT : ERROR }]}>
        {positive ? '+' : ''}{impact}%
      </Text>
    </View>
  );
}

const disStyles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE2, borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: BORDER, marginBottom: 8,
  },
  left: { gap: 2 },
  label: { fontSize: 14, fontWeight: '600', color: TEXT },
  sub: { fontSize: 12, color: MUTED },
  value: { fontSize: 22, fontWeight: '800' },
});

// ─── Main Stats Screen ────────────────────────────────────────────────────────
interface Props {
  stats: TrackerStats | null;
  games: GameEntry[];
}

const SUB = ['Schläge', 'Heatmap', 'Störfaktoren'] as const;
type SubView = typeof SUB[number];

export function StatsScreen({ stats, games }: Props) {
  const [view, setView] = useState<SubView>('Schläge');

  const shotStats: Record<string, { good: number; bad: number; rate: number }> = (stats?.shotStats ?? {}) as any;
  const shotNames = Object.keys(shotStats);

  // Compute disruptors from condition tags
  const conditionImpact: Record<string, { wins: number; total: number }> = {};
  for (const g of games) {
    for (const cond of g.conditions) {
      if (!conditionImpact[cond]) conditionImpact[cond] = { wins: 0, total: 0 };
      conditionImpact[cond].total++;
      if (g.won) conditionImpact[cond].wins++;
    }
  }
  const baseWinRate = stats?.winRate ?? 50;
  const disruptors = Object.entries(conditionImpact)
    .filter(([, v]) => v.total >= 2)
    .map(([label, v]) => {
      const rate = Math.round((v.wins / v.total) * 100);
      return { label, impact: rate - baseWinRate, positive: rate > baseWinRate };
    })
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 5);

  // Zone data from games
  const zones: { [key: string]: { good: number; bad: number } } = {};
  for (const g of games) {
    if (g.courtZone) {
      if (!zones[g.courtZone]) zones[g.courtZone] = { good: 0, bad: 0 };
      if (g.won) (zones[g.courtZone] as { good: number; bad: number }).good++;
      else (zones[g.courtZone] as { good: number; bad: number }).bad++;
    }
  }

  return (
    <View style={styles.container}>
      {/* Sub-tab pills */}
      <View style={styles.pills}>
        {SUB.map(s => (
          <Pressable
            key={s}
            style={[styles.pill, view === s && styles.pillActive]}
            onPress={() => setView(s)}
          >
            <Text style={[styles.pillText, view === s && styles.pillTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {view === 'Schläge' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Meine Schläge</Text>
            {shotNames.length === 0 ? (
              <Text style={styles.empty}>Noch keine Daten. Trage Spiele ein!</Text>
            ) : (
              shotNames.map(name => (
                <ShotBar
                  key={name}
                  name={name}
                  good={shotStats[name].good}
                  bad={shotStats[name].bad}
                />
              ))
            )}
            {stats?.topShot && (
              <View style={styles.insightBox}>
                <Text style={styles.insightText}>
                  💡 Dein stärkster Schlag ist <Text style={{ color: ACCENT, fontWeight: '700' }}>{stats.topShot}</Text>
                </Text>
              </View>
            )}
            {stats?.weakShot && (
              <View style={[styles.insightBox, styles.insightWarn]}>
                <Text style={styles.insightText}>
                  ⚠️ Deine Schwäche ist <Text style={{ color: AMBER, fontWeight: '700' }}>{stats.weakShot}</Text>
                </Text>
              </View>
            )}
          </View>
        )}

        {view === 'Heatmap' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Deine Heatmap – letzten 30 Tage</Text>
            <CourtHeatmap zones={zones} />
          </View>
        )}

        {view === 'Störfaktoren' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Was beeinflusst mein Spiel?</Text>
            {disruptors.length === 0 ? (
              <Text style={styles.empty}>Noch keine Daten. Trage Bedingungen in deinen Spielen ein!</Text>
            ) : (
              disruptors.map(d => (
                <DisruptorCard key={d.label} label={d.label} impact={d.impact} positive={d.positive} />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  pills: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
  },
  pillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  pillText: { fontSize: 13, fontWeight: '600', color: MUTED },
  pillTextActive: { color: '#000' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: SURFACE, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 12 },
  empty: { fontSize: 13, color: MUTED, textAlign: 'center', paddingVertical: 20 },
  insightBox: {
    backgroundColor: '#0d3d1e', borderRadius: 10, padding: 12, marginTop: 10,
    borderWidth: 1, borderColor: '#1a5c30',
  },
  insightWarn: { backgroundColor: '#3d2d00', borderColor: '#5c4500' },
  insightText: { fontSize: 13, color: TEXT },
});
