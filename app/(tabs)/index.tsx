import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useTournament } from '@/context/TournamentContext';
import { getHistory, loadTournamentById, deleteFromHistory } from '@/lib/storage';
import { Avatar } from '@/components/Avatar';
import type { TournamentHistoryItem } from '@/types';
import { useOnboarding } from '@/context/OnboardingContext';
import { TooltipOverlay } from '@/components/TooltipOverlay';
import { FlagIcon } from '@/components/FlagIcon';
import { useT } from '@/hooks/use-t';
import { haptic } from '@/lib/haptics';

const TYPE_LABELS: Record<string, string> = {
  americano: '🔄 Americano',
  americano_mixed: '👫 Mixed Americano',
  mexicano: '⚡ Mexicano',
  king_of_court: '👑 King of Court',
  groups_ko: '🏆 Gruppen/KO',
};

// ─── Swipeable History Card ───────────────────────────────────────────────────

function SwipeableHistoryCard({
  item,
  onPress,
  onDelete,
}: {
  item: TournamentHistoryItem;
  onPress: () => void;
  onDelete: () => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const date = new Date(item.createdAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handleDelete = () => {
    haptic.medium();
    swipeRef.current?.close();
    Alert.alert(
      'Turnier löschen',
      `"${item.name}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            haptic.success();
            onDelete();
          },
        },
      ],
    );
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.7],
      extrapolate: 'clamp',
    });

    return (
      <Pressable style={styles.deleteAction} onPress={handleDelete}>
        <Animated.Text style={[styles.deleteIcon, { transform: [{ scale }] }]}>🗑️</Animated.Text>
        <Animated.Text style={[styles.deleteLabel, { transform: [{ scale }] }]}>Löschen</Animated.Text>
      </Pressable>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
        onPress={onPress}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.badge, item.finished ? styles.badgeFinished : styles.badgeLive]}>
              <Text style={[styles.badgeText, item.finished ? styles.badgeTextFinished : styles.badgeTextLive]}>
                {item.finished ? '✓ Fertig' : '🟢 Live'}
              </Text>
            </View>
          </View>
          <Text style={styles.cardMeta}>
            {TYPE_LABELS[item.type] ?? item.type} · {item.playerCount} Spieler · {date}
          </Text>
        </View>
        <View style={styles.avatarRow}>
          {item.playerNames.slice(0, 6).map((name, idx) => (
            <View key={idx} style={{ marginRight: 4 }}>
              <Avatar name={name} size="sm" />
            </View>
          ))}
          {item.playerNames.length > 6 && (
            <Text style={styles.moreText}>+{item.playerNames.length - 6}</Text>
          )}
        </View>
        {/* Swipe hint on first card */}
        <View style={styles.swipeHint}>
          <Text style={styles.swipeHintText}>← wischen zum Löschen</Text>
        </View>
      </Pressable>
    </Swipeable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resetWizard, setTournament, language, toggleLanguage } = useTournament();
  const t = useT();
  const { isScreenDone, markScreenDone } = useOnboarding();
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!isScreenDone('home')) {
      const timer = setTimeout(() => setShowTooltip(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const [history, setHistory] = useState<TournamentHistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const h = await getHistory();
    setHistory(h);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, language]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleNewTournament = () => {
    resetWizard();
    router.push('/tournament-type' as any);
  };

  const handleHistoryPress = async (item: TournamentHistoryItem) => {
    const tournament = await loadTournamentById(item.id);
    if (tournament) {
      setTournament(tournament);
      router.push('/tournament-matches' as any);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteFromHistory(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const headerTop = Math.max(insets.top, 44);

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerTop + 10 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.appTitle}>{t('appName')}</Text>
            <Text style={styles.appSubtitle}>{t('appSubtitle')}</Text>
          </View>
        </View>
        <Pressable
          onPress={toggleLanguage}
          style={({ pressed }) => [styles.langBtn, pressed && { opacity: 0.7 }]}
        >
          <FlagIcon lang={language as 'de' | 'en'} size={36} />
        </Pressable>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <SwipeableHistoryCard
            item={item}
            onPress={() => handleHistoryPress(item)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a9e6f" />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Pressable
              style={({ pressed }) => [styles.newBtn, pressed && { opacity: 0.85 }]}
              onPress={handleNewTournament}
            >
              <Text style={styles.newBtnText}>{t('newTournament')}</Text>
            </Pressable>
            {history.length > 0 && (
              <Text style={styles.sectionTitle}>{t('history')}</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏓</Text>
            <Text style={styles.emptyText}>{t('noHistory')}</Text>
          </View>
        }
      />

      <TooltipOverlay
        visible={showTooltip}
        steps={[
          {
            icon: '🎾',
            title: 'Willkommen bei PDL1!',
            body: 'Deine Padel-Turnierverwaltung. Erstelle Turniere, verwalte Spieler und verfolge Ergebnisse – alles in einer App.',
          },
          {
            icon: '➕',
            title: 'Neues Turnier starten',
            body: 'Tippe auf den grünen Button um ein neues Turnier zu erstellen. Du kannst zwischen 5 verschiedenen Formaten wählen.',
          },
          {
            icon: '📋',
            title: 'Turnier-Historie',
            body: 'Hier erscheinen alle deine Turniere. Tippe auf ein Turnier um es fortzusetzen oder die Ergebnisse anzusehen.',
          },
          {
            icon: '🗑️',
            title: 'Turnier löschen',
            body: 'Wische eine Karte nach links um das Turnier aus der Historie zu löschen.',
          },
        ]}
        onDone={() => {
          setShowTooltip(false);
          markScreenDone('home');
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.09)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  langBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  listHeader: {
    gap: 16,
    marginBottom: 8,
  },
  newBtn: {
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
  newBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
    gap: 10,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  cardMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeLive: {
    backgroundColor: '#e0f5ec',
  },
  badgeFinished: {
    backgroundColor: '#f4f5f3',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextLive: {
    color: '#1a9e6f',
  },
  badgeTextFinished: {
    color: '#6b7280',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
  },
  swipeHint: {
    alignItems: 'flex-end',
  },
  swipeHintText: {
    fontSize: 10,
    color: '#d1d5db',
    fontStyle: 'italic',
  },

  // Delete action
  deleteAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 14,
    marginLeft: 8,
    gap: 4,
  },
  deleteIcon: {
    fontSize: 20,
  },
  deleteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
});
