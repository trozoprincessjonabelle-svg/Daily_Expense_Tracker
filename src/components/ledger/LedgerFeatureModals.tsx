import { Ionicons } from '@expo/vector-icons';
import React, { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { LocalizedTextInput as TextInput } from '@/components/LocalizedTextInput';
import { LocalizedText as Text } from '@/components/LocalizedText';
import type { UpcomingEvent, UpcomingEventInput } from '@/db/ledger';
import { formatMoney } from '@/ledger/format';
import { useTheme } from '@/theme';
import { showMessage } from '@/utils/confirm';
import { Button } from '../Button';
import { SmoothPressable } from '../SmoothPressable';

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isValidUpcomingDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year
    && parsed.getMonth() === month - 1
    && parsed.getDate() === day
    && value >= localDate();
}

function FeatureModal({
  visible,
  title,
  icon,
  iconTint,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconTint?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  const accent = iconTint ?? theme.tint;
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.header}>
            <View style={[styles.headerIcon, {
              backgroundColor: iconTint ? `${iconTint}16` : `${theme.buttonPrimary}18`,
            }]}>
              <Ionicons name={icon} size={20} color={accent} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <SmoothPressable accessibilityLabel="Close" onPress={onClose} style={[styles.close, { backgroundColor: theme.card }]}>
              <Ionicons name="close" size={21} color={theme.textSecondary} />
            </SmoothPressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
  maxLength?: number;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
        maxLength={maxLength}
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
      />
    </View>
  );
}

export function EmergencyFundModal({
  visible,
  balance,
  goal,
  regularBalance,
  onClose,
  onSave,
  onTransferTo,
  onTransferFrom,
}: {
  visible: boolean;
  balance: number;
  goal: number;
  regularBalance: number;
  onClose: () => void;
  onSave: (amount: number, goal: number | null) => Promise<void>;
  onTransferTo: (amount: number) => Promise<void>;
  onTransferFrom: (amount: number) => Promise<void>;
}) {
  const theme = useTheme();
  const [amount, setAmount] = useState('');
  const [goalDraft, setGoalDraft] = useState('');
  const [mode, setMode] = useState<'add' | 'spend'>('add');
  const [saving, setSaving] = useState(false);
  const parsedAmount = amount.trim() ? Number(amount.replace(',', '.')) : 0;
  const parsedGoal = goalDraft.trim() ? Number(goalDraft.replace(',', '.')) : null;
  const valid = mode === 'add'
    ? Number.isFinite(parsedAmount)
      && parsedAmount > 0
      && parsedAmount <= regularBalance
      && (parsedGoal === null || (Number.isFinite(parsedGoal) && parsedGoal >= 0))
      && (parsedAmount > 0 || parsedGoal !== null)
    : Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount <= balance;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      if (mode === 'add') {
        await onTransferTo(parsedAmount);
        if (parsedGoal !== null) await onSave(0, parsedGoal);
      }
      else if (mode === 'spend') {
        await onTransferFrom(parsedAmount);
      }
      setAmount('');
      setGoalDraft('');
      setMode('add');
      onClose();
    } catch (error) {
      showMessage('Could not update emergency fund', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FeatureModal visible={visible} title="Emergency fund" icon="shield-checkmark-outline" onClose={onClose}>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        Current savings: {formatMoney(balance)}{goal > 0 ? ` of ${formatMoney(goal)} goal` : ''}
      </Text>
      <View style={[styles.modeSwitch, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {([
          { id: 'add', label: 'Transfer to savings' },
          { id: 'spend', label: 'Use savings' },
        ] as const).map((option) => (
          <SmoothPressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === option.id, disabled: option.id === 'spend' && balance <= 0 }}
            disabled={option.id === 'spend' && balance <= 0}
            onPress={() => {
              setMode(option.id);
              setAmount('');
              setGoalDraft('');
            }}
            style={[
              styles.modeOption,
              mode === option.id && { backgroundColor: theme.buttonPrimary },
            ]}
          >
            <Text style={{ color: mode === option.id ? '#FFFFFF' : theme.textSecondary, fontSize: 13, fontWeight: '700' }}>
              {option.label}
            </Text>
          </SmoothPressable>
        ))}
      </View>
      <Field
        label={mode === 'add'
          ? 'Amount to transfer (PHP)'
          : 'Amount (PHP)'}
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
      {mode === 'add' && parsedAmount > regularBalance && (
        <Text style={[styles.validation, { color: theme.danger }]}>
          {`You only have ${formatMoney(regularBalance)} available in your wallet.`}
        </Text>
      )}
      {mode === 'add' ? (
        <Field
          label={`Savings goal${goal > 0 ? ` · current ${formatMoney(goal)}` : ''}`}
          value={goalDraft}
          onChangeText={setGoalDraft}
          placeholder="Optional"
          keyboardType="decimal-pad"
        />
      ) : mode === 'spend' ? (
        <>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            The amount goes back to your wallet. Emergency savings will decrease.
          </Text>
          {parsedAmount > balance && (
            <Text style={[styles.validation, { color: theme.danger }]}>
              Amount cannot exceed the available emergency fund.
            </Text>
          )}
        </>
      ) : null}
      <View style={styles.actions}>
        <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.action} />
        <Button
          label={mode === 'add' ? 'Save' : 'Transfer to wallet'}
          icon="checkmark"
          loading={saving}
          disabled={!valid}
          onPress={() => void submit()}
          style={styles.action}
        />
      </View>
    </FeatureModal>
  );
}

export function UpcomingEventModal({
  visible,
  onClose,
  onSave,
  event,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (event: UpcomingEventInput) => Promise<void>;
  event?: UpcomingEvent | null;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState(event?.title ?? '');
  const [amount, setAmount] = useState(event?.amount ? String(event.amount) : '');
  const [date, setDate] = useState(event?.event_date ?? localDate());
  const [saving, setSaving] = useState(false);
  const parsedAmount = amount.trim() ? Number(amount.replace(',', '.')) : 0;
  const trimmedTitle = title.trim();
  const validDate = isValidUpcomingDate(date);
  const valid = trimmedTitle.length > 0 && validDate && Number.isFinite(parsedAmount) && parsedAmount >= 0;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await onSave({ title: trimmedTitle, amount: parsedAmount, event_date: date });
      setTitle('');
      setAmount('');
      setDate(localDate());
      onClose();
    } catch (error) {
      showMessage('Could not add event', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FeatureModal
      visible={visible}
      title={event ? 'Edit upcoming event' : 'Add upcoming cost'}
      icon="calendar-outline"
      iconTint={theme.warning}
      onClose={onClose}
    >
      <Field label="Cost name" value={title} onChangeText={setTitle} placeholder="e.g. Birthday" />
      <Field label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      <Field label="Estimated cost (PHP)" value={amount} onChangeText={setAmount} placeholder="Optional" keyboardType="decimal-pad" />
      <Text style={[styles.helperText, { color: theme.textSecondary }]}>
        You can save the estimate even if it is higher than your current wallet balance.
      </Text>
      {!validDate && date.length > 0 && (
        <Text style={[styles.validation, { color: theme.danger }]}>Enter a valid date today or later.</Text>
      )}
      <View style={styles.actions}>
        <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.action} />
        <Button label={event ? 'Save changes' : 'Add cost'} icon={event ? 'checkmark' : 'add'} loading={saving} disabled={!valid} onPress={() => void submit()} style={styles.action} />
      </View>
    </FeatureModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.38)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28, gap: 14 },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 3 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  headerIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 19, fontWeight: '800' },
  close: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  description: { fontSize: 14, lineHeight: 20 },
  modeSwitch: { flexDirection: 'row', borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, padding: 4, gap: 5 },
  modeOption: { flex: 1, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700' },
  input: { minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, paddingHorizontal: 13, fontSize: 15 },
  helperText: { fontSize: 12, lineHeight: 17 },
  validation: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 4 },
  action: { flex: 1, paddingHorizontal: 10 },
});
