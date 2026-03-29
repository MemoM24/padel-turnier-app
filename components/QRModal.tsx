import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useT } from '@/hooks/use-t';
import { getViewerUrl } from '@/lib/serverSync';

interface QRModalProps {
  visible: boolean;
  tournamentId: string;
  tournamentName: string;
  onClose: () => void;
}

export function QRModal({ visible, tournamentId, tournamentName, onClose }: QRModalProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  // Public browser URL – no app needed, opens in any browser
  const viewerUrl = getViewerUrl(tournamentId);

  const handleCopyUrl = async () => {
    try {
      await Clipboard.setStringAsync(viewerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      Alert.alert('', 'Kopieren nicht möglich');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>📱 Live-Ansicht teilen</Text>
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
              📷 QR-Code scannen – Tabelle &amp; Ergebnisse im Browser anzeigen, ohne App-Download.
            </Text>
          </View>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCode
              value={viewerUrl || `pdl1://view?id=${tournamentId}`}
              size={200}
              color="#111111"
              backgroundColor="#ffffff"
            />
          </View>

          {/* URL display */}
          <Pressable
            style={({ pressed }) => [styles.urlBox, pressed && { opacity: 0.7 }]}
            onPress={handleCopyUrl}
          >
            <Text style={styles.urlLabel}>Live-URL</Text>
            <Text style={styles.urlText} numberOfLines={2}>{viewerUrl || `pdl1://view?id=${tournamentId}`}</Text>
            <Text style={styles.urlHint}>Tippen zum Kopieren</Text>
          </Pressable>

          {/* Copy Button */}
          <Pressable
            style={({ pressed }) => [
              styles.copyBtn,
              copied && styles.copyBtnDone,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleCopyUrl}
          >
            <Text style={styles.copyBtnText}>
              {copied ? '✓ URL kopiert!' : '📋 URL kopieren'}
            </Text>
          </Pressable>
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
    gap: 14,
    alignItems: 'center',
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
    marginTop: -8,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  infoText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 19,
  },
  qrContainer: {
    padding: 16,
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
  urlBox: {
    width: '100%',
    backgroundColor: '#f4f5f3',
    borderRadius: 10,
    padding: 12,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
  },
  urlLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urlText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
  },
  urlHint: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  copyBtn: {
    width: '100%',
    backgroundColor: '#1a9e6f',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  copyBtnDone: {
    backgroundColor: '#0d6b4a',
  },
  copyBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
