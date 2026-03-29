import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
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
  onJoinPress?: () => void;
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
  onJoinPress,
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

  // Ensure at least 12px padding below the status bar (notch/Dynamic Island)
  const topPadding = Math.max(insets.top, 44) + 10;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.row}>
        {/* Left: Back button or PDL1 Logo */}
        <View style={styles.left}>
          {showBack ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.backText}>‹</Text>
            </Pressable>
          ) : (
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
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

        {/* Right: Join + QR + Language Toggle */}
        <View style={styles.right}>
          {!!onJoinPress && (
            <Pressable
              onPress={onJoinPress}
              style={({ pressed }) => [styles.joinBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.joinBtnText}>＋</Text>
              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              )}
            </Pressable>
          )}
          {(showQR || !!onQRPress) && (
            <Pressable
              onPress={onQRPress}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.iconText}>📲</Text>
            </Pressable>
          )}
          {showLanguageToggle && (
            <Pressable
              onPress={toggleLanguage}
              style={({ pressed }) => [styles.langBtn, pressed && { opacity: 0.7 }]}
            >
              <View style={[styles.langBadge, language === 'de' ? styles.langBadgeDe : styles.langBadgeEn]}>
                <Text style={styles.langText}>{language === 'de' ? 'DE' : 'EN'}</Text>
              </View>
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
    paddingBottom: 12,
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
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
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
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    letterSpacing: 0.3,
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
  joinBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a9e6f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    fontSize: 22,
    color: '#ffffff',
    lineHeight: 26,
    fontWeight: '700',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBadgeDe: {
    backgroundColor: '#000000',
  },
  langBadgeEn: {
    backgroundColor: '#012169',
  },
  langText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
