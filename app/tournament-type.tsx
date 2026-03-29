import React, { useState } from 'react';
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
import { t, type TranslationKey } from '@/i18n';
import type { TournamentType } from '@/types';

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
  const { wizard, setWizardType } = useTournament();
  const [selected, setSelected] = useState<TournamentType | null>(wizard.type);

  const handleNext = () => {
    if (!selected) return;
    setWizardType(selected);
    router.push('/tournament-settings' as any);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <AppHeader
        title={t('appName')}
        subtitle={t('tournamentType')}
        showBack
        showLanguageToggle
      />
      <StepIndicator currentStep={1} totalSteps={4} />

      <ScrollView contentContainerStyle={styles.content}>
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
            !selected && styles.nextBtnDisabled,
            pressed && selected && { opacity: 0.85 },
          ]}
          onPress={handleNext}
          disabled={!selected}
        >
          <Text style={styles.nextBtnText}>{t('next')}</Text>
        </Pressable>
      </View>
    </View>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
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
});
