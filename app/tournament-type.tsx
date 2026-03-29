import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { StepIndicator } from '@/components/StepIndicator';
import { AppHeader } from '@/components/AppHeader';
import { type TranslationKey } from '@/i18n';
import { useT } from '@/hooks/use-t';
import type { TournamentType } from '@/types';
import { useOnboarding } from '@/context/OnboardingContext';
import { TooltipOverlay } from '@/components/TooltipOverlay';

const TYPES: { type: TournamentType; emoji: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { type: 'americano', emoji: '🔄', titleKey: 'typeAmericano', descKey: 'typeAmericanoDesc' },
  { type: 'americano_mixed', emoji: '👫', titleKey: 'typeAmericanoMixed', descKey: 'typeAmericanoMixedDesc' },
  { type: 'mexicano', emoji: '⚡', titleKey: 'typeMexicano', descKey: 'typeMexicanoDesc' },
  { type: 'king_of_court', emoji: '👑', titleKey: 'typeKingOfCourt', descKey: 'typeKingOfCourtDesc' },
  { type: 'groups_ko', emoji: '🏆', titleKey: 'typeGroupsKO', descKey: 'typeGroupsKODesc' },
];

export default function TournamentTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wizard, setWizardType, setWizardName } = useTournament();
  const t = useT();
  const { isScreenDone, markScreenDone } = useOnboarding();
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!isScreenDone('tournament_type')) {
      const timer = setTimeout(() => setShowTooltip(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);
  const [selected, setSelected] = useState<TournamentType | null>(wizard.type);
  const [name, setName] = useState(wizard.tournamentName ?? '');

  const canContinue = !!selected && name.trim().length >= 2;

  const handleNext = () => {
    if (!canContinue) return;
    setWizardType(selected!);
    setWizardName(name.trim());
    router.push('/tournament-settings' as any);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <AppHeader
          title={t('appName')}
          subtitle={t('tournamentType')}
          showBack
          showLanguageToggle
        />
        <StepIndicator currentStep={1} totalSteps={4} />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Tournament Name Input */}
          <View style={styles.nameSection}>
            <Text style={styles.nameLabel}>Turniername</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="z.B. PDL1 Liga März 2026"
              placeholderTextColor="#9ca3af"
              returnKeyType="done"
              maxLength={50}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.sectionTitle}>{t('tournamentType')}</Text>

          {TYPES.map(({ type, emoji, titleKey, descKey }) => {
            const isSelected = selected === type;
            return (
              <Pressable
                key={type}
                style={({ pressed }) => [
                  styles.typeCard,
                  isSelected && styles.typeCardSelected,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => setSelected(type)}
              >
                <View style={styles.typeCardLeft}>
                  <Text style={styles.typeEmoji}>{emoji}</Text>
                </View>
                <View style={styles.typeCardContent}>
                  <Text style={[styles.typeTitle, isSelected && styles.typeTitleSelected]}>
                    {t(titleKey)}
                  </Text>
                  <Text style={[styles.typeDesc, isSelected && styles.typeDescSelected]}>
                    {t(descKey)}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
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
            <Text style={styles.nextBtnText}>{t('next')}</Text>
          </Pressable>
          {!selected && (
            <Text style={styles.hintText}>Bitte Turniertyp auswählen</Text>
          )}
          {selected && name.trim().length < 2 && (
            <Text style={styles.hintText}>Bitte Turniernamen eingeben (min. 2 Zeichen)</Text>
          )}
        </View>
      <TooltipOverlay
        visible={showTooltip}
        steps={[
          {
            icon: '🎾',
            title: 'Schritt 1: Turnierformat',
            body: 'Gib deinem Turnier zuerst einen Namen. Dann wähle das passende Format – z.B. Americano für lockere Runden oder Mexicano für dynamische Partnerauswahl.',
          },
          {
            icon: '🔄',
            title: 'Americano',
            body: 'Jeder spielt mit jedem zusammen. Die Paare rotieren nach jeder Runde automatisch. Ideal für Gruppen von 8–16 Spielern.',
          },
          {
            icon: '⚡',
            title: 'Mexicano',
            body: 'Paare werden nach Punktestand gebildet – starke Spieler spielen gegen starke. Sehr spannend und kompetitiv!',
          },
        ]}
        onDone={() => {
          setShowTooltip(false);
          markScreenDone('tournament_type');
        }}
      />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f3',
  },
  content: {
    padding: 16,
    gap: 10,
    paddingBottom: 20,
  },
  nameSection: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
    gap: 8,
    marginBottom: 4,
  },
  nameLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#1a9e6f',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
    marginTop: 4,
  },
  typeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  typeCardSelected: {
    backgroundColor: '#e0f5ec',
    borderColor: '#1a9e6f',
  },
  typeCardLeft: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f4f5f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeEmoji: {
    fontSize: 22,
  },
  typeCardContent: {
    flex: 1,
    gap: 2,
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  typeTitleSelected: {
    color: '#0d6b4a',
  },
  typeDesc: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  typeDescSelected: {
    color: '#1a9e6f',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a9e6f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.09)',
    gap: 8,
  },
  nextBtn: {
    backgroundColor: '#1a9e6f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
