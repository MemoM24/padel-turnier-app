import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { t } from '@/i18n';

export default function JoinScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'waiting' | 'approved' | 'rejected'>('idle');

  const handleJoin = () => {
    if (!name.trim()) return;
    setStatus('waiting');
    // Firebase join logic would go here
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <AppHeader title={t('appName')} showBack showLanguageToggle />

        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🏓</Text>
            <Text style={styles.heroTitle}>{t('joinTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('joinSubtitle')}</Text>
          </View>

          {status === 'idle' && (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder={t('playerName')}
                placeholderTextColor="#9BA1A6"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleJoin}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.joinBtn,
                  !name.trim() && styles.joinBtnDisabled,
                  pressed && name.trim() && { opacity: 0.85 },
                ]}
                onPress={handleJoin}
                disabled={!name.trim()}
              >
                <Text style={styles.joinBtnText}>{t('joinButton')}</Text>
              </Pressable>
            </View>
          )}

          {status === 'waiting' && (
            <View style={styles.statusBox}>
              <Text style={styles.statusEmoji}>⏳</Text>
              <Text style={styles.statusText}>{t('waitingApproval')}</Text>
            </View>
          )}

          {status === 'approved' && (
            <View style={[styles.statusBox, styles.statusBoxGreen]}>
              <Text style={styles.statusEmoji}>✅</Text>
              <Text style={[styles.statusText, { color: '#0d6b4a' }]}>{t('approved')}</Text>
            </View>
          )}

          {status === 'rejected' && (
            <View style={[styles.statusBox, styles.statusBoxRed]}>
              <Text style={styles.statusEmoji}>❌</Text>
              <Text style={[styles.statusText, { color: '#ef4444' }]}>{t('rejected')}</Text>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f3' },
  content: {
    flex: 1,
    padding: 24,
    gap: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', gap: 8 },
  heroEmoji: { fontSize: 64 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: '#111', textAlign: 'center' },
  heroSubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
  form: { width: '100%', gap: 12 },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  joinBtn: {
    backgroundColor: '#1a9e6f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinBtnDisabled: { backgroundColor: '#E5E7EB' },
  joinBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  statusBox: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  statusBoxGreen: { backgroundColor: '#e0f5ec', borderColor: '#1a9e6f' },
  statusBoxRed: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },
  statusEmoji: { fontSize: 40 },
  statusText: { fontSize: 16, fontWeight: '600', color: '#111' },
});
