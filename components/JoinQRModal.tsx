import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useT } from '@/hooks/use-t';
import { getJoinUrl, listPendingJoinRequests, decideJoinRequest } from '@/lib/serverSync';

interface JoinQRModalProps {
  visible: boolean;
  tournamentId: string;
  tournamentName: string;
  onClose: () => void;
  onPlayerApproved: (name: string) => void;
}

interface PendingRequest {
  id: string;
  name: string;
  timestamp: number;
}

export function JoinQRModal({
  visible,
  tournamentId,
  tournamentName,
  onClose,
  onPlayerApproved,
}: JoinQRModalProps) {
  const t = useT();
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [deciding, setDeciding] = useState<string | null>(null);

  const joinUrl = getJoinUrl(tournamentId);

  const fetchPending = useCallback(async () => {
    if (!tournamentId) return;
    const requests = await listPendingJoinRequests(tournamentId);
    setPending(requests);
  }, [tournamentId]);

  // Poll for pending requests every 3 seconds while modal is open
  useEffect(() => {
    if (!visible) return;
    fetchPending();
    const interval = setInterval(fetchPending, 3000);
    return () => clearInterval(interval);
  }, [visible, fetchPending]);

  const handleDecide = async (requestId: string, name: string, decision: 'approved' | 'rejected') => {
    setDeciding(requestId);
    const ok = await decideJoinRequest(tournamentId, requestId, decision);
    if (ok && decision === 'approved') {
      onPlayerApproved(name);
      Alert.alert('', `${name} wurde hinzugefügt!`);
    }
    // Remove from local list immediately
    setPending((prev) => prev.filter((r) => r.id !== requestId));
    setDeciding(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🎾 Spieler einladen</Text>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
              onPress={onClose}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle} numberOfLines={1}>{tournamentName}</Text>

          {/* Info text */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📷 QR-Code scannen → Name eingeben → Admin genehmigt
            </Text>
          </View>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCode
              value={joinUrl}
              size={180}
              color="#111111"
              backgroundColor="#ffffff"
            />
          </View>

          {/* Pending Approvals */}
          <View style={styles.pendingSection}>
            <View style={styles.pendingHeader}>
              <Text style={styles.pendingTitle}>{t('pendingPlayers')}</Text>
              {pending.length > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{pending.length}</Text>
                </View>
              )}
            </View>

            {pending.length === 0 ? (
              <View style={styles.emptyPending}>
                <Text style={styles.emptyPendingText}>Keine ausstehenden Anfragen</Text>
              </View>
            ) : (
              <FlatList
                data={pending}
                keyExtractor={(item) => item.id}
                style={styles.pendingList}
                renderItem={({ item }) => (
                  <View style={styles.pendingRow}>
                    <View style={styles.pendingAvatar}>
                      <Text style={styles.pendingAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.pendingName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.pendingActions}>
                      {deciding === item.id ? (
                        <ActivityIndicator size="small" color="#1a9e6f" />
                      ) : (
                        <>
                          <Pressable
                            style={({ pressed }) => [styles.approveBtn, pressed && { opacity: 0.7 }]}
                            onPress={() => handleDecide(item.id, item.name, 'approved')}
                          >
                            <Text style={styles.approveBtnText}>✓</Text>
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.7 }]}
                            onPress={() => handleDecide(item.id, item.name, 'rejected')}
                          >
                            <Text style={styles.rejectBtnText}>✕</Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
    alignItems: 'center',
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f5f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    alignSelf: 'flex-start',
    marginTop: -4,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  infoText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 19,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pendingSection: {
    width: '100%',
    gap: 8,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  pendingBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyPending: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyPendingText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  pendingList: {
    width: '100%',
    maxHeight: 180,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 10,
  },
  pendingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a9e6f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  pendingName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a9e6f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
