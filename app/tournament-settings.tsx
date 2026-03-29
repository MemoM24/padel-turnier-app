import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { StepIndicator } from '@/components/StepIndicator';
import { AppHeader } from '@/components/AppHeader';
import { t } from '@/i18n';
import type { Court, GameMode } from '@/types';
import Svg, { Rect, Line, Circle, Ellipse } from 'react-native-svg';

// Mini padel court icon rendered with SVG
function CourtIcon({ active }: { active: boolean }) {
  const stroke = active ? '#0d6b4a' : '#9BA1A6';
  const fill = active ? '#c8f0de' : '#e8e8e8';
  return (
    <Svg width={48} height={32} viewBox="0 0 48 32">
      {/* Court outline */}
      <Rect x="2" y="2" width="44" height="28" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
      {/* Center line */}
      <Line x1="24" y1="2" x2="24" y2="30" stroke={stroke} strokeWidth="1" />
      {/* Service boxes - horizontal lines */}
      <Line x1="2" y1="16" x2="46" y2="16" stroke={stroke} strokeWidth="1" />
      {/* Net */}
      <Rect x="22" y="6" width="4" height="20" rx="1" fill={active ? '#1a9e6f' : '#aaa'} />
      {/* Corner glass walls indicators */}
      <Rect x="2" y="2" width="6" height="4" rx="1" fill={active ? '#1a9e6f' : '#bbb'} opacity="0.5" />
      <Rect x="40" y="2" width="6" height="4" rx="1" fill={active ? '#1a9e6f' : '#bbb'} opacity="0.5" />
      <Rect x="2" y="26" width="6" height="4" rx="1" fill={active ? '#1a9e6f' : '#bbb'} opacity="0.5" />
      <Rect x="40" y="26" width="6" height="4" rx="1" fill={active ? '#1a9e6f' : '#bbb'} opacity="0.5" />
      {/* Ball */}
      <Circle cx="12" cy="10" r="2" fill={active ? '#1a9e6f' : '#aaa'} />
    </Svg>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable
          style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}
          onPress={() => onChange(Math.max(min, value - 1))}
        >
          <Text style={styles.stepperBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{formatValue ? formatValue(value) : value}</Text>
        <Pressable
          style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}
          onPress={() => onChange(Math.min(max, value + 1))}
        >
          <Text style={styles.stepperBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function TournamentSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizard, setWizardSettings } = useTournament();

  const settings = wizard.settings;
  const [pointsPerRound, setPointsPerRound] = useState(settings.pointsPerRound ?? 24);
  const [numRounds, setNumRounds] = useState(settings.numRounds ?? 0);
  const [byePoints, setByePoints] = useState(settings.byePoints ?? 0);
  const [gameMode, setGameMode] = useState<GameMode>(settings.gameMode ?? 'points');
  const [gameTimeMinutes, setGameTimeMinutes] = useState(settings.gameTimeMinutes ?? 10);
  const [courts, setCourts] = useState<Court[]>(
    settings.courts ?? [
      { id: 'court1', name: 'Court 1', active: true },
      { id: 'court2', name: 'Court 2', active: false },
      { id: 'court3', name: 'Court 3', active: false },
      { id: 'court4', name: 'Court 4', active: false },
    ],
  );

  const activeCourtsCount = courts.filter((c) => c.active).length;

  const toggleCourt = (id: string) => {
    const court = courts.find((c) => c.id === id);
    if (!court) return;
    if (court.active && activeCourtsCount <= 1) {
      Alert.alert('', t('minCourt'));
      return;
    }
    setCourts((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  const addCourt = () => {
    Alert.prompt(
      t('courtName'),
      t('enterCourtName'),
      (name) => {
        if (name && name.trim()) {
          setCourts((prev) => [
            ...prev,
            { id: 'court_' + Date.now(), name: name.trim(), active: true },
          ]);
        }
      },
      'plain-text',
      '',
    );
  };

  const handleNext = () => {
    setWizardSettings({
      pointsPerRound,
      numRounds,
      byePoints,
      gameMode,
      gameTimeMinutes,
      courts,
    });
    router.push('/tournament-players' as any);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <AppHeader
        title={t('appName')}
        subtitle={t('settingsTitle')}
        showBack
        showLanguageToggle
      />
      <StepIndicator currentStep={2} totalSteps={4} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Points & Rounds */}
        <View style={styles.card}>
          <Stepper
            label={t('pointsPerRound')}
            value={pointsPerRound}
            min={4}
            max={64}
            onChange={setPointsPerRound}
          />
          <View style={styles.divider} />
          <Stepper
            label={t('roundsLabel')}
            value={numRounds}
            min={0}
            max={20}
            onChange={setNumRounds}
            formatValue={(v) => (v === 0 ? t('auto') : String(v))}
          />
          <View style={styles.divider} />
          <Stepper
            label={t('byePointsLabel')}
            value={byePoints}
            min={0}
            max={20}
            onChange={setByePoints}
          />
        </View>

        {/* Game Mode */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('settingsTitle')}</Text>
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeBtn, gameMode === 'points' && styles.modeBtnActive]}
              onPress={() => setGameMode('points')}
            >
              <Text style={[styles.modeBtnText, gameMode === 'points' && styles.modeBtnTextActive]}>
                {t('pointsMode')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, gameMode === 'time' && styles.modeBtnActive]}
              onPress={() => setGameMode('time')}
            >
              <Text style={[styles.modeBtnText, gameMode === 'time' && styles.modeBtnTextActive]}>
                {t('timeMode')}
              </Text>
            </Pressable>
          </View>
          {gameMode === 'time' && (
            <Stepper
              label={t('gameTime')}
              value={gameTimeMinutes}
              min={1}
              max={60}
              onChange={setGameTimeMinutes}
            />
          )}
        </View>

        {/* Courts */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('courts')}</Text>
          <View style={styles.courtGrid}>
            {courts.map((court) => (
              <Pressable
                key={court.id}
                style={({ pressed }) => [
                  styles.courtBtn,
                  court.active && styles.courtBtnActive,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => toggleCourt(court.id)}
              >
                <CourtIcon active={court.active} />
                <Text style={[styles.courtBtnText, court.active && styles.courtBtnTextActive]}>
                  {court.name}
                </Text>
                {court.active && (
                  <View style={styles.courtActiveDot} />
                )}
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [styles.courtAddBtn, pressed && { opacity: 0.7 }]}
              onPress={addCourt}
            >
              <Text style={styles.courtAddIcon}>＋</Text>
              <Text style={styles.courtAddBtnText}>{t('addCourt')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85 }]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>{t('next')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f3' },
  content: { padding: 16, gap: 12, paddingBottom: 20 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
    gap: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: { fontSize: 14, color: '#111', flex: 1 },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f4f5f3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  stepperBtnText: { fontSize: 20, color: '#111', lineHeight: 24 },
  stepperValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    minWidth: 40,
    textAlign: 'center',
  },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f4f5f3',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  modeBtnActive: { backgroundColor: '#e0f5ec', borderColor: '#1a9e6f' },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  modeBtnTextActive: { color: '#0d6b4a' },
  courtGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  courtBtn: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#f4f5f3',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.09)',
    gap: 6,
    position: 'relative',
  },
  courtBtnActive: { backgroundColor: '#e0f5ec', borderColor: '#1a9e6f' },
  courtBtnText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  courtBtnTextActive: { color: '#0d6b4a' },
  courtActiveDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a9e6f',
  },
  courtAddBtn: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1a9e6f',
    borderStyle: 'dashed',
    gap: 6,
    justifyContent: 'center',
    minHeight: 80,
  },
  courtAddIcon: { fontSize: 20, color: '#1a9e6f' },
  courtAddBtnText: { fontSize: 12, fontWeight: '600', color: '#1a9e6f' },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.09)',
  },
  nextBtn: {
    backgroundColor: '#1a9e6f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
