import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedTextInput as TextInput } from '@/components/LocalizedTextInput';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { pickTransactionsCsv, exportTransactionsCsv } from '@/backup/ledgerCsv';
import { TransactionRow } from '@/components/ledger/TransactionRow';
import { QUICK_EXPENSE_CATEGORIES, TransactionForm } from '@/components/ledger/TransactionForm';
import { isEmergencyFundMovement, type LedgerTransaction } from '@/db/ledger';
import { useLedgerTransactions } from '@/hooks/useLedgerTransactions';
import { formatMoney, formatTime } from '@/ledger/format';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';
import { SmoothPressable } from '@/components/SmoothPressable';
import { confirmAction, confirmActionWithText } from '@/utils/confirm';

type Filter = 'all' | 'expense' | 'income' | 'savings';
const INCOME_CATEGORY_FILTERS = ['Baon', 'Allowance', 'Part-time job', 'Other'];

export default function HistoryScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const { transactions, loading, save, remove, clear, restore } = useLedgerTransactions();
  const [filter, setFilter] = useState<Filter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const [busy, setBusy] = useState(false);
  const [toolsVisible, setToolsVisible] = useState(false);
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<LedgerTransaction | null>(null);
  const categoryOptions = useMemo(() => {
    const matchingType = transactions.filter((item) => filter === 'all' || item.type === filter);
    const configuredCategories = [...new Set([
      ...(filter === 'all' || filter === 'expense'
        ? QUICK_EXPENSE_CATEGORIES.filter((category) => category !== 'Custom')
        : []),
      ...(filter === 'all' || filter === 'income' ? INCOME_CATEGORY_FILTERS : []),
    ])];
    const configuredSet = new Set(configuredCategories);
    const additionalCategories = [...new Set(matchingType.map((item) => item.category))]
      .filter((category) => category !== 'Cash' && !configuredSet.has(category))
      .sort((left, right) => left.localeCompare(right));
    return [...configuredCategories, ...additionalCategories];
  }, [filter, transactions]);
  const allFiltered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((item) => {
      const matchesType = filter === 'all'
        || item.type === filter;
      const matchesCategory = categoryFilter === null || item.category === categoryFilter;
      const matchesText = !query || [item.category, item.note, item.transaction_date]
        .some((value) => value.toLowerCase().includes(query));
      return matchesType && matchesCategory && matchesText;
    });
  }, [categoryFilter, filter, search, transactions]);
  const filtered = useMemo(
    () => allFiltered.slice(0, visibleCount),
    [allFiltered, visibleCount]
  );
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, typeof filtered>();
    for (const transaction of filtered) {
      const group = groups.get(transaction.transaction_date);
      if (group) group.push(transaction);
      else groups.set(transaction.transaction_date, [transaction]);
    }
    return [...groups.entries()];
  }, [filtered]);

  const exportCsv = async () => {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      await exportTransactionsCsv(transactions);
      setStatus({ text: `Exported ${transactions.length} transaction${transactions.length === 1 ? '' : 's'} to CSV.`, error: false });
    } catch (error) {
      setStatus({ text: error instanceof Error ? error.message : 'Could not export transaction history.', error: true });
    } finally {
      setBusy(false);
    }
  };

  const restoreCsv = async () => {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const imported = await pickTransactionsCsv();
      setBusy(false);
      if (!imported) return;
      confirmAction(
        'Restore transaction history?',
        `This replaces your current ${transactions.length} transaction${transactions.length === 1 ? '' : 's'} with ${imported.length} transaction${imported.length === 1 ? '' : 's'} from the selected CSV and adjusts the emergency fund and savings goal progress for imported activity. Upcoming events remain unchanged.`,
        'Restore',
        async () => {
          setBusy(true);
          try {
            await restore(imported);
            setStatus({ text: `Restored ${imported.length} transaction${imported.length === 1 ? '' : 's'}.`, error: false });
          } catch (error) {
            setStatus({ text: error instanceof Error ? error.message : 'Could not restore transaction history.', error: true });
          } finally {
            setBusy(false);
          }
        }
      );
    } catch (error) {
      setStatus({ text: error instanceof Error ? error.message : 'Could not read the CSV file.', error: true });
      setBusy(false);
    }
  };

  const clearHistory = () => {
    confirmActionWithText(
      'Clear transaction history?',
      `This permanently deletes all ${transactions.length} transactions, resets your emergency fund, and clears savings-goal progress. Events and goal targets will remain. This cannot be undone.`,
      'Delete',
      'DELETE',
      async () => {
        setBusy(true);
        setStatus(null);
        try {
          await clear();
          setStatus({ text: 'Transaction history cleared and emergency fund reset.', error: false });
        } catch (error) {
          setStatus({ text: error instanceof Error ? error.message : 'Could not clear transaction history.', error: true });
        } finally {
          setBusy(false);
        }
      }
    );
  };

  const deleteHistoryTransaction = (transaction: LedgerTransaction) => {
    const fundMovement = isEmergencyFundMovement(transaction);
    confirmAction(
      'Are you sure you want to delete this transaction?',
      `${transaction.category} · ${formatMoney(transaction.amount)}. ${transaction.type === 'savings' ? 'Deleting this returns the amount to your available balance and reduces the goal progress. ' : fundMovement ? 'This will also update your emergency fund balance. ' : ''}This cannot be undone.`,
      'Delete',
      () => remove(transaction.id)
    );
  };

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
        <SmoothPressable
          accessibilityRole="button"
          accessibilityLabel="Backup and history tools"
          accessibilityState={{ expanded: toolsVisible }}
          onPress={() => setToolsVisible((visible) => !visible)}
          style={[styles.toolsToggle, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="ellipsis-horizontal" size={19} color={theme.tint} />
        </SmoothPressable>
      </View>
      {toolsVisible && (
        <View style={[styles.tools, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.toolsTitle, { color: theme.textSecondary }]}>BACKUP & TOOLS</Text>
          <View style={styles.toolButtons}>
            <ToolButton icon="download-outline" label="Export CSV" disabled={busy || loading} onPress={() => void exportCsv()} color={theme.tint} />
            <ToolButton icon="cloud-upload-outline" label="Restore" disabled={busy || loading} onPress={() => void restoreCsv()} color={theme.tint} />
            <ToolButton icon="trash-outline" label="Clear" disabled={busy || loading || transactions.length === 0} onPress={clearHistory} color={theme.danger} />
          </View>
          {busy && <Text style={[styles.toolStatus, { color: theme.textSecondary }]}>Working…</Text>}
          {status && <Text style={[styles.toolStatus, { color: status.error ? theme.danger : theme.success }]}>{status.text}</Text>}
          <Text style={[styles.toolHelp, { color: theme.textSecondary }]}>
            Restore replaces entries from a CSV (date, type, category, amount, note).
          </Text>
        </View>
      )}
      <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={17} color={theme.textSecondary} />
        <TextInput
          accessibilityLabel="Search history"
          placeholder="Search by note, category, or date…"
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setVisibleCount(50);
          }}
          style={{ flex: 1, color: theme.text, minHeight: 40, fontSize: 13.5 }}
        />
        {search.length > 0 && (
          <SmoothPressable accessibilityLabel="Clear search" onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={17} color={theme.textSecondary} />
          </SmoothPressable>
        )}
      </View>
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['all', 'expense', 'income', 'savings'] as const).map((item) => (
            <SmoothPressable
              key={item}
              onPress={() => {
                setFilter(item);
                setCategoryFilter(null);
                setVisibleCount(50);
              }}
              style={[styles.filter, { backgroundColor: filter === item ? theme.buttonPrimary : theme.card, borderColor: filter === item ? theme.buttonPrimary : theme.border }]}
            >
              <Text style={{ color: filter === item ? '#FFFFFF' : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                {item === 'all'
                  ? 'All'
                  : item === 'expense'
                    ? 'Expenses'
                    : item === 'income'
                      ? 'Income'
                      : 'Savings'}
              </Text>
            </SmoothPressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <SmoothPressable
            onPress={() => {
              setCategoryFilter(null);
              setVisibleCount(50);
            }}
            style={[styles.filter, { backgroundColor: categoryFilter === null ? theme.buttonPrimary : theme.card, borderColor: categoryFilter === null ? theme.buttonPrimary : theme.border }]}
          >
            <Text style={{ color: categoryFilter === null ? '#FFFFFF' : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
              All categories
            </Text>
          </SmoothPressable>
          {categoryOptions.map((category) => (
            <SmoothPressable
              key={category}
              onPress={() => {
                setCategoryFilter(category);
                setVisibleCount(50);
              }}
              style={[styles.filter, { backgroundColor: categoryFilter === category ? theme.buttonPrimary : theme.card, borderColor: categoryFilter === category ? theme.buttonPrimary : theme.border }]}
            >
              <Text style={{ color: categoryFilter === category ? '#FFFFFF' : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                {category === 'School supplies' ? 'School' : category}
              </Text>
            </SmoothPressable>
          ))}
        </ScrollView>
      </View>
      {filtered.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.emptyIcon, { backgroundColor: `${theme.buttonPrimary}14` }]}>
            <Ionicons name="time-outline" size={22} color={theme.tint} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {transactions.length === 0 ? 'Your money entries will appear here.' : 'No entries match your search.'}
          </Text>
          <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 12 }}>
            {transactions.length === 0 ? 'Add money in or money spent to start.' : 'Try another search keyword or filter.'}
          </Text>
        </View>
      ) : (
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: theme.text }]}>Transactions</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{filtered.length} entry{filtered.length === 1 ? '' : 'ies'}</Text>
          </View>
          {groupedTransactions.map(([date, dateTransactions]) => (
            <View key={date} style={styles.dateGroup}>
              <View style={styles.dateHeadingRow}>
                <Text style={[styles.dateHeading, { color: theme.textSecondary }]}>
                  {dateGroupLabel(date, settings.language)}
                </Text>
                <Text style={[styles.dateTotal, { color: theme.textSecondary }]}>
                  {formatSignedMoney(dateTransactions.reduce(
                    (total, transaction) => total + (transaction.type === 'income' ? transaction.amount : -transaction.amount),
                    0
                  ))}
                </Text>
              </View>
              <View style={[styles.list, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {dateTransactions.map((transaction, index) => (
                  <View
                    key={transaction.id}
                    style={[
                      styles.historyRow,
                      index < dateTransactions.length - 1 && {
                        borderBottomColor: theme.border,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <View style={styles.historyRowContent}>
                      <TransactionRow
                        transaction={transaction}
                        onPress={!isEmergencyFundMovement(transaction)
                          && transaction.type !== 'savings'
                          && !transaction.savings_goal_id
                          ? () => setEditingTransaction(transaction)
                          : undefined}
                        timeLabel={formatTime(transaction.created_at, settings.language)}
                        timeInDetails
                      />
                    </View>
                    <View style={styles.historyRowActions}>
                      {!isEmergencyFundMovement(transaction)
                        && transaction.type !== 'savings'
                        && !transaction.savings_goal_id && (
                        <SmoothPressable
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${transaction.category} transaction`}
                          disabled={loading || busy}
                          onPress={() => setEditingTransaction(transaction)}
                          style={[styles.historyAction, { backgroundColor: theme.buttonSecondary }]}
                        >
                          <Ionicons name="create-outline" size={17} color={theme.tint} />
                        </SmoothPressable>
                      )}
                      <SmoothPressable
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${transaction.category} transaction`}
                        disabled={loading || busy}
                        onPress={() => deleteHistoryTransaction(transaction)}
                        style={[styles.historyAction, { backgroundColor: theme.dangerSurface }]}
                      >
                        <Ionicons name="trash-outline" size={16} color={theme.danger} />
                      </SmoothPressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
          {visibleCount < allFiltered.length && (
            <SmoothPressable
              accessibilityRole="button"
              accessibilityLabel="Load more transactions"
              onPress={() => setVisibleCount((count) => count + 50)}
              style={[styles.loadMore, { backgroundColor: theme.buttonSecondary }]}
            >
              <Text style={{ color: theme.tint, fontSize: 12, fontWeight: '700' }}>+50 more</Text>
            </SmoothPressable>
          )}
        </View>
      )}
      {editingTransaction && (
        <TransactionForm
          key={`edit-${editingTransaction.id}`}
          visible
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={save}
        />
      )}
    </ScrollView>
  );
}

function dateGroupLabel(dateKey: string, language: 'en' | 'tl'): string {
  const date = new Date(`${dateKey}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const keyForDate = (value: Date) => (
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  );

  if (dateKey === keyForDate(today)) return language === 'tl' ? 'Ngayon' : 'Today';
  if (dateKey === keyForDate(yesterday)) return language === 'tl' ? 'Kahapon' : 'Yesterday';
  return date.toLocaleDateString(language === 'tl' ? 'fil-PH' : 'en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatSignedMoney(amount: number): string {
  return `${amount < 0 ? '-' : amount > 0 ? '+' : ''}${formatMoney(Math.abs(amount))}`;
}

function ToolButton({
  icon,
  label,
  disabled,
  onPress,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  disabled: boolean;
  onPress: () => void;
  color: string;
}) {
  const theme = useTheme();
  return (
    <SmoothPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.toolButton, { backgroundColor: theme.buttonSecondary, opacity: disabled ? 0.45 : 1 }]}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.toolButtonLabel, { color }]}>{label}</Text>
    </SmoothPressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  toolsToggle: { width: 38, height: 38, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  tools: { padding: 13, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
  toolsTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  toolButtons: { flexDirection: 'row', gap: 7 },
  toolButton: { flex: 1, minHeight: 38, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 4 },
  toolButtonLabel: { fontSize: 11.5, fontWeight: '700' },
  toolStatus: { fontSize: 12, lineHeight: 17 },
  toolHelp: { fontSize: 11, lineHeight: 15 },
  search: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterSection: { gap: 8 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 4 },
  filter: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  loadMore: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  listSection: { gap: 10 },
  dateGroup: { gap: 6 },
  dateHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  dateHeading: { fontSize: 12.5, fontWeight: '700' },
  dateTotal: { fontSize: 11.5, fontWeight: '600' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontSize: 14.5, fontWeight: '700' },
  list: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyRowContent: { flex: 1, minWidth: 0 },
  historyRowActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  historyAction: { width: 31, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 22, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', gap: 6 },
  emptyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyTitle: { fontSize: 14.5, fontWeight: '700', textAlign: 'center' },
});
