/**
 * Centralized haptic feedback utility.
 *
 * Always wraps calls with a Platform.OS !== 'web' guard so the app
 * never crashes on web where the Haptics API may not be available.
 *
 * Usage:
 *   import { haptic } from '@/lib/haptics';
 *   haptic.light();      // tap on a card / list item
 *   haptic.medium();     // destructive action (delete)
 *   haptic.success();    // result saved successfully
 *   haptic.error();      // invalid input / save failed
 *   haptic.selection();  // picker / tab switch
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const haptic = {
  /** Light impact – card tap, minor action */
  light: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /** Medium impact – destructive action (delete, swipe) */
  medium: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /** Heavy impact – reserved for major actions */
  heavy: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  /** Success notification – result saved, phase completed */
  success: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  /** Error notification – invalid input, save failed */
  error: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },

  /** Warning notification – e.g. incomplete data */
  warning: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  /** Selection feedback – tab switch, picker scroll */
  selection: () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  },
};
