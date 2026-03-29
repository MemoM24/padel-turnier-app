import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { StepIndicator } from '@/components/StepIndicator';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { useT } from '@/hooks/use-t';
import {
  createTournament,
  calculateTotalMatches,
  estimateDuration,
  getAutoRounds,
} from '@/lib/tournament';
import { createGroupsKOTournament } from '@/lib/groupsKO';
import { addSavedPlayers } from '@/lib/storage';
import type { TournamentSettings } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  americano: 'Klassisches Americano',
  americano_mixed: 'Gemischtes Americano',
  mexicano: 'Klassisches Mexicano',
  king_of_court: 'King of the Court',
  groups_ko: 'Gruppen / KO',
};

const TYPE_DESCRIPTIONS: Record<string, (players: number, courts: number, pointsPerRound: number, rounds: number, totalMatches: number, durationMin: number) => string> = {
  americano: (p, c, pts, r, tm, dur) =>
    `• Sie spielen die Klassisches Americano-Variante.\n• ${p} Spieler spielen auf ${c} Platz${c > 1 ? '/Plätzen' : ''}.\n• Die Spieler werden in einzigartigen Teams gepaart, bis jeder mit jedem und gegen jeden gespielt hat.\n• Jede Runde wird bis zu ${pts} Punkten gespielt. Jeder gewonnene Ball gibt dem Gewinnerpaar einen Punkt. Nach ${pts} gespielten Bällen geben Sie die Ergebnisse ein.\n• Zu spielende Runden: ${r}\n• Gesamtanzahl der Matches: ${tm}\n• Geschätzte Dauer: ${Math.floor(dur / 60)}h ${dur % 60}m`,
  americano_mixed: (p, c, pts, r, tm, dur) =>
    `• Sie spielen die Gemischtes Americano-Variante.\n• ${p} Spieler spielen auf ${c} Platz${c > 1 ? '/Plätzen' : ''}.\n• Teams werden gemischtgeschlechtlich zusammengestellt.\n• Jede Runde wird bis zu ${pts} Punkten gespielt.\n• Zu spielende Runden: ${r}\n• Gesamtanzahl der Matches: ${tm}\n• Geschätzte Dauer: ${Math.floor(dur / 60)}h ${dur % 60}m`,
  mexicano: (p, c, pts, r, tm, dur) =>
    `• Sie spielen die Klassisches Mexicano-Variante.\n• ${p} Spieler spielen auf ${c} Platz${c > 1 ? '/Plätzen' : ''}.\n• Die Paarungen basieren auf dem aktuellen Punktestand – Führende spielen gegen Führende.\n• Jede Runde wird bis zu ${pts} Punkten gespielt.\n• Zu spielende Runden: ${r}\n• Gesamtanzahl der Matches: ${tm}\n• Geschätzte Dauer: ${Math.floor(dur / 60)}h ${dur % 60}m`,
  king_of_court: (p, c, pts, r, tm, dur) =>
    `• Sie spielen King of the Court.\n• ${p} Spieler spielen auf ${c} Platz${c > 1 ? '/Plätzen' : ''}.\n• Der Sieger bleibt auf dem Platz, der Verlierer rückt nach hinten.\n• Jede Runde wird bis zu ${pts} Punkten gespielt.\n• Zu spielende Runden: ${r}\n• Gesamtanzahl der Matches: ${tm}\n• Geschätzte Dauer: ${Math.floor(dur / 60)}h ${dur % 60}m`,
  groups_ko: (p, c, pts, r, tm, dur) =>
    `• Sie spielen Gruppen / KO.\n• ${p} Spieler spielen auf ${c} Platz${c > 1 ? '/Plätzen' : ''}.\n• Gruppenphase gefolgt von K.O.-Runden.\n• Jede Runde wird bis zu ${pts} Punkten gespielt.\n• Zu spielende Runden: ${r}\n• Gesamtanzahl der Matches: ${tm}\n• Geschätzte Dauer: ${Math.floor(dur / 60)}h ${dur % 60}m`,
};

export default function TournamentSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizard, saveTournament } = useTournament();
  const t = useT();

  const { type, settings, players, teams } = wizard;
  const isGroupsKO = type === 'groups_ko';
  const s = settings as TournamentSettings;
  const activeCourts = (s.courts ?? []).filter((c) => c.active);
  const rounds = s.numRounds === 0 ? getAutoRounds(players.length) : (s.numRounds ?? 0);
  const totalMatches = calculateTotalMatches(players.length, rounds, activeCourts.length);
  const durationMinutes = estimateDuration(totalMatches, s.gameMode ?? 'points', s.gameTimeMinutes ?? 10);
  const pointsPerRound = s.pointsPerRound ?? 24;

  // Build Padelmix-style description
  const descFn = TYPE_DESCRIPTIONS[type ?? 'americano'] ?? TYPE_DESCRIPTIONS.americano;
  const description = descFn(
    players.length,
    activeCourts.length,
    pointsPerRound,
    rounds,
    totalMatches,
    durationMinutes,
  );

  const handleCreate = async () => {
    if (!type) return;
    const fullSettings: TournamentSettings = {
      type,
      pointsPerRound,
      numRounds: s.numRounds ?? 0,
      byePoints: s.byePoints ?? 0,
      gameMode: s.gameMode ?? 'points',
      gameTimeMinutes: s.gameTimeMinutes ?? 10,
      courts: s.courts ?? [],
      scoringMode: s.scoringMode ?? 'americano',
      superTiebreakPoints: s.superTiebreakPoints ?? 10,
    };

    if (type === 'groups_ko' && wizard.teams && wizard.teams.length >= 3) {
      // Groups KO: use team-based tournament creation
      const activeCourts = fullSettings.courts.filter((c) => c.active);
      const baseTournament = createTournament(players, fullSettings, wizard.tournamentName);
      const { groups, koBracket } = createGroupsKOTournament(
        wizard.teams,
        activeCourts,
        baseTournament.id,
        baseTournament.name,
      );
      const groupsTournament = {
        ...baseTournament,
        teams: wizard.teams,
        groups,
        koBracket,
        groupPhaseComplete: false,
      };
      await addSavedPlayers(players);
      await saveTournament(groupsTournament);
      router.replace('/tournament-groups' as any);
      return;
    }

    const tournament = createTournament(players, fullSettings, wizard.tournamentName);
    await addSavedPlayers(players);
    await saveTournament(tournament);
    router.replace('/tournament-matches' as any);
  };

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
        {/* Hero: Logo + Tournament Name */}
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.heroLogo}
            resizeMode="contain"
          />
          <Text style={styles.heroName}>{wizard.tournamentName || 'Mein Turnier'}</Text>
          <Text style={styles.heroType}>{TYPE_LABELS[type ?? ''] ?? type}</Text>
        </View>

        {/* Padelmix-style description card */}
        <View style={styles.descCard}>
          {description.split('\n').map((line, i) => (
            <Text key={i} style={styles.descLine}>{line}</Text>
          ))}
        </View>

        {/* Players / Teams */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isGroupsKO && teams ? `${teams.length} Teams` : `${players.length} ${t('players')}`}
          </Text>
          {isGroupsKO && teams ? (
            <View style={styles.teamsGrid}>
              {teams.map((team, idx) => (
                <View key={team.id} style={styles.teamSummaryItem}>
                  <View style={styles.teamSummaryBadge}>
                    <Text style={styles.teamSummaryBadgeText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.teamSummaryInfo}>
                    <Text style={styles.teamSummaryName}>{team.name}</Text>
                    <Text style={styles.teamSummaryPlayers}>{team.player1} & {team.player2}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
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
          )}
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
  content: { padding: 16, gap: 14, paddingBottom: 20 },

  // Hero section
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  heroLogo: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
  },
  heroType: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Description card (Padelmix-style)
  descCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  descLine: {
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 22,
  },

  // Players card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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

  // Footer
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

  // Teams grid (groups_ko)
  teamsGrid: { gap: 8 },
  teamSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  teamSummaryBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a9e6f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamSummaryBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  teamSummaryInfo: { flex: 1 },
  teamSummaryName: { fontSize: 14, fontWeight: '700', color: '#111' },
  teamSummaryPlayers: { fontSize: 12, color: '#6b7280', marginTop: 1 },
});
