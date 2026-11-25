import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { LocalizedTextInput as TextInput } from '@/components/LocalizedTextInput';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { DEFAULT_LOW_CASH_THRESHOLD } from '@/ledger/lowCash';
import { formatMoney } from '@/ledger/format';
import { useTheme } from '@/theme';
import { showMessage } from '@/utils/confirm';
import { Button } from '../Button';

export function LowCashWarningModal({
  visible,
  balance,
  hasTransactions,
  threshold,
  onClose,
  onSave,
}: {
  visible: boolean;
  balance: number;
  hasTransactions: boolean;
  threshold: number;
  onClose: () => void;
  onSave: (threshold: number) => Promise<void>;
}) {
  const theme = useTheme();
  const [amount, setAmount] = useState(String(threshold));
  const [saving, setSaving] = useState(false);
  const isLow = hasTransactions && balance <= threshold;
  const parsedAmount = Number(amount.replace(',', '.'));

  const save = async () => {
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) return;
    setSaving(true);
    try {
      await onSave(parsedAmount);
      onClose();
    } catch (error) {
      showMessage(
        'Could not save warning',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.icon, { backgroundColor: `${isLow ? theme.warning : theme.success}18` }]}>
            <Ionicons
              name={isLow ? 'warning-outline' : 'notifications-outline'}
              size={24}
              color={isLow ? theme.warning : theme.success}
            />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Low-cash warning</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            {hasTransactions
              ? isLow
                ? `Your current balance is ${formatMoney(balance)}, which is at or below your warning amount.`
                : `Your current balance is ${formatMoney(balance)}. You’ll be warned when it reaches your limit.`
              : 'Add income and expenses to see when your balance reaches your warning amount.'}
          </Text>

          <Text style={[styles.label, { color: theme.text }]}>Warn me when balance is below</Text>
          <View style={[styles.inputWrap, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.currency, { color: theme.tint }]}>₱</Text>
            <TextInput
              accessibilityLabel="Low-cash warning amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              selectTextOnFocus
              style={[styles.input, { color: theme.text }]}
            />
          </View>
          {parsedAmount === 0 && (
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Enter 0 to turn off the warning.
            </Text>
          )}

          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.action} />
            <Button
              label="Save warning"
              icon="checkmark"
              loading={saving}
              disabled={!Number.isFinite(parsedAmount) || parsedAmount < 0}
              onPress={() => void save()}
              style={styles.action}
            />
          </View>
          <Text style={[styles.defaultNote, { color: theme.textSecondary }]}>
            Default warning amount: {formatMoney(DEFAULT_LOW_CASH_THRESHOLD)}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: 'rgba(0,0,0,0.38)' },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 24, padding: 20 },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  body: { fontSize: 14, lineHeight: 20, marginTop: 7 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  inputWrap: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 8 },
  currency: { fontSize: 21, fontWeight: '800' },
  input: { flex: 1, fontSize: 19, fontWeight: '700', paddingVertical: 8 },
  hint: { fontSize: 11, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 20 },
  action: { flex: 1, paddingHorizontal: 10 },
  defaultNote: { fontSize: 11, textAlign: 'center', marginTop: 13 },
});
