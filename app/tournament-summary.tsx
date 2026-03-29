import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { StepIndicator } from '@/components/StepIndicator';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { t } from '@/i18n';
import {
  createTournament,
  calculateTotalMatches,
  estimateDuration,
  getAutoRounds,
} from '@/lib/tournament';
import { addSavedPlayers } from '@/lib/storage';
import type { TournamentSettings } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  americano: '🔄 Americano',
  americano_mixed: '👫 Mixed Americano',
  mexicano: '⚡ Mexicano',
  king_of_court: '👑 King of Court',
  groups_ko: '🏆 Gruppen/KO',
};

export default function TournamentSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizard, saveTournament } = useTournament();

  const { type, settings, players } = wizard;
  const s = settings as TournamentSettings;
  const activeCourts = (s.courts ?? []).filter((c) => c.active);
  const rounds = s.numRounds === 0 ? getAutoRounds(players.length) : (s.numRounds ?? 0);
  const totalMatches = calculateTotalMatches(players.length, rounds, activeCourts.length);
  const duration = estimateDuration(totalMatches, s.gameMode ?? 'points', s.gameTimeMinutes ?? 10);

  const handleCreate = async () => {
    if (!type) return;
    const fullSettings: TournamentSettings = {
      type,
      pointsPerRound: s.pointsPerRound ?? 24,
      numRounds: s.numRounds ?? 0,
      byePoints: s.byePoints ?? 0,
      gameMode: s.gameMode ?? 'points',
      gameTimeMinutes: s.gameTimeMinutes ?? 10,
      courts: s.courts ?? [],
    };
    const tournament = createTournament(players, fullSettings);
    await addSavedPlayers(players);
    await saveTournament(tournament);
    router.replace('/tournament-matches' as any);
  };

  const rows = [
    { label: t('format'), value: TYPE_LABELS[type ?? ''] ?? type ?? '-' },
    { label: t('numPlayers'), value: `${players.length} ${t('players')}` },
    { label: t('courts'), value: activeCourts.map((c) => c.name).join(', ') },
    { label: t('pointsPerRound'), value: String(s.pointsPerRound ?? 24) },
    { label: t('numRounds'), value: rounds === 0 ? t('auto') : String(rounds) },
    { label: t('totalMatches'), value: String(totalMatches) },
    {
      label: t('estimatedDuration'),
      value: `~${duration} ${t('minutes')}`,
    },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <AppHeader
        title={t('appName')}
        subtitle={t('summary')}
        showBack
        showLanguageToggle
      />
      <StepIndicator currentStep={4} totalSteps={4} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('summary')}</Text>
          {rows.map(({ label, value }) => (
            <View key={label} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Players */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {players.length} {t('players')}
          </Text>
          <View style={styles.playersGrid}>
            {players.map((name, idx) => (
              <View key={idx} style={styles.playerItem}>
                <Avatar name={name} size="md" />
                <Text style={styles.playerName} numberOfLines={1}>
                  {name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }]}
          onPress={handleCreate}
        >
          <Text style={styles.createBtnText}>{t('createTournament')}</Text>
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
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowLabel: { fontSize: 14, color: '#6b7280' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#111' },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerItem: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  playerName: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.09)',
  },
  createBtn: {
    backgroundColor: '#1a9e6f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#1a9e6f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
