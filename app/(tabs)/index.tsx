/**
 * Tab 1 – "Mein Spiel"
 * Sub-Navigation: Dashboard | Tagebuch | Statistiken
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { loadGames, loadPlannedGames, computeStats } from '@/lib/trackerStorage';
import type { GameEntry, PlannedGame, TrackerStats } from '@/types/tracker';

import { DashboardScreen } from '@/components/tracker/DashboardScreen';
import { DiaryScreen } from '@/components/tracker/DiaryScreen';
import { StatsScreen } from '@/components/tracker/StatsScreen';
import { PostGameSheet } from '@/components/tracker/PostGameSheet';

const ACCENT = '#1ed97a';
const BG = '#111111';
const SURFACE = '#1a1a1a';
const BORDER = '#2a2a2a';
const TEXT = '#ECEDEE';
const MUTED = '#6b7280';

const SUB_TABS = ['Dashboard', 'Tagebuch', 'Statistiken'] as const;
type SubTab = typeof SUB_TABS[number];

export default function MeinSpielTab() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<SubTab>('Dashboard');
  const [games, setGames] = useState<GameEntry[]>([]);
  const [planned, setPlanned] = useState<PlannedGame[]>([]);
  const [stats, setStats] = useState<TrackerStats | null>(null);
  const [showPostGame, setShowPostGame] = useState(false);

  const reload = useCallback(async () => {
    const g = await loadGames();
    const p = await loadPlannedGames();
    setGames(g);
    setPlanned(p);
    setStats(computeStats(g));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleTabPress = (tab: SubTab) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleOpenPostGame = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPostGame(true);
  };

  const handleSaveGame = async () => {
    setShowPostGame(false);
    await reload();
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          PDL<Text style={styles.headerAccent}>1</Text>
        </Text>
      </View>

      {/* Sub-Tab Bar */}
      <View style={styles.subTabBar}>
        {SUB_TABS.map(tab => (
          <Pressable
            key={tab}
            style={[styles.subTab, activeTab === tab && styles.subTabActive]}
            onPress={() => handleTabPress(tab)}
          >
            <Text style={[styles.subTabText, activeTab === tab && styles.subTabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'Dashboard' && (
        <DashboardScreen
          games={games}
          planned={planned}
          stats={stats}
          onAddGame={handleOpenPostGame}
        />
      )}
      {activeTab === 'Tagebuch' && (
        <DiaryScreen
          games={games}
          onAddGame={handleOpenPostGame}
          onRefresh={reload}
        />
      )}
      {activeTab === 'Statistiken' && (
        <StatsScreen stats={stats} games={games} />
      )}

      {/* Post-Game Sheet */}
      {showPostGame && (
        <PostGameSheet
          onClose={() => setShowPostGame(false)}
          onSave={handleSaveGame}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: 1,
  },
  headerAccent: { color: ACCENT },
  subTabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: BORDER,
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  subTabActive: { backgroundColor: ACCENT },
  subTabText: { fontSize: 13, fontWeight: '600', color: MUTED },
  subTabTextActive: { color: '#000' },
});
