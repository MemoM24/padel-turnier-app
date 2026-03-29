import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { StepIndicator } from '@/components/StepIndicator';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { getSavedPlayers } from '@/lib/storage';
import { useT } from '@/hooks/use-t';
import type { Team } from '@/types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

const MIN_TEAMS = 3; // minimum 3 teams = 6 players

export default function TournamentTeamsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizard, setWizardTeams } = useTournament();
  const t = useT();

  // Teams state
  const [teams, setTeams] = useState<Team[]>(
    wizard.teams ?? []
  );

  // Current team being built
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [teamName, setTeamName] = useState('');
  const [savedPlayers, setSavedPlayers] = useState<string[]>([]);
  const [pickingFor, setPickingFor] = useState<1 | 2 | null>(null);

  const p1Ref = useRef<TextInput>(null);
  const p2Ref = useRef<TextInput>(null);

  useEffect(() => {
    getSavedPlayers().then(setSavedPlayers);
  }, []);

  const allUsedPlayers = teams.flatMap((t) => [t.player1, t.player2]);

  const addTeam = () => {
    const p1 = player1.trim();
    const p2 = player2.trim();
    if (!p1 || !p2) return;
    if (p1 === p2) {
      Alert.alert('Fehler', 'Beide Spieler müssen unterschiedlich sein.');
      return;
    }
    if (allUsedPlayers.includes(p1) || allUsedPlayers.includes(p2)) {
      Alert.alert('Fehler', 'Ein Spieler ist bereits in einem anderen Team.');
      return;
    }
    const nextNum = teams.length + 1;
    const name = teamName.trim() || `Team ${nextNum}`;
    const newTeam: Team = { id: generateId(), name, player1: p1, player2: p2 };
    setTeams((prev) => [...prev, newTeam]);
    setPlayer1('');
    setPlayer2('');
    setTeamName('');
    setPickingFor(null);
    // Focus back to player1 input
    setTimeout(() => p1Ref.current?.focus(), 100);
  };

  const removeTeam = (id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  const pickSavedPlayer = (name: string) => {
    if (pickingFor === 1) {
      setPlayer1(name);
      setPickingFor(2);
      setTimeout(() => p2Ref.current?.focus(), 100);
    } else if (pickingFor === 2) {
      setPlayer2(name);
      setPickingFor(null);
    }
  };

  const handleNext = () => {
    setWizardTeams(teams);
    router.push('/tournament-summary' as any);
  };

  const canContinue = teams.length >= MIN_TEAMS;
  const availableSaved = savedPlayers.filter((n) => !allUsedPlayers.includes(n));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <AppHeader
          title={t('appName')}
          subtitle="Teams zusammenstellen"
          showBack
          showLanguageToggle
        />
        <StepIndicator currentStep={3} totalSteps={4} />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Team Entry Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Neues Team {teams.length > 0 ? `(Team ${teams.length + 1})` : ''}
            </Text>

            {/* Player 1 */}
            <View style={styles.playerInputRow}>
              <View style={styles.playerInputLabel}>
                <Text style={styles.playerInputLabelText}>Spieler 1</Text>
              </View>
              <TextInput
                ref={p1Ref}
                style={[styles.playerInput, pickingFor === 1 && styles.playerInputFocused]}
                placeholder="Name eingeben..."
                placeholderTextColor="#9BA1A6"
                value={player1}
                onChangeText={setPlayer1}
                onFocus={() => setPickingFor(1)}
                returnKeyType="next"
                onSubmitEditing={() => p2Ref.current?.focus()}
                autoCapitalize="words"
              />
            </View>

            {/* Player 2 */}
            <View style={styles.playerInputRow}>
              <View style={styles.playerInputLabel}>
                <Text style={styles.playerInputLabelText}>Spieler 2</Text>
              </View>
              <TextInput
                ref={p2Ref}
                style={[styles.playerInput, pickingFor === 2 && styles.playerInputFocused]}
                placeholder="Name eingeben..."
                placeholderTextColor="#9BA1A6"
                value={player2}
                onChangeText={setPlayer2}
                onFocus={() => setPickingFor(2)}
                returnKeyType="done"
                onSubmitEditing={addTeam}
                autoCapitalize="words"
              />
            </View>

            {/* Optional team name */}
            <TextInput
              style={styles.teamNameInput}
              placeholder="Teamname (optional)"
              placeholderTextColor="#9BA1A6"
              value={teamName}
              onChangeText={setTeamName}
              returnKeyType="done"
              onSubmitEditing={addTeam}
              autoCapitalize="words"
            />

            <Pressable
              style={({ pressed }) => [
                styles.addTeamBtn,
                (!player1.trim() || !player2.trim()) && styles.addTeamBtnDisabled,
                pressed && player1.trim() && player2.trim() && { opacity: 0.8 },
              ]}
              onPress={addTeam}
              disabled={!player1.trim() || !player2.trim()}
            >
              <Text style={styles.addTeamBtnText}>+ Team hinzufügen</Text>
            </Pressable>
          </View>

          {/* Saved Players Picker */}
          {availableSaved.length > 0 && (
            <View style={styles.savedSection}>
              <Text style={styles.savedTitle}>
                Gespeicherte Spieler
                {pickingFor && (
                  <Text style={styles.savedHint}> – wähle für Spieler {pickingFor}</Text>
                )}
              </Text>
              <View style={styles.chipsRow}>
                {availableSaved.map((name, idx) => (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [
                      styles.chip,
                      pickingFor && styles.chipActive,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => pickSavedPlayer(name)}
                  >
                    <Avatar name={name} size="sm" />
                    <Text style={styles.chipText}>{name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Teams List */}
          {teams.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {teams.length} {teams.length === 1 ? 'Team' : 'Teams'} hinzugefügt
              </Text>
              {teams.map((team, idx) => (
                <View key={team.id} style={styles.teamRow}>
                  {/* Team badge */}
                  <View style={styles.teamBadge}>
                    <Text style={styles.teamBadgeText}>{idx + 1}</Text>
                  </View>
                  {/* Players */}
                  <View style={styles.teamPlayers}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <View style={styles.teamPlayerNames}>
                      <Avatar name={team.player1} size="sm" />
                      <Text style={styles.teamPlayerName}>{team.player1}</Text>
                      <Text style={styles.teamPlayerSep}>+</Text>
                      <Avatar name={team.player2} size="sm" />
                      <Text style={styles.teamPlayerName}>{team.player2}</Text>
                    </View>
                  </View>
                  {/* Remove */}
                  <Pressable
                    style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => removeTeam(team.id)}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Hint */}
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              Mindestens {MIN_TEAMS} Teams werden benötigt. Die Gruppen werden automatisch nach Teamanzahl und verfügbaren Courts gebildet.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.nextBtn,
              !canContinue && styles.nextBtnDisabled,
              pressed && canContinue && { opacity: 0.85 },
            ]}
            onPress={handleNext}
            disabled={!canContinue}
          >
            <Text style={styles.nextBtnText}>
              {canContinue
                ? 'Weiter zur Zusammenfassung'
                : `Noch ${MIN_TEAMS - teams.length} Team${MIN_TEAMS - teams.length !== 1 ? 's' : ''} benötigt`}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f3' },
  content: { padding: 16, gap: 12, paddingBottom: 20 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
    gap: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#6b7280' },

  playerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerInputLabel: {
    width: 70,
  },
  playerInputLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  playerInput: {
    flex: 1,
    backgroundColor: '#f4f5f3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  playerInputFocused: {
    borderColor: '#1a9e6f',
    backgroundColor: '#f0faf5',
  },
  teamNameInput: {
    backgroundColor: '#f4f5f3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  addTeamBtn: {
    backgroundColor: '#1a9e6f',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addTeamBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  addTeamBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  savedSection: { gap: 8 },
  savedTitle: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  savedHint: { fontSize: 13, fontWeight: '400', color: '#1a9e6f' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  chipActive: {
    borderColor: '#1a9e6f',
    backgroundColor: '#f0faf5',
  },
  chipText: { fontSize: 13, color: '#111', fontWeight: '500' },

  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  teamBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a9e6f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  teamPlayers: { flex: 1, gap: 2 },
  teamName: { fontSize: 13, fontWeight: '700', color: '#111' },
  teamPlayerNames: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  teamPlayerName: { fontSize: 13, color: '#374151' },
  teamPlayerSep: { fontSize: 12, color: '#9BA1A6', fontWeight: '700' },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f4f5f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { fontSize: 12, color: '#6b7280' },

  hintBox: {
    backgroundColor: '#e8f5f0',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#b6e0d0',
  },
  hintText: { fontSize: 13, color: '#1a9e6f', lineHeight: 18 },

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
  nextBtnDisabled: { backgroundColor: '#E5E7EB' },
  nextBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
