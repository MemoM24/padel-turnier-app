/**
 * useT – reactive translation hook.
 *
 * Returns a `t()` function that re-renders the calling component
 * whenever the language is changed via `toggleLanguage()`.
 *
 * Usage:
 *   const t = useT();
 *   <Text>{t('appName')}</Text>
 */
import { useCallback } from 'react';
import { useTournament } from '@/context/TournamentContext';
import { translations, type TranslationKey } from '@/i18n';

export function useT() {
  const { language } = useTournament();

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] ?? translations.de[key] ?? key;
    },
    [language],
  );

  return t;
}
