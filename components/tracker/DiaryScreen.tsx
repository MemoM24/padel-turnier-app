import React, { useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, RefreshControl,
} from 'react-native';
import type { GameEntry } from '@/types/tracker';
import { MOOD_EMOJIS } from '@/types/tracker';
import { deleteGame } from '@/lib/trackerStorage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const ACCENT = '#1ed97a';
const BG = '#111111';
const SURFACE = '#1a1a1a';
const BORDER = '#2a2a2a';
const TEXT = '#ECEDEE';
const MUTED = '#6b7280';
const ERROR = '#f87171';

interface Props {
  games: GameEntry[];
  onAddGame: () => void;
  onRefresh: () => void;
}

function DiaryCard({ game, onDelete }: { game: GameEntry; onDelete: () => void }) {
  const date = new Date(game.date).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const goodTags = game.goodShots.slice(0, 3);
  const badTags = game.badShots.slice(0, 2);

  return (
    <View style={cardStyles.card}>
      {/* Header row */}
      <View style={cardStyles.headerRow}>
        <Text style={cardStyles.date}>{date}</Text>
        <Text style={cardStyles.mood}>{MOOD_EMOJIS[game.mood]}</Text>
        {game.won !== null && (
          <View style={[cardStyles.resultBadge, game.won ? cardStyles.win : cardStyles.loss]}>
            <Text style={cardStyles.resultText}>{game.won ? 'Sieg' : 'Niederlage'}</Text>
          </View>
        )}
      </View>

      {/* Score + Partners */}
      <View style={cardStyles.scoreRow}>
        {game.scoreOwn !== undefined && game.scoreOpponent !== undefined && (
          <Text style={cardStyles.score}>{game.scoreOwn}:{game.scoreOpponent}</Text>
        )}
        <View style={cardStyles.names}>
          {game.partnerName && (
            <Text style={cardStyles.partnerName}>
              {game.partnerName}
              {game.partnerLevel ? ` ${game.partnerLevel}` : ''}
            </Text>
          )}
          {game.opponentName && (
            <Text style={cardStyles.opponentName}>vs. {game.opponentName}</Text>
          )}
        </View>
      </View>

      {/* Tags */}
      {(goodTags.length > 0 || badTags.length > 0) && (
        <View style={cardStyles.tagsRow}>
          {goodTags.map(t => (
            <View key={t} style={cardStyles.tagGood}>
              <Text style={cardStyles.tagGoodText}>✓ {t}</Text>
            </View>
          ))}
          {badTags.map(t => (
            <View key={t} style={cardStyles.tagBad}>
              <Text style={cardStyles.tagBadText}>✕ {t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Note */}
      {game.note && (
        <Text style={cardStyles.note} numberOfLines={2}>{game.note}</Text>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: BORDER, gap: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontSize: 12, color: MUTED, flex: 1 },
  mood: { fontSize: 18 },
  resultBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  win: { backgroundColor: '#0d3d1e' },
  loss: { backgroundColor: '#3d0d0d' },
  resultText: { fontSize: 11, fontWeight: '700', color: TEXT },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  score: { fontSize: 24, fontWeight: '800', color: TEXT },
  names: { gap: 2 },
  partnerName: { fontSize: 13, fontWeight: '600', color: TEXT },
  opponentName: { fontSize: 12, color: MUTED },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagGood: { backgroundColor: '#0d3d1e', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  tagGoodText: { fontSize: 11, color: ACCENT, fontWeight: '600' },
  tagBad: { backgroundColor: '#3d0d0d', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  tagBadText: { fontSize: 11, color: ERROR, fontWeight: '600' },
  note: { fontSize: 12, color: MUTED, fontStyle: 'italic' },
});

export function DiaryScreen({ games, onAddGame, onRefresh }: Props) {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const handleDelete = async (id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteGame(id);
    await onRefresh();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={games}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <DiaryCard game={item} onDelete={() => handleDelete(item.id)} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={ACCENT} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📓</Text>
            <Text style={styles.emptyText}>Noch keine Einträge.</Text>
            <Text style={styles.emptySubText}>Tippe auf + um dein erstes Spiel einzutragen.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
        onPress={onAddGame}
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  list: { padding: 16, gap: 10, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '600', color: TEXT },
  emptySubText: { fontSize: 13, color: MUTED, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  fabIcon: { fontSize: 28, fontWeight: '300', color: '#000', lineHeight: 32 },
});
