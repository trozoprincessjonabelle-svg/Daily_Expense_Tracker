import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { formatMoney } from '@/ledger/format';
import { useTheme } from '@/theme';
import { Button } from '../Button';

export function CriticalLowCashModal({
  visible,
  remaining,
  percent,
  onClose,
}: {
  visible: boolean;
  remaining: number;
  percent: number;
  onClose: () => void;
}) {
  const theme = useTheme();
  const playedForVisible = useRef(false);
  const alertColor = theme.warning;

  useEffect(() => {
    if (!visible) {
      playedForVisible.current = false;
      return;
    }
    if (playedForVisible.current) return;
    playedForVisible.current = true;
    let player: ReturnType<typeof createAudioPlayer> | null = null;
    let disposed = false;
    void (async () => {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      if (disposed) return;
      player = createAudioPlayer(require('../../../assets/sounds/low-cash.wav'));
      player.play();
    })().catch(() => {
      player?.remove();
    });
    return () => {
      disposed = true;
      player?.remove();
    };
  }, [visible]);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.warningBorder }]}>
          <View style={[styles.icon, { backgroundColor: theme.warningSurface }]}>
            <Ionicons name="warning" size={25} color={alertColor} />
          </View>
          <Text style={[styles.eyebrow, { color: alertColor }]}>LOW-CASH ALERT</Text>
          <Text style={[styles.title, { color: theme.text }]}>Money is running very low</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            You have {formatMoney(remaining)} left today ({percent}% of today’s income). Check today’s remaining expenses.
          </Text>
          <Button label="Got it" icon="checkmark" onPress={onClose} style={styles.button} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(20, 16, 20, 0.42)' },
  card: { width: '100%', maxWidth: 360, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 22, alignItems: 'center' },
  icon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 7 },
  body: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  button: { alignSelf: 'stretch', marginTop: 20 },
});
