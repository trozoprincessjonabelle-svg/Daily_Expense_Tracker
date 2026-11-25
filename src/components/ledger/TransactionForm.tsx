import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { LocalizedTextInput as TextInput } from '@/components/LocalizedTextInput';
import { LocalizedText as Text } from '@/components/LocalizedText';
import type { LedgerTransaction, TransactionInput, TransactionType } from '@/db/ledger';
import { showMessage } from '@/utils/confirm';
import { addCustomEWallet, DEFAULT_EWALLETS, loadCustomEWallets } from '@/ledger/ewallets';
import { Button } from '../Button';
import { SmoothPressable } from '../SmoothPressable';
import { useTheme } from '@/theme';
import { useSettings } from '@/settings/SettingsContext';
import { formatDate } from '@/ledger/format';

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Rent/Boarding',
  'Bills',
  'School supplies',
  'Projects & printing',
  'Tuition & school fees',
  'Load & data',
  'Personal care',
  'Entertainment',
  'Savings',
  'Other',
  'Custom',
];
const INCOME_CATEGORIES = ['Baon', 'Allowance', 'Part-time job', 'E-wallet', 'Other'];
const ADD_MONEY_CATEGORIES = ['Cash', 'E-wallet', 'Emergency fund'];
const MAX_AMOUNT = 1_000_000_000;

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function dateFromKey(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date();
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : new Date();
}

function dateToKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function TransactionForm({
  visible,
  transaction,
  lockedType,
  presentation = 'modal',
  closeOnSave = true,
  showCloseButton = true,
  allowEmergencyFund = false,
  regularBalance,
  emergencyFundBalance,
  onClose,
  onSave,
}: {
  visible: boolean;
  transaction: LedgerTransaction | null;
  lockedType?: TransactionType;
  presentation?: 'modal' | 'inline';
  closeOnSave?: boolean;
  showCloseButton?: boolean;
  allowEmergencyFund?: boolean;
  regularBalance?: number;
  emergencyFundBalance?: number;
  onClose: () => void;
  onSave: (
    input: TransactionInput,
    id?: string,
    paymentSource?: 'regular' | 'emergency'
  ) => Promise<void>;
}) {
  const theme = useTheme();
  const { settings } = useSettings();
  const [type, setType] = useState<TransactionType>(transaction?.type ?? lockedType ?? 'income');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [category, setCategory] = useState(
    transaction?.type === 'expense' && transaction.category && !EXPENSE_CATEGORIES.includes(transaction.category)
      ? 'Custom'
      : transaction?.category ?? ''
  );
  const [paymentSource, setPaymentSource] = useState<'regular' | 'emergency'>('regular');
  const [date, setDate] = useState(transaction?.transaction_date ?? localDate());
  const [note, setNote] = useState(transaction?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [customWallets, setCustomWallets] = useState<string[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [walletNameDraft, setWalletNameDraft] = useState('');
  const [addingWallet, setAddingWallet] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [customCategory, setCustomCategory] = useState(
    transaction?.type === 'expense' && transaction.category && !EXPENSE_CATEGORIES.includes(transaction.category)
      ? transaction.category
      : ''
  );
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);

  const categories = type === 'expense'
    ? EXPENSE_CATEGORIES
    : lockedType === 'income'
      ? ADD_MONEY_CATEGORIES
      : INCOME_CATEGORIES;
  const eWalletOptions = [...DEFAULT_EWALLETS, ...customWallets];
  const parsedAmount = Number(amount.replace(',', '.'));
  const amountIsTooLarge = Number.isFinite(parsedAmount) && parsedAmount > MAX_AMOUNT;
  const exceedsRegularBalance = type === 'expense'
    && paymentSource === 'regular'
    && regularBalance !== undefined
    && parsedAmount > regularBalance;
  const exceedsEmergencyBalance = type === 'expense'
    && paymentSource === 'emergency'
    && emergencyFundBalance !== undefined
    && parsedAmount > emergencyFundBalance;
  const canSubmit =
    amount.trim().length > 0 &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    !amountIsTooLarge &&
    category.trim().length > 0 &&
    (category !== 'Custom' || customCategory.trim().length > 0) &&
    !exceedsRegularBalance &&
    !exceedsEmergencyBalance;

  React.useEffect(() => {
    let active = true;
    loadCustomEWallets()
      .then((wallets) => {
        if (!active) return;
        setCustomWallets(wallets);
        if (transaction?.category === 'E-wallet') {
          const [walletName, ...descriptionParts] = transaction.note.split(' · ');
          if ([...DEFAULT_EWALLETS, ...wallets].includes(walletName)) {
            setSelectedWallet(walletName);
            setNote(descriptionParts.join(' · '));
          }
        }
      })
      .catch((error: unknown) => showMessage(
        'Unable to load e-wallet choices',
        error instanceof Error ? error.message : 'Please try again.'
      ))
      .finally(() => { if (active) setLoadingWallets(false); });
    return () => { active = false; };
  }, [transaction]);

  const chooseType = (nextType: TransactionType) => {
    if (nextType === type) return;
    setType(nextType);
    setCategory('');
    setSelectedWallet(null);
    setPaymentSource('regular');
  };

  const addWallet = async () => {
    if (addingWallet) return;
    setAddingWallet(true);
    try {
      const updatedWallets = await addCustomEWallet(walletNameDraft);
      const addedWallet = walletNameDraft.trim();
      setCustomWallets(updatedWallets);
      setSelectedWallet(addedWallet);
      setWalletNameDraft('');
      setShowAddWallet(false);
    } catch (error) {
      showMessage(
        'Could not add e-wallet',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setAddingWallet(false);
    }
  };

  const openDatePicker = () => {
    DateTimePickerAndroid.open({
      value: dateFromKey(date),
      mode: 'date',
      onChange: (_event, selectedDate) => {
        if (selectedDate) setDate(dateToKey(selectedDate));
      },
    });
  };

  const submit = async () => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showMessage('Check the amount', 'Enter an amount greater than zero.');
      return;
    }
    if (parsedAmount > MAX_AMOUNT) {
      showMessage('Amount is too large', 'Enter an amount of ₱1 billion or less.');
      return;
    }
    if (exceedsRegularBalance) {
      showMessage(
        'Amount exceeds available balance',
        `Your regular available balance is ${regularBalance !== undefined ? `₱${regularBalance.toFixed(2)}` : 'not available'}.`
      );
      return;
    }
    if (exceedsEmergencyBalance) {
      showMessage(
        'Amount exceeds emergency fund',
        `Your emergency fund balance is ${emergencyFundBalance !== undefined ? `₱${emergencyFundBalance.toFixed(2)}` : 'not available'}.`
      );
      return;
    }
    if (!category.trim()) {
      showMessage('Choose a category', 'Select a category before saving.');
      return;
    }
    if (category === 'Custom' && !customCategory.trim()) {
      showMessage('Enter a custom category', 'Add a category name before saving.');
      return;
    }
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      showMessage('Check the date', 'Use the date format YYYY-MM-DD.');
      return;
    }
    if (type === 'income' && category === 'E-wallet' && !selectedWallet) {
      showMessage('Choose an e-wallet', 'Select an e-wallet or add a new one before saving.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        type,
        amount: parsedAmount,
        category: category === 'Custom' ? customCategory.trim() : category,
        note: type === 'income' && category === 'E-wallet'
          ? `${selectedWallet}${note.trim() ? ` · ${note.trim()}` : ''}`
          : note.trim(),
        transaction_date: date,
      }, transaction?.id, type === 'expense' && allowEmergencyFund ? paymentSource : 'regular');
      if (closeOnSave) {
        onClose();
      } else {
        setAmount('');
        setCategory('');
        setNote('');
        setSelectedWallet(null);
        setWalletNameDraft('');
        setCustomCategory('');
        setPaymentSource('regular');
      }
    } catch (error) {
      showMessage(
        'Could not save transaction',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const formSheet = (
        <View style={[
          styles.sheet,
          presentation === 'inline' && styles.inlineSheet,
          {
            backgroundColor: theme.background,
            ...(presentation === 'inline' ? { borderColor: theme.border } : {}),
          },
        ]}>
          {presentation === 'modal' && <View style={[styles.handle, { backgroundColor: theme.border }]} />}
          <View style={styles.header}>
            <View>
              <Text translate={false} style={[styles.eyebrow, { color: theme.textSecondary }]}>EXPENSE TRACKER</Text>
              <Text style={[styles.title, { color: theme.text }]}>
                {transaction
                  ? 'Edit transaction'
                  : lockedType === 'income'
                    ? 'Add income'
                    : lockedType === 'expense'
                      ? 'Add expense'
                      : 'New transaction'}
              </Text>
            </View>
            {showCloseButton && (
              <SmoothPressable accessibilityLabel="Close" onPress={onClose} style={[styles.close, { backgroundColor: theme.card }]}>
                <Ionicons name="close" size={21} color={theme.textSecondary} />
              </SmoothPressable>
            )}
          </View>
          <ScrollView
            style={presentation === 'inline' ? styles.inlineScroll : undefined}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!lockedType && (
              <View style={[styles.typeSwitch, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {(['income', 'expense'] as const).map((option) => (
                  <SmoothPressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: type === option }}
                    onPress={() => chooseType(option)}
                    style={[
                      styles.typeOption,
                      type === option && { backgroundColor: option === 'income' ? theme.success : theme.buttonPrimary },
                    ]}
                  >
                    <Ionicons
                      name={option === 'expense' ? 'arrow-up-outline' : 'arrow-down-outline'}
                      size={16}
                      color={type === option ? '#FFFFFF' : theme.textSecondary}
                    />
                    <Text style={[styles.typeText, { color: type === option ? '#FFFFFF' : theme.textSecondary }]}>
                      {option === 'expense' ? 'Expense' : 'Add income'}
                    </Text>
                  </SmoothPressable>
                ))}
              </View>
            )}

            <View style={styles.amountLabel}>
              <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
              <Text style={[styles.currencyLabel, { color: theme.textSecondary }]}>PHP PESO</Text>
            </View>
            <View style={[styles.amountShell, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.currencySymbol, { color: theme.tint }]}>₱</Text>
              <TextInput
                accessibilityLabel="Amount in Philippine pesos"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                maxLength={16}
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                style={[styles.amountInput, { color: theme.text }]}
              />
            </View>
            {(amount.trim() !== '' && (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || amountIsTooLarge || exceedsRegularBalance || exceedsEmergencyBalance)) && (
              <Text style={[styles.amountWarning, { color: theme.danger }]}>
                {parsedAmount <= 0
                  ? 'Enter an amount greater than zero.'
                  : amountIsTooLarge
                    ? 'Amount is too large.'
                    : exceedsRegularBalance
                      ? 'Amount exceeds your regular available balance.'
                      : 'Amount exceeds your emergency fund balance.'}
              </Text>
            )}

            {type === 'expense' && allowEmergencyFund && (
              <>
                <Text style={[styles.label, { color: theme.text }]}>Payment source</Text>
                <View style={styles.chips}>
                  {([
                    ['regular', 'Regular balance'],
                    ['emergency', 'Emergency fund'],
                  ] as const).map(([source, label]) => (
                    <SmoothPressable
                      key={source}
                      accessibilityRole="button"
                      accessibilityState={{ selected: paymentSource === source }}
                      onPress={() => setPaymentSource(source)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: paymentSource === source ? theme.buttonPrimary : theme.card,
                          borderColor: paymentSource === source ? theme.buttonPrimary : theme.border,
                        },
                      ]}
                    >
                      <Text style={{ color: paymentSource === source ? '#FFFFFF' : theme.text, fontSize: 13, fontWeight: '600' }}>
                        {label}
                      </Text>
                    </SmoothPressable>
                  ))}
                </View>
                {paymentSource === 'emergency' && (
                  <View
                    style={[
                      styles.emergencyHint,
                      { backgroundColor: theme.warningSurface, borderColor: theme.warningBorder },
                    ]}
                  >
                    <Ionicons name="information-circle-outline" size={16} color={theme.warning} />
                    <Text style={[styles.emergencyHintText, { color: theme.textSecondary }]}>
                      Use emergency savings only for urgent or unexpected needs.
                    </Text>
                  </View>
                )}
              </>
            )}

            <Text style={[styles.label, { color: theme.text }]}>{type === 'income' ? 'Source' : 'Category'}</Text>
            <View style={styles.chips}>
              {categories.map((item) => (
                <SmoothPressable
                  key={item}
                  onPress={() => {
                    setCategory(item);
                    if (item !== 'E-wallet') setSelectedWallet(null);
                  }}
                  style={[styles.chip, { backgroundColor: category === item ? theme.buttonPrimary : theme.card, borderColor: category === item ? theme.buttonPrimary : theme.border }]}
                >
                  <Text style={{ color: category === item ? '#FFFFFF' : theme.text, fontSize: 13, fontWeight: '600' }}>
                    {item}
                  </Text>
                </SmoothPressable>
              ))}
            </View>
            {type === 'expense' && category === 'Custom' && (
              <TextInput
                accessibilityLabel="Custom category"
                value={customCategory}
                onChangeText={setCustomCategory}
                placeholder="Enter category name"
                placeholderTextColor={theme.textSecondary}
                maxLength={40}
                style={[styles.input, styles.customCategoryInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
              />
            )}
            {type === 'income' && category === 'E-wallet' && (
              <View style={styles.walletPicker}>
                <Text style={[styles.label, { color: theme.text }]}>Choose e-wallet</Text>
                {loadingWallets ? (
                  <ActivityIndicator color={theme.tint} />
                ) : (
                  <View style={styles.chips}>
                    {eWalletOptions.map((wallet) => (
                      <SmoothPressable
                        key={wallet}
                        accessibilityRole="button"
                        accessibilityState={{ selected: selectedWallet === wallet }}
                        onPress={() => setSelectedWallet(wallet)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selectedWallet === wallet ? theme.buttonPrimary : theme.card,
                            borderColor: selectedWallet === wallet ? theme.buttonPrimary : theme.border,
                          },
                        ]}
                      >
                        <Text translate={false} style={{ color: selectedWallet === wallet ? '#FFFFFF' : theme.text, fontSize: 13, fontWeight: '600' }}>
                          {wallet}
                        </Text>
                      </SmoothPressable>
                    ))}
                    <SmoothPressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: showAddWallet }}
                      onPress={() => setShowAddWallet((current) => !current)}
                      style={[styles.chip, { backgroundColor: theme.buttonSecondary, borderColor: theme.border }]}
                    >
                      <Text style={{ color: theme.tint, fontSize: 13, fontWeight: '700' }}>
                        {showAddWallet ? 'Cancel' : '+ Add another'}
                      </Text>
                    </SmoothPressable>
                  </View>
                )}
                {showAddWallet && (
                  <View style={styles.addWalletRow}>
                    <TextInput
                      accessibilityLabel="New e-wallet name"
                      value={walletNameDraft}
                      onChangeText={setWalletNameDraft}
                      placeholder="Enter e-wallet name"
                      placeholderTextColor={theme.textSecondary}
                      maxLength={30}
                      style={[styles.input, styles.walletInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                    />
                    <Button
                      label="Add"
                      icon="add"
                      loading={addingWallet}
                      disabled={!walletNameDraft.trim() || loadingWallets}
                      onPress={() => void addWallet()}
                      style={styles.addWalletButton}
                    />
                  </View>
                )}
              </View>
            )}

            <Text style={[styles.label, { color: theme.text }]}>Description</Text>
            <TextInput
              accessibilityLabel="Optional description"
              value={note}
              onChangeText={setNote}
              placeholder="What was this for?"
              placeholderTextColor={theme.textSecondary}
              maxLength={120}
              style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
            />

            <Text style={[styles.label, { color: theme.text }]}>Date</Text>
            {Platform.OS === 'android' ? (
              <SmoothPressable
                accessibilityRole="button"
                accessibilityLabel="Transaction date"
                onPress={openDatePicker}
                style={[styles.input, styles.datePickerInput, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Text style={{ color: theme.text }}>{formatDate(date, settings.language)}</Text>
                <Ionicons name="calendar-outline" size={18} color={theme.tint} />
              </SmoothPressable>
            ) : (
              <>
                <SmoothPressable
                  accessibilityRole="button"
                  accessibilityLabel="Transaction date"
                  onPress={() => setShowIosDatePicker(true)}
                  style={[styles.input, styles.datePickerInput, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.text }}>{formatDate(date, settings.language)}</Text>
                  <Ionicons name="calendar-outline" size={18} color={theme.tint} />
                </SmoothPressable>
                {showIosDatePicker && (
                  <DateTimePicker
                    value={dateFromKey(date)}
                    mode="date"
                    display="inline"
                    onChange={(_event, selectedDate) => {
                      if (selectedDate) setDate(dateToKey(selectedDate));
                    }}
                  />
                )}
              </>
            )}

            <Button
              label={transaction
                ? 'Save changes'
                : lockedType === 'income'
                  ? 'Add income'
                  : lockedType === 'expense'
                    ? 'Add expense'
                    : 'Add transaction'}
              loading={saving}
              disabled={!canSubmit}
              onPress={() => void submit()}
              style={styles.submit}
            />
          </ScrollView>
        </View>
  );

  if (presentation === 'inline') {
    return (
      <KeyboardAvoidingView
        style={styles.inlineContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {formSheet}
      </KeyboardAvoidingView>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {formSheet}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  inlineContainer: { height: 460, minHeight: 460 },
  sheet: { maxHeight: '92%', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  inlineSheet: { height: 460, maxHeight: 460, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 16 },
  inlineScroll: { flex: 1, minHeight: 0 },
  handle: { width: 38, height: 4, borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  eyebrow: { fontSize: 9, letterSpacing: 1.3, fontWeight: '800', marginBottom: 3 },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  close: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  typeSwitch: { flexDirection: 'row', borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, padding: 4, marginBottom: 18 },
  typeOption: { flex: 1, minHeight: 43, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  typeText: { fontSize: 14, fontWeight: '700' },
  amountLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700' },
  currencyLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  amountShell: { minHeight: 62, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  currencySymbol: { fontSize: 25, fontWeight: '800' },
  amountInput: { flex: 1, fontSize: 25, fontWeight: '800', paddingVertical: 8 },
  amountWarning: { fontSize: 12, lineHeight: 17, marginTop: 7 },
  input: { minHeight: 49, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, fontSize: 15 },
  datePickerInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emergencyHint: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginTop: 9 },
  emergencyHintText: { flex: 1, fontSize: 11, lineHeight: 16 },
  chip: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth },
  walletPicker: { gap: 10, marginTop: 14 },
  addWalletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletInput: { flex: 1, minWidth: 0 },
  customCategoryInput: { marginTop: 10 },
  addWalletButton: { minHeight: 46, paddingHorizontal: 12 },
  submit: { marginTop: 22, marginBottom: 8, borderRadius: 15 },
});
