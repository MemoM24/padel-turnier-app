import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { submitJoinRequest, checkJoinStatus } from '@/lib/serverSync';
import {
  loadPlayerIdentity,
  createAndSaveIdentity,
  clearPlayerIdentity,
  validateFirstName,
  validateLastName,
  validateBirthdate,
  capitalizeName,
  PlayerIdentity,
} from '@/lib/playerIdentity';

// ─── DatePicker Component ─────────────────────────────────────────────────────

interface DatePickerProps {
  value: string; // "DD.MM.YYYY"
  onChange: (value: string) => void;
  error?: string | null;
}

function DatePickerField({ value, onChange, error }: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Parse current value
  const parts = value.split('.');
  const currentDay = parts[0] ? parseInt(parts[0], 10) : null;
  const currentMonth = parts[1] ? parseInt(parts[1], 10) : null;
  const currentYear = parts[2] ? parseInt(parts[2], 10) : null;

  const now = new Date();
  const maxYear = now.getFullYear() - 10;
  const minYear = now.getFullYear() - 90;

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const [selDay, setSelDay] = useState<number>(currentDay ?? 1);
  const [selMonth, setSelMonth] = useState<number>(currentMonth ?? 1);
  const [selYear, setSelYear] = useState<number>(currentYear ?? maxYear - 20);

  const maxDay = getDaysInMonth(selMonth, selYear);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const handleConfirm = () => {
    const d = selDay > maxDay ? maxDay : selDay;
    const formatted = `${String(d).padStart(2, '0')}.${String(selMonth).padStart(2, '0')}.${selYear}`;
    onChange(formatted);
    setShowPicker(false);
  };

  const displayValue = value || 'TT.MM.JJJJ';

  return (
    <>
      <Pressable
        style={[styles.dateButton, error ? styles.inputError : null]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[styles.dateButtonText, !value && styles.dateButtonPlaceholder]}>
          📅  {displayValue}
        </Text>
      </Pressable>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Geburtsdatum wählen</Text>
              <Pressable onPress={() => setShowPicker(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.pickerColumns}>
              {/* Day */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnLabel}>Tag</Text>
                <FlatList
                  data={days}
                  keyExtractor={(d) => String(d)}
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[styles.pickerItem, selDay === item && styles.pickerItemSelected]}
                      onPress={() => setSelDay(item)}
                    >
                      <Text style={[styles.pickerItemText, selDay === item && styles.pickerItemTextSelected]}>
                        {String(item).padStart(2, '0')}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>

              {/* Month */}
              <View style={[styles.pickerColumn, { flex: 2 }]}>
                <Text style={styles.pickerColumnLabel}>Monat</Text>
                <FlatList
                  data={months}
                  keyExtractor={(_, i) => String(i)}
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <Pressable
                      style={[styles.pickerItem, selMonth === index + 1 && styles.pickerItemSelected]}
                      onPress={() => setSelMonth(index + 1)}
                    >
                      <Text style={[styles.pickerItemText, selMonth === index + 1 && styles.pickerItemTextSelected]}>
                        {item}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>

              {/* Year */}
              <View style={[styles.pickerColumn, { flex: 1.5 }]}>
                <Text style={styles.pickerColumnLabel}>Jahr</Text>
                <FlatList
                  data={years}
                  keyExtractor={(y) => String(y)}
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[styles.pickerItem, selYear === item && styles.pickerItemSelected]}
                      onPress={() => setSelYear(item)}
                    >
                      <Text style={[styles.pickerItemText, selYear === item && styles.pickerItemTextSelected]}>
                        {item}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            </View>

            <Pressable style={styles.pickerConfirm} onPress={handleConfirm}>
              <Text style={styles.pickerConfirmText}>Bestätigen</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function JoinScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tournamentId?: string }>();
  const tournamentId = params.tournamentId ?? '';

  // Identity state
  const [identity, setIdentity] = useState<PlayerIdentity | null>(null);
  const [identityLoading, setIdentityLoading] = useState(true);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [birthdateError, setBirthdateError] = useState<string | null>(null);

  // Join flow state
  const [status, setStatus] = useState<'idle' | 'submitting' | 'waiting' | 'approved' | 'rejected' | 'error'>('idle');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved identity on mount
  useEffect(() => {
    loadPlayerIdentity().then((saved) => {
      setIdentity(saved);
      setIdentityLoading(false);
    });
  }, []);

  // Poll for status updates when waiting
  useEffect(() => {
    if (status === 'waiting' && requestId && tournamentId) {
      pollRef.current = setInterval(async () => {
        const result = await checkJoinStatus(tournamentId, requestId);
        if (result?.status === 'approved') {
          setStatus('approved');
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (result?.status === 'rejected') {
          setStatus('rejected');
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, requestId, tournamentId]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateAll = (): boolean => {
    const fe = validateFirstName(firstName);
    const le = validateLastName(lastName);
    const be = validateBirthdate(birthdate);
    setFirstNameError(fe);
    setLastNameError(le);
    setBirthdateError(be);
    return !fe && !le && !be;
  };

  // ── Submit join request ─────────────────────────────────────────────────────
  const handleJoin = async (existingIdentity?: PlayerIdentity) => {
    let ident = existingIdentity ?? identity;

    if (!ident) {
      // New identity: validate and create
      if (!validateAll()) return;
      setStatus('submitting');
      ident = await createAndSaveIdentity(firstName, lastName, birthdate);
      setIdentity(ident);
    } else {
      setStatus('submitting');
    }

    setDisplayName(ident.displayName);

    const result = await submitJoinRequest(tournamentId, ident.displayName);
    if (!result) {
      setStatus('error');
      return;
    }
    setRequestId(result.requestId);
    if (result.status === 'approved') {
      setStatus('approved');
    } else if (result.status === 'rejected') {
      setStatus('rejected');
    } else {
      setStatus('waiting');
    }
  };

  const handleReset = async () => {
    await clearPlayerIdentity();
    setIdentity(null);
    setStatus('idle');
    setRequestId(null);
    setFirstName('');
    setLastName('');
    setBirthdate('');
    setFirstNameError(null);
    setLastNameError(null);
    setBirthdateError(null);
  };

  const handleRetry = () => {
    setStatus('idle');
    setRequestId(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (identityLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1a9e6f" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <AppHeader title="PDL1" showBack showLanguageToggle />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🎾</Text>
            <Text style={styles.heroTitle}>Turnier beitreten</Text>
            <Text style={styles.heroSubtitle}>
              Gib deine Daten ein, um dem Turnier beizutreten.
            </Text>
          </View>

          {/* ── Returning player: identity recognised ── */}
          {identity && status === 'idle' && (
            <View style={styles.recognisedBox}>
              <Text style={styles.recognisedEmoji}>👋</Text>
              <Text style={styles.recognisedTitle}>Willkommen zurück!</Text>
              <Text style={styles.recognisedName}>{identity.displayName}</Text>
              <Text style={styles.recognisedSub}>
                Wir haben dich wiedererkannt. Tippe auf "Beitreten" um fortzufahren.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.joinBtn, pressed && { opacity: 0.85 }]}
                onPress={() => handleJoin(identity)}
              >
                <Text style={styles.joinBtnText}>Beitreten</Text>
              </Pressable>
              <Pressable style={styles.notMeBtn} onPress={handleReset}>
                <Text style={styles.notMeBtnText}>Nicht ich – andere Person</Text>
              </Pressable>
            </View>
          )}

          {/* ── New player: registration form ── */}
          {!identity && status === 'idle' && (
            <View style={styles.form}>
              {/* Vorname */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Vorname *</Text>
                <TextInput
                  style={[styles.input, firstNameError ? styles.inputError : null]}
                  placeholder="z.B. Max"
                  placeholderTextColor="#9BA1A6"
                  value={firstName}
                  onChangeText={(t) => {
                    const filtered = t.replace(/[^A-Za-zÄäÖöÜüß\- ]/g, '');
                    setFirstName(capitalizeName(filtered));
                    setFirstNameError(null);
                  }}
                  autoCapitalize="words"
                  maxLength={20}
                  returnKeyType="next"
                />
                {firstNameError ? (
                  <Text style={styles.fieldError}>{firstNameError}</Text>
                ) : (
                  <Text style={styles.fieldHint}>
                    Bitte deinen echten Vornamen eingeben, damit wir dich wiedererkennen.
                  </Text>
                )}
              </View>

              {/* Nachname */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nachname *</Text>
                <TextInput
                  style={[styles.input, lastNameError ? styles.inputError : null]}
                  placeholder="z.B. Mustermann"
                  placeholderTextColor="#9BA1A6"
                  value={lastName}
                  onChangeText={(t) => {
                    const filtered = t.replace(/[^A-Za-zÄäÖöÜüß\- ]/g, '');
                    setLastName(capitalizeName(filtered));
                    setLastNameError(null);
                  }}
                  autoCapitalize="words"
                  maxLength={20}
                  returnKeyType="done"
                />
                {lastNameError ? (
                  <Text style={styles.fieldError}>{lastNameError}</Text>
                ) : (
                  <Text style={styles.fieldHint}>Wie er auf deinem Ausweis steht.</Text>
                )}
              </View>

              {/* Geburtsdatum */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Geburtsdatum *</Text>
                <DatePickerField
                  value={birthdate}
                  onChange={(v) => {
                    setBirthdate(v);
                    setBirthdateError(null);
                  }}
                  error={birthdateError}
                />
                {birthdateError ? (
                  <Text style={styles.fieldError}>{birthdateError}</Text>
                ) : (
                  <Text style={styles.fieldHint}>
                    Wird nur zur eindeutigen Identifikation genutzt, nicht gespeichert oder weitergegeben.
                  </Text>
                )}
              </View>

              <Pressable
                style={({ pressed }) => [styles.joinBtn, pressed && { opacity: 0.85 }]}
                onPress={() => handleJoin()}
              >
                <Text style={styles.joinBtnText}>Beitreten</Text>
              </Pressable>
            </View>
          )}

          {/* ── Status views ── */}
          {status === 'submitting' && (
            <View style={styles.statusBox}>
              <ActivityIndicator size="large" color="#1a9e6f" />
              <Text style={styles.statusText}>Anfrage wird gesendet…</Text>
            </View>
          )}

          {status === 'waiting' && (
            <View style={styles.statusBox}>
              <Text style={styles.statusEmoji}>⏳</Text>
              <Text style={styles.statusText}>Warte auf Bestätigung</Text>
              <Text style={styles.statusSubtext}>
                Der Admin muss deine Anfrage bestätigen. Wird automatisch aktualisiert…
              </Text>
              <ActivityIndicator size="small" color="#6b7280" style={{ marginTop: 8 }} />
            </View>
          )}

          {status === 'approved' && (
            <View style={[styles.statusBox, styles.statusBoxGreen]}>
              <Text style={styles.statusEmoji}>✅</Text>
              <Text style={[styles.statusText, { color: '#0d6b4a' }]}>Zugelassen!</Text>
              <Text style={[styles.statusSubtext, { color: '#166534' }]}>
                {displayName} – Du kannst jetzt mitspielen!
              </Text>
            </View>
          )}

          {status === 'rejected' && (
            <View style={[styles.statusBox, styles.statusBoxRed]}>
              <Text style={styles.statusEmoji}>❌</Text>
              <Text style={[styles.statusText, { color: '#ef4444' }]}>Abgelehnt</Text>
              <Text style={styles.statusSubtext}>
                Deine Anfrage wurde vom Admin abgelehnt.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
                onPress={handleRetry}
              >
                <Text style={styles.retryBtnText}>Erneut versuchen</Text>
              </Pressable>
            </View>
          )}

          {status === 'error' && (
            <View style={[styles.statusBox, styles.statusBoxRed]}>
              <Text style={styles.statusEmoji}>⚠️</Text>
              <Text style={[styles.statusText, { color: '#ef4444' }]}>Verbindungsfehler</Text>
              <Text style={styles.statusSubtext}>Bitte Internetverbindung prüfen.</Text>
              <Pressable
                style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
                onPress={handleRetry}
              >
                <Text style={styles.retryBtnText}>Erneut versuchen</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f3' },
  content: {
    padding: 24,
    gap: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  hero: { alignItems: 'center', gap: 8, width: '100%' },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: '#111', textAlign: 'center' },
  heroSubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center' },

  // Returning player
  recognisedBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  recognisedEmoji: { fontSize: 40 },
  recognisedTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  recognisedName: { fontSize: 22, fontWeight: '800', color: '#1a9e6f' },
  recognisedSub: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  notMeBtn: { marginTop: 4, paddingVertical: 8, paddingHorizontal: 16 },
  notMeBtnText: { fontSize: 13, color: '#6b7280', textDecorationLine: 'underline' },

  // Form
  form: { width: '100%', gap: 16 },
  fieldGroup: { width: '100%', gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  inputError: { borderColor: '#ef4444', borderWidth: 1.5 },
  fieldHint: { fontSize: 12, color: '#9ca3af', lineHeight: 17 },
  fieldError: { fontSize: 12, color: '#ef4444', fontWeight: '500' },

  // DatePicker button
  dateButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  dateButtonText: { fontSize: 16, color: '#111' },
  dateButtonPlaceholder: { color: '#9BA1A6' },

  // DatePicker modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  pickerClose: { fontSize: 18, color: '#6b7280', fontWeight: '600' },
  pickerColumns: { flexDirection: 'row', gap: 8, height: 200 },
  pickerColumn: { flex: 1, gap: 4 },
  pickerColumnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  pickerScroll: { flex: 1 },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerItemSelected: { backgroundColor: '#e0f5ec' },
  pickerItemText: { fontSize: 15, color: '#374151' },
  pickerItemTextSelected: { color: '#1a9e6f', fontWeight: '700' },
  pickerConfirm: {
    marginTop: 16,
    backgroundColor: '#1a9e6f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pickerConfirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Join button
  joinBtn: {
    width: '100%',
    backgroundColor: '#1a9e6f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  joinBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  // Status boxes
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
  statusText: { fontSize: 16, fontWeight: '600', color: '#111', textAlign: 'center' },
  statusSubtext: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  retryBtn: {
    marginTop: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
