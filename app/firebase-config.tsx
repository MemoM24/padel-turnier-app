import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { AppHeader } from '@/components/AppHeader';
import { getFirebaseConfig, saveFirebaseConfig } from '@/lib/storage';
import { useT } from '@/hooks/use-t';

export default function FirebaseConfigScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setFirebaseConfig } = useTournament();
  const t = useT();
  const [configText, setConfigText] = useState('');

  useEffect(() => {
    getFirebaseConfig().then((cfg) => {
      if (cfg) setConfigText(JSON.stringify(cfg, null, 2));
    });
  }, []);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(configText);
      await saveFirebaseConfig(parsed);
      setFirebaseConfig(parsed);
      Alert.alert('✓', 'Firebase-Konfiguration gespeichert');
      router.back();
    } catch {
      Alert.alert('Fehler', 'Ungültiges JSON. Bitte überprüfe die Konfiguration.');
    }
  };

  const handleSkip = () => {
    setFirebaseConfig(null);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <AppHeader
        title={t('appName')}
        subtitle={t('firebaseTitle')}
        showBack
        showLanguageToggle
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('firebaseTitle')}</Text>
          <Text style={styles.cardDesc}>{t('firebaseDesc')}</Text>
          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={10}
            placeholder={t('firebasePlaceholder')}
            placeholderTextColor="#9BA1A6"
            value={configText}
            onChangeText={setConfigText}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>{t('saveConfig')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
          onPress={handleSkip}
        >
          <Text style={styles.skipBtnText}>{t('skipFirebase')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f3' },
  content: { padding: 16, paddingBottom: 20 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  cardDesc: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  textarea: {
    backgroundColor: '#f4f5f3',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#111',
    fontFamily: 'monospace',
    minHeight: 180,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.09)',
    gap: 10,
  },
  saveBtn: {
    backgroundColor: '#1a9e6f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  skipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipBtnText: { color: '#6b7280', fontSize: 14, fontWeight: '500' },
});
