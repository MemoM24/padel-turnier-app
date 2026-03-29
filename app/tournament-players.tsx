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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { StepIndicator } from '@/components/StepIndicator';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { JoinQRModal } from '@/components/JoinQRModal';
import { getSavedPlayers } from '@/lib/storage';
import { t } from '@/i18n';
import { useOnboarding } from '@/context/OnboardingContext';
import { TooltipOverlay } from '@/components/TooltipOverlay';

const MIN_PLAYERS = 4;

export default function TournamentPlayersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizard, setWizardPlayers } = useTournament();
  const [players, setPlayers] = useState<string[]>(wizard.players);
  const [inputValue, setInputValue] = useState('');
  const [savedPlayers, setSavedPlayers] = useState<string[]>([]);
  const [joinQrVisible, setJoinQrVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { isScreenDone, markScreenDone } = useOnboarding();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isScreenDone('tournament_players')) {
      const timer = setTimeout(() => setShowTooltip(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  // Generate a temporary tournament ID for the join QR during wizard
  const wizardTournamentId = useRef(`wizard_${Date.now()}`).current;
  const wizardTournamentName = wizard.tournamentName || 'Neues Turnier';

  useEffect(() => {
    getSavedPlayers().then(setSavedPlayers);
  }, []);

  const addPlayer = () => {
    const name = inputValue.trim();
    if (!name || players.includes(name)) return;
    const updated = [...players, name];
    setPlayers(updated);
    setInputValue('');
    inputRef.current?.focus();
  };

  const removePlayer = (name: string) => {
    setPlayers((prev) => prev.filter((p) => p !== name));
  };

  const addSavedPlayer = (name: string) => {
    if (players.includes(name)) return;
    setPlayers((prev) => [...prev, name]);
  };

  const handleNext = () => {
    setWizardPlayers(players);
    router.push('/tournament-summary' as any);
  };

  const remaining = MIN_PLAYERS - players.length;
  const canContinue = players.length >= MIN_PLAYERS;

  const availableSaved = savedPlayers.filter((n) => !players.includes(n));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <AppHeader
          title={t('appName')}
          subtitle={t('addPlayer')}
          showBack
          showLanguageToggle
          onJoinPress={() => setJoinQrVisible(true)}
        />
        <StepIndicator currentStep={3} totalSteps={4} />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={t('playerName')}
              placeholderTextColor="#9BA1A6"
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={addPlayer}
              returnKeyType="done"
              autoCapitalize="words"
            />
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
              onPress={addPlayer}
            >
              <Text style={styles.addBtnText}>{t('add')}</Text>
            </Pressable>
          </View>

          {/* Player List */}
          {players.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {players.length} {t('players')}
              </Text>
              {players.map((name, idx) => (
                <View key={idx} style={styles.playerRow}>
                  <Avatar name={name} size="md" />
                  <Text style={styles.playerName}>{name}</Text>
                  <Pressable
                    style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => removePlayer(name)}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Saved Players */}
          {availableSaved.length > 0 && (
            <View style={styles.savedSection}>
              <Text style={styles.savedTitle}>{t('savedPlayers')}</Text>
              <View style={styles.chipsRow}>
                {availableSaved.map((name, idx) => (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
                    onPress={() => addSavedPlayer(name)}
                  >
                    <Avatar name={name} size="sm" />
                    <Text style={styles.chipText}>{name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
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
                ? t('continueToSummary')
                : `${remaining} ${t('minPlayersNeeded')}`}
            </Text>
          </Pressable>
        </View>
        {/* Onboarding Tooltip */}
        <TooltipOverlay
          visible={showTooltip}
          steps={[
            {
              icon: '👥',
              title: 'Schritt 3: Spieler hinzufügen',
              body: 'Gib die Namen der Spieler ein und bestätige mit der Enter-Taste oder dem + Button. Mindestens 4 Spieler werden benötigt.',
            },
            {
              icon: '⭐',
              title: 'Gespeicherte Spieler',
              body: 'Spieler die du schon mal hinzugefügt hast erscheinen unten als Chips. Einfach antippen um sie direkt hinzuzufügen.',
            },
            {
              icon: '📲',
              title: 'Spieler per QR einladen',
              body: 'Mit dem grünen Button oben rechts kannst du einen QR-Code anzeigen. Spieler scannen ihn und du bestätigst ihren Beitritt.',
            },
          ]}
          onDone={() => {
            setShowTooltip(false);
            markScreenDone('tournament_players');
          }}
        />
        {/* Join QR Modal */}
        <JoinQRModal
          visible={joinQrVisible}
          tournamentId={wizardTournamentId}
          tournamentName={wizardTournamentName}
          onClose={() => setJoinQrVisible(false)}
          onPlayerApproved={(name) => {
            if (!players.includes(name)) {
              setPlayers((prev) => [...prev, name]);
            }
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f3' },
  content: { padding: 16, gap: 12, paddingBottom: 20 },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  addBtn: {
    backgroundColor: '#1a9e6f',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
    gap: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerName: { flex: 1, fontSize: 15, color: '#111', fontWeight: '500' },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f4f5f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { fontSize: 12, color: '#6b7280' },
  savedSection: { gap: 8 },
  savedTitle: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
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
  chipText: { fontSize: 13, color: '#111', fontWeight: '500' },
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
