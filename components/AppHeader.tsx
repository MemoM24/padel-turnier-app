import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTournament } from '@/context/TournamentContext';
import { t } from '@/i18n';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showLanguageToggle?: boolean;
  showQR?: boolean;
  pendingCount?: number;
  onQRPress?: () => void;
  onBackPress?: () => void;
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  showLanguageToggle = true,
  showQR = false,
  pendingCount = 0,
  onQRPress,
  onBackPress,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, toggleLanguage } = useTournament();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {/* Left: Back button or Logo */}
        <View style={styles.left}>
          {showBack ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.backText}>‹</Text>
            </Pressable>
          ) : (
            <View style={styles.logo}>
              <Text style={styles.logoText}>🎾</Text>
            </View>
          )}
        </View>

        {/* Center: Title */}
        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>
            {title ?? t('appName')}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Right: QR + Language Toggle */}
        <View style={styles.right}>
          {showQR && (
            <Pressable
              onPress={onQRPress}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.iconText}>📲</Text>
              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              )}
            </Pressable>
          )}
          {showLanguageToggle && (
            <Pressable
              onPress={toggleLanguage}
              style={({ pressed }) => [styles.langBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.langText}>{language === 'de' ? 'DE' : 'EN'}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.09)',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f4f5f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
    color: '#111',
    lineHeight: 28,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1a9e6f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f4f5f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f4f5f3',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },
});
