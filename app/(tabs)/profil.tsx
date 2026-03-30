/**
 * Tab 4 – Profil
 * Level-Cards (Playtomic + Eigenes Level), Achievements, Partner-Chemie-Balken
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal,
  TextInput, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { loadGames, loadProfile, saveProfile, computeStats } from '@/lib/trackerStorage';
import type { PlayerProfile, TrackerStats, Achievement } from '@/types/tracker';
import { ACHIEVEMENTS } from '@/types/tracker';

const ACCENT = '#1ed97a';
const BG = '#111111';
const SURFACE = '#1a1a1a';
const SURFACE2 = '#222222';
const BORDER = '#2a2a2a';
const TEXT = '#ECEDEE';
const MUTED = '#6b7280';
const BLUE = '#3b82f6';
const DARK_GREEN = '#0d3d1e';

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: PlayerProfile | null;
  onClose: () => void;
  onSave: (p: PlayerProfile) => void;
}) {
  const [name, setName] = useState(profile?.name ?? '');
  const [playtomicLevel, setPlaytomicLevel] = useState(
    profile?.playtomicLevel?.toString() ?? '',
  );

  const handleSave = async () => {
    const p: PlayerProfile = {
      name,
      playtomicLevel: playtomicLevel ? parseFloat(playtomicLevel) : undefined,
      joinedAt: profile?.joinedAt ?? new Date().toISOString(),
      ownLevel: profile?.ownLevel,
    };
    await saveProfile(p);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(p);
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={editStyles.overlay}>
        <Pressable style={editStyles.backdrop} onPress={onClose} />
        <View style={editStyles.sheet}>
          <View style={editStyles.handle} />
          <Text style={editStyles.title}>Profil bearbeiten</Text>

          <Text style={editStyles.label}>Name</Text>
          <TextInput
            style={editStyles.input}
            placeholder="Dein Name"
            placeholderTextColor={MUTED}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={editStyles.label}>Playtomic Level (optional)</Text>
          <TextInput
            style={editStyles.input}
            placeholder="z.B. 4.0"
            placeholderTextColor={MUTED}
            value={playtomicLevel}
            onChangeText={setPlaytomicLevel}
            keyboardType="decimal-pad"
          />

          <View style={editStyles.footer}>
            <Pressable style={editStyles.cancelBtn} onPress={onClose}>
              <Text style={editStyles.cancelText}>Abbrechen</Text>
            </Pressable>
            <Pressable style={editStyles.saveBtn} onPress={handleSave}>
              <Text style={editStyles.saveText}>Speichern</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const editStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderWidth: 1, borderColor: BORDER,
  },
  handle: {
    width: 40, height: 4, backgroundColor: BORDER,
    borderRadius: 2, alignSelf: 'center', marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: TEXT, textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: MUTED, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: SURFACE2, borderRadius: 10, padding: 12,
    color: TEXT, fontSize: 14, borderWidth: 1, borderColor: BORDER,
  },
  footer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: MUTED },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: ACCENT },
  saveText: { fontSize: 15, fontWeight: '700', color: '#000' },
});

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(w => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={avatarStyles.circle}>
      <Text style={avatarStyles.text}>{initials || '?'}</Text>
      <View style={avatarStyles.dot} />
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  circle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1a3a2a', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: ACCENT,
  },
  text: { fontSize: 28, fontWeight: '800', color: ACCENT },
  dot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: ACCENT, borderWidth: 2, borderColor: BG,
  },
});

// ─── Main Profil Screen ───────────────────────────────────────────────────────
export default function ProfilTab() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<TrackerStats | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const reload = useCallback(async () => {
    const [p, games] = await Promise.all([loadProfile(), loadGames()]);
    setProfile(p);
    if (games.length > 0) setStats(computeStats(games));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Compute achievements
  const unlockedIds = new Set<string>();
  if (stats) {
    if (stats.totalGames >= 1) unlockedIds.add('first_game');
    if (stats.totalWins >= 1) unlockedIds.add('first_win');
    if (stats.totalGames >= 10) unlockedIds.add('games_10');
    if (stats.recentForm.slice(-5).every(x => x === 1)) unlockedIds.add('streak_5');
    if ((profile?.ownLevel ?? 0) >= 4.5) unlockedIds.add('level_45');
  }

  const achievements: Achievement[] = ACHIEVEMENTS.map(a => ({
    ...a,
    unlockedAt: unlockedIds.has(a.id) ? new Date().toISOString() : undefined,
  }));

  const partnerStats = stats?.partnerStats ?? [];
  const maxPartnerGames = Math.max(...partnerStats.map(p => p.games), 1);

  const ownLevel = stats ? Math.min(5.0, 1.0 + stats.winRate / 25) : (profile?.ownLevel ?? 0);
  const playtomicLevel = profile?.playtomicLevel ?? null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PDL<Text style={styles.accent}>1</Text></Text>
        <Pressable
          style={styles.editBtn}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setEditOpen(true);
          }}
        >
          <Text style={styles.editBtnText}>✎</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Avatar + Name */}
        <View style={styles.profileRow}>
          <Avatar name={profile?.name ?? ''} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.name ?? 'Kein Name'}</Text>
            <Text style={styles.profileSince}>
              Dabei seit {profile ? new Date(profile.joinedAt).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) : '–'}
            </Text>
          </View>
        </View>

        {/* Level Cards */}
        <View style={styles.levelRow}>
          <View style={[styles.levelCard, { backgroundColor: BLUE + '22', borderColor: BLUE }]}>
            <Text style={[styles.levelValue, { color: BLUE }]}>
              {playtomicLevel?.toFixed(1) ?? '–'}
            </Text>
            <Text style={styles.levelLabel}>Playtomic</Text>
          </View>
          <View style={[styles.levelCard, { backgroundColor: DARK_GREEN, borderColor: ACCENT }]}>
            <Text style={[styles.levelValue, { color: ACCENT }]}>
              {ownLevel.toFixed(1)}
            </Text>
            <Text style={styles.levelLabel}>Eigenes Level</Text>
          </View>
        </View>

        {/* Stats Row */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalGames}</Text>
              <Text style={styles.statLabel}>Spiele</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: ACCENT }]}>{stats.totalWins}</Text>
              <Text style={styles.statLabel}>Siege</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: ACCENT }]}>{stats.winRate}%</Text>
              <Text style={styles.statLabel}>Siegquote</Text>
            </View>
          </View>
        )}

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsRow}>
            {achievements.map(a => (
              <View
                key={a.id}
                style={[styles.achievementBadge, !a.unlockedAt && styles.achievementLocked]}
              >
                <Text style={[styles.achievementEmoji, !a.unlockedAt && { opacity: 0.3 }]}>
                  {a.emoji}
                </Text>
                <Text style={[styles.achievementLabel, !a.unlockedAt && { opacity: 0.3 }]}>
                  {a.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Partner Chemistry */}
        {partnerStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Partner Chemie</Text>
            <View style={styles.partnerList}>
              {partnerStats.slice(0, 6).map(p => (
                <View key={p.name} style={styles.partnerRow}>
                  <Text style={styles.partnerName}>{p.name}</Text>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${(p.games / maxPartnerGames) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.partnerGames}>{p.games}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty state */}
        {!profile && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>👤</Text>
            <Text style={styles.emptyTitle}>Profil einrichten</Text>
            <Text style={styles.emptyText}>
              Tippe auf ✎ oben rechts um deinen Namen und dein Playtomic-Level einzutragen.
            </Text>
          </View>
        )}
      </ScrollView>

      {editOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={p => {
            setProfile(p);
            setEditOpen(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 20, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: TEXT, letterSpacing: 1 },
  accent: { color: ACCENT },
  editBtn: {
    position: 'absolute', right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  editBtnText: { fontSize: 18, color: MUTED },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 22, fontWeight: '800', color: TEXT },
  profileSince: { fontSize: 13, color: MUTED, marginTop: 2 },
  levelRow: { flexDirection: 'row', gap: 12 },
  levelCard: {
    flex: 1, borderRadius: 16, padding: 20, alignItems: 'center',
    borderWidth: 1.5,
  },
  levelValue: { fontSize: 36, fontWeight: '900' },
  levelLabel: { fontSize: 12, color: MUTED, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: BORDER,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: TEXT },
  statLabel: { fontSize: 11, color: MUTED },
  section: {
    backgroundColor: SURFACE, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 12 },
  achievementsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  achievementBadge: {
    alignItems: 'center', backgroundColor: SURFACE2, borderRadius: 12,
    padding: 10, minWidth: 72, borderWidth: 1, borderColor: BORDER,
  },
  achievementLocked: { borderColor: 'transparent' },
  achievementEmoji: { fontSize: 24 },
  achievementLabel: { fontSize: 10, color: MUTED, marginTop: 4, textAlign: 'center' },
  partnerList: { gap: 10 },
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  partnerName: { width: 70, fontSize: 13, color: TEXT },
  barBg: {
    flex: 1, height: 8, backgroundColor: SURFACE2,
    borderRadius: 4, overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 4 },
  partnerGames: { width: 24, fontSize: 12, color: MUTED, textAlign: 'right' },
  emptyCard: {
    backgroundColor: SURFACE, borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: BORDER,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20 },
});
