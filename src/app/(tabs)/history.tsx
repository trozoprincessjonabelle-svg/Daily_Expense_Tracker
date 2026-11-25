import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedTextInput as TextInput } from '@/components/LocalizedTextInput';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { pickTransactionsCsv, exportTransactionsCsv } from '@/backup/ledgerCsv';
import { TransactionRow } from '@/components/ledger/TransactionRow';
import { TransactionForm } from '@/components/ledger/TransactionForm';
import { isEmergencyFundMovement, type LedgerTransaction } from '@/db/ledger';
import { useLedgerTransactions } from '@/hooks/useLedgerTransactions';
import { formatLongDate, formatTime } from '@/ledger/format';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';
import { SmoothPressable } from '@/components/SmoothPressable';
import { confirmAction, confirmActionWithText } from '@/utils/confirm';

type Filter = 'all' | 'expense' | 'income' | 'transfers';

export default function HistoryScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const { transactions, loading, save, clear, restore } = useLedgerTransactions();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<LedgerTransaction | null>(null);
  const allFiltered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((item) => {
      const matchesType = filter === 'all'
        || (filter === 'transfers' ? isEmergencyFundMovement(item) : item.type === filter);
      const matchesText = !query || [item.category, item.note, item.transaction_date]
        .some((value) => value.toLowerCase().includes(query));
      return matchesType && matchesText;
    });
  }, [filter, search, transactions]);
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
        `This replaces your current ${transactions.length} transaction${transactions.length === 1 ? '' : 's'} with ${imported.length} transaction${imported.length === 1 ? '' : 's'} from the selected CSV and adjusts the emergency fund for imported fund activity. Your fund goal and upcoming events remain unchanged.`,
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
      `This permanently deletes all ${transactions.length} transactions and resets your emergency fund balance and goal. Events will remain. This cannot be undone.`,
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

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>History</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12.5, marginTop: 2 }}>All your money entries in one place</Text>
        </View>
      </View>
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
        <View style={styles.filters}>
        {(['all', 'income', 'expense', 'transfers'] as const).map((item) => (
          <SmoothPressable
            key={item}
            onPress={() => {
              setFilter(item);
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
                    : 'Transfers'}
            </Text>
          </SmoothPressable>
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
              <Text style={[styles.dateHeading, { color: theme.textSecondary }]}>
                {formatLongDate(date, settings.language)}
              </Text>
              <View style={[styles.list, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {dateTransactions.map((transaction, index) => (
                  <View
                    key={transaction.id}
                    style={[
                      index < dateTransactions.length - 1 && {
                        borderBottomColor: theme.border,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <TransactionRow
                      transaction={transaction}
                      onPress={!isEmergencyFundMovement(transaction) ? () => setEditingTransaction(transaction) : undefined}
                      timeLabel={formatTime(transaction.created_at, settings.language)}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
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
  tools: { padding: 13, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
  toolsTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  toolButtons: { flexDirection: 'row', gap: 7 },
  toolButton: { flex: 1, minHeight: 38, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 4 },
  toolButtonLabel: { fontSize: 11.5, fontWeight: '700' },
  toolStatus: { fontSize: 12, lineHeight: 17 },
  toolHelp: { fontSize: 11, lineHeight: 15 },
  search: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterSection: { gap: 6 },
  filters: { flexDirection: 'row', gap: 6 },
  filter: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  loadMore: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  listSection: { gap: 10 },
  dateGroup: { gap: 6 },
  dateHeading: { fontSize: 12.5, fontWeight: '700', paddingHorizontal: 2 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontSize: 14.5, fontWeight: '700' },
  list: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  empty: { padding: 22, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', gap: 6 },
  emptyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyTitle: { fontSize: 14.5, fontWeight: '700', textAlign: 'center' },
});
