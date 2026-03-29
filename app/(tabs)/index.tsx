import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { getHistory, loadTournamentById } from '@/lib/storage';
import { Avatar } from '@/components/Avatar';
import { t } from '@/i18n';
import type { TournamentHistoryItem } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  americano: '🔄 Americano',
  americano_mixed: '👫 Mixed Americano',
  mexicano: '⚡ Mexicano',
  king_of_court: '👑 King of Court',
  groups_ko: '🏆 Gruppen/KO',
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resetWizard, setTournament, language } = useTournament();
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

  const renderHistoryItem = ({ item }: { item: TournamentHistoryItem }) => {
    const date = new Date(item.createdAt).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
        onPress={() => handleHistoryPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.badge, item.finished ? styles.badgeFinished : styles.badgeLive]}>
              <Text style={[styles.badgeText, item.finished ? styles.badgeTextFinished : styles.badgeTextLive]}>
                {item.finished ? t('finished') : '🟢 ' + t('live')}
              </Text>
            </View>
          </View>
          <Text style={styles.cardMeta}>
            {TYPE_LABELS[item.type] ?? item.type} · {item.playerCount} {t('players')} · {date}
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
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
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
          onPress={() => router.push('/firebase-config' as any)}
          style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.settingsText}>⚙️</Text>
        </Pressable>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
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
    </View>
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
    paddingVertical: 12,
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
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f4f5f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: {
    fontSize: 20,
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
