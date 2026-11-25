import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { LocalizedTextInput as TextInput } from '@/components/LocalizedTextInput';
import { SmoothPressable } from '@/components/SmoothPressable';
import {
  addSavingsGoalContribution,
  createSavingsGoal,
  deleteSavingsGoal,
  listSavingsGoals,
  SavingsGoalBalanceConfirmationRequiredError,
  type SavingsGoal,
} from '@/db/savingsGoals';
import { balanceThroughDate, formatMoney } from '@/ledger/format';
import { listTransactions } from '@/db/ledger';
import { useCurrentDateKey } from '@/hooks/useCurrentDate';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';
import { confirmAction, showMessage } from '@/utils/confirm';

export function SavingsGoalsSection() {
  const theme = useTheme();
  const { settings } = useSettings();
  const todayKey = useCurrentDateKey();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalGoal, setModalGoal] = useState<SavingsGoal | null | undefined>();
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [nextGoals, transactions] = await Promise.all([
        listSavingsGoals(),
        listTransactions(),
      ]);
      setGoals(nextGoals);
      setAvailableBalance(balanceThroughDate(transactions, todayKey));
    } catch (error) {
      showMessage('Unable to load savings goals', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [todayKey]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void refresh();
    }, [refresh])
  );

  const saveGoal = async (name: string, amount: number) => {
    setSaving(true);
    try {
      await createSavingsGoal({ name, target_amount: amount });
      setModalGoal(undefined);
      await refresh();
    } catch (error) {
      showMessage('Could not create savings goal', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveContribution = async (
    goal: SavingsGoal,
    amount: number,
    confirmBelowZero = false
  ) => {
    setSaving(true);
    try {
      await addSavingsGoalContribution(goal.id, amount, confirmBelowZero);
      setModalGoal(undefined);
      await refresh();
    } catch (error) {
      if (error instanceof SavingsGoalBalanceConfirmationRequiredError) {
        confirmAction(
          'Available balance will go below zero',
          settings.language === 'tl'
            ? `Mayroon kang ${formatMoney(error.availableBalance)} na puwedeng gastusin. Kapag nag-ipon ka ng ${formatMoney(amount)}, magiging ${formatMoney(error.availableBalance - amount)} ang balanse. Itutuloy?`
            : `You have ${formatMoney(error.availableBalance)} available. Saving ${formatMoney(amount)} will bring it to ${formatMoney(error.availableBalance - amount)}. Continue?`,
          'Continue',
          () => saveContribution(goal, amount, true)
        );
        return;
      }
      showMessage('Could not add savings', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const removeGoal = async (goal: SavingsGoal) => {
    try {
      await deleteSavingsGoal(goal.id);
      await refresh();
    } catch (error) {
      showMessage('Could not delete savings goal', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={[styles.headingTitle, { color: theme.text }]}>Savings goals</Text>
        <SmoothPressable
          accessibilityRole="button"
          accessibilityLabel="Create a savings goal"
          onPress={() => setModalGoal(null)}
          style={styles.newButton}
        >
          <Ionicons name="add" size={16} color={theme.tint} />
          <Text style={[styles.newLabel, { color: theme.tint }]}>New</Text>
        </SmoothPressable>
      </View>

      <View style={[styles.goalsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {loading ? (
          <ActivityIndicator color={theme.tint} />
        ) : goals.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.targetIcon, { backgroundColor: `${theme.tint}16` }]}>
              <Ionicons name="radio-button-on-outline" size={25} color={theme.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No savings goals yet</Text>
            <Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>
              Set a target for something you want to save for. Add to it as you go.
            </Text>
          </View>
        ) : (
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.goalList}
          >
            {goals.map((goal) => {
              const progress = Math.min(goal.saved_amount / goal.target_amount, 1);
              const completed = goal.saved_amount >= goal.target_amount;
              return (
                <View key={goal.id} style={[styles.goalRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.goalHeading}>
                    <View style={[styles.goalIcon, { backgroundColor: `${theme.tint}16` }]}>
                      <Ionicons name={completed ? 'checkmark-circle' : 'radio-button-on-outline'} size={19} color={theme.tint} />
                    </View>
                    <Text translate={false} numberOfLines={1} style={[styles.goalName, { color: theme.text }]}>{goal.name}</Text>
                    <SmoothPressable
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${goal.name} savings goal`}
                      onPress={() => confirmAction(
                        'Delete savings goal?',
                        settings.language === 'tl'
                          ? goal.saved_amount > 0
                            ? `Burahin ang ${goal.name}? Ibabalik sa puwedeng gastusin ang ${formatMoney(goal.saved_amount)}.`
                            : `Burahin ang layunin sa pag-iipon na ${goal.name}?`
                          : goal.saved_amount > 0
                            ? `Delete ${goal.name}? ${formatMoney(goal.saved_amount)} will be returned to your available balance.`
                            : `Delete ${goal.name} savings goal?`,
                        'Delete',
                        () => removeGoal(goal)
                      )}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={17} color={theme.danger} />
                    </SmoothPressable>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={[styles.amountText, { color: theme.text }]}>
                      {formatMoney(goal.saved_amount)} <Text style={{ color: theme.textSecondary }}>of {formatMoney(goal.target_amount)}</Text>
                    </Text>
                    <Text style={[styles.percent, { color: completed ? theme.success : theme.tint }]}>
                      {completed ? 'Goal reached' : `${Math.round(progress * 100)}%`}
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.tint }]} />
                  </View>
                  {!completed && (
                    <SmoothPressable
                      accessibilityRole="button"
                      onPress={() => setModalGoal(goal)}
                      style={[styles.addSavingsButton, { backgroundColor: `${theme.tint}18` }]}
                    >
                      <Ionicons name="add" size={15} color={theme.tint} />
                      <Text style={[styles.addSavingsLabel, { color: theme.tint }]}>Add savings</Text>
                    </SmoothPressable>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      <SavingsGoalModal
        key={modalGoal?.id ?? (modalGoal === null ? 'new' : 'closed')}
        goal={modalGoal ?? null}
        availableBalance={availableBalance}
        visible={modalGoal !== undefined}
        saving={saving}
        onClose={() => setModalGoal(undefined)}
        onCreate={saveGoal}
        onContribute={saveContribution}
      />
    </View>
  );
}

function SavingsGoalModal({
  visible,
  goal,
  availableBalance,
  saving,
  onClose,
  onCreate,
  onContribute,
}: {
  visible: boolean;
  goal: SavingsGoal | null;
  availableBalance: number;
  saving: boolean;
  onClose: () => void;
  onCreate: (name: string, amount: number) => Promise<void>;
  onContribute: (goal: SavingsGoal, amount: number) => Promise<void>;
}) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const parsedAmount = amount.trim() ? Number(amount.replace(',', '.')) : 0;
  const trimmedName = name.trim();
  const valid = goal
    ? Number.isFinite(parsedAmount)
      && parsedAmount > 0
      && parsedAmount <= goal.target_amount - goal.saved_amount
    : trimmedName.length > 0
      && trimmedName.length <= 80
      && Number.isFinite(parsedAmount)
      && parsedAmount > 0
      && parsedAmount <= 1_000_000_000;

  const pressAmountKey = (key: string) => {
    setAmount((current) => {
      if (key === 'backspace') return current.slice(0, -1);
      if (key === '.') {
        if (current.includes('.')) return current;
        return current ? `${current}.` : '0.';
      }
      const [whole, fraction] = current.split('.');
      if (fraction !== undefined && fraction.length >= 2) return current;
      if ((whole ?? '').length >= 10) return current;
      return current === '0' ? key : `${current}${key}`;
    });
  };

  const submit = () => {
    if (!valid) return;
    if (goal) void onContribute(goal, parsedAmount);
    else void onCreate(trimmedName, parsedAmount);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{goal ? 'Add savings' : 'New savings goal'}</Text>
            <SmoothPressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.card }]}>
              <Ionicons name="close" size={21} color={theme.textSecondary} />
            </SmoothPressable>
          </View>
          {goal ? (
            <>
              <Text translate={false} style={[styles.modalDescription, { color: theme.textSecondary }]}>
                {goal.name} · {formatMoney(goal.target_amount - goal.saved_amount)}{' '}
                <Text>remaining</Text>
              </Text>
              <View style={styles.balanceContext}>
                <Text style={[styles.balanceContextLabel, { color: theme.textSecondary }]}>Available Balance</Text>
                <Text style={[styles.balanceContextAmount, { color: availableBalance < 0 ? theme.danger : theme.text }]}>
                  {formatMoney(availableBalance)}
                </Text>
              </View>
              <View style={styles.amountDisplay}>
                <Text
                  accessibilityLiveRegion="polite"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.amountDisplayText, { color: theme.text }]}
                >
                  {formatMoney(parsedAmount)}
                </Text>
              </View>
              <View style={styles.amountKeypad}>
                {[
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                  ['.', '0', 'backspace'],
                ].map((row, rowIndex) => (
                  <View key={`amount-row-${rowIndex}`} style={styles.amountKeyRow}>
                    {row.map((key) => (
                      <SmoothPressable
                        key={key}
                        accessibilityRole="button"
                        accessibilityLabel={key === 'backspace' ? 'Delete last digit' : key}
                        onPress={() => pressAmountKey(key)}
                        style={[styles.amountKey, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                      >
                        {key === 'backspace' ? (
                          <Ionicons name="backspace-outline" size={22} color={theme.text} />
                        ) : (
                          <Text style={[styles.amountKeyText, { color: theme.text }]}>{key}</Text>
                        )}
                      </SmoothPressable>
                    ))}
                  </View>
                ))}
              </View>
              {parsedAmount > goal.target_amount - goal.saved_amount && (
                <Text style={[styles.amountError, { color: theme.danger }]}>
                  Amount cannot exceed the remaining goal amount.
                </Text>
              )}
              <SmoothPressable
                accessibilityRole="button"
                disabled={!valid || saving}
                onPress={submit}
                style={[styles.addAmountButton, { backgroundColor: theme.tint, opacity: valid && !saving ? 1 : 0.55 }]}
              >
                {saving
                  ? <ActivityIndicator color={theme.background} />
                  : <Text style={[styles.addAmountLabel, { color: theme.background }]}>Add</Text>}
              </SmoothPressable>
            </>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Goal name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. New laptop"
                  placeholderTextColor={theme.textSecondary}
                  maxLength={80}
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                />
              </View>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Target amount (PHP)</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                />
              </View>
              <SmoothPressable
                accessibilityRole="button"
                disabled={!valid || saving}
                onPress={submit}
                style={[styles.createButton, { backgroundColor: theme.buttonPrimary, opacity: valid && !saving ? 1 : 0.55 }]}
              >
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.createLabel}>Create goal</Text>}
              </SmoothPressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  headingTitle: { fontSize: 16, fontWeight: '700' },
  newButton: { flexDirection: 'row', alignItems: 'center', gap: 1, paddingHorizontal: 5, paddingVertical: 4 },
  newLabel: { fontSize: 13, fontWeight: '600' },
  goalsCard: { minHeight: 190, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, justifyContent: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 18 },
  targetIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  emptyCopy: { maxWidth: 240, fontSize: 12, textAlign: 'center', lineHeight: 17 },
  goalList: { maxHeight: 360 },
  goalRow: { gap: 9, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  goalHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  goalName: { flex: 1, fontSize: 14, fontWeight: '700' },
  deleteButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountText: { fontSize: 12, fontWeight: '700' },
  percent: { fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  addSavingsButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 5 },
  addSavingsLabel: { fontSize: 14, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 28, gap: 14 },
  handle: { width: 34, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 2 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  closeButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  modalDescription: { fontSize: 12.5 },
  balanceContext: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -7 },
  balanceContextLabel: { fontSize: 12 },
  balanceContextAmount: { fontSize: 12, fontWeight: '700' },
  amountDisplay: { minHeight: 55, alignItems: 'center', justifyContent: 'center', marginTop: -4 },
  amountDisplayText: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  amountKeypad: { gap: 7 },
  amountKeyRow: { flexDirection: 'row', gap: 7 },
  amountKey: { flex: 1, height: 45, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  amountKeyText: { fontSize: 20, fontWeight: '700' },
  amountError: { fontSize: 12, textAlign: 'center' },
  addAmountButton: { height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: -2 },
  addAmountLabel: { fontSize: 14, fontWeight: '800' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  input: { height: 44, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 14 },
  createButton: { height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  createLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
