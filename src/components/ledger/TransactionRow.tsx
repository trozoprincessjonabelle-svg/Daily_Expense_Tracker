import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import type { LedgerTransaction } from '@/db/ledger';
import { formatDate, formatMoney } from '@/ledger/format';
import { useTheme } from '@/theme';
import { useSettings } from '@/settings/SettingsContext';
import { SmoothPressable } from '../SmoothPressable';

export function TransactionRow({
  transaction,
  onPress,
  timeLabel,
}: {
  transaction: LedgerTransaction;
  onPress?: () => void;
  timeLabel?: string;
}) {
  const theme = useTheme();
  const { settings } = useSettings();
  const income = transaction.type === 'income';
  const addedToSavings = transaction.category === 'Savings'
    && transaction.note === 'Added to emergency fund';
  const transferToSavings = transaction.category === 'Emergency fund transfer'
    && transaction.note === 'Transfer to emergency fund';
  const transferToWallet = transaction.category === 'Emergency fund transfer'
    && transaction.note === 'Returned to wallet';
  const spentFromSavings = transaction.type === 'expense'
    && transaction.category === 'Emergency fund';
  const transfer = addedToSavings || transferToSavings || transferToWallet || spentFromSavings;
  const displayTitle = addedToSavings
    ? 'Transfer to savings'
    : transferToSavings
      ? 'Transfer to savings'
      : transferToWallet
        ? 'Transfer to wallet'
    : spentFromSavings
      ? 'Transfer from savings'
    : transaction.category === 'Emergency fund'
      ? 'Emergency fund'
      : transaction.note || (income ? 'Income' : 'Expense');
  const categoryIcon: React.ComponentProps<typeof Ionicons>['name'] =
    transfer ? 'swap-horizontal-outline'
      : transaction.category === 'Food' ? 'restaurant-outline'
      : transaction.category === 'Transport' ? 'car-outline'
        : transaction.category === 'School supplies' ? 'book-outline'
          : transaction.category === 'Projects & printing' ? 'document-text-outline'
            : transaction.category === 'Tuition & school fees' ? 'school-outline'
              : transaction.category === 'Load & data' ? 'phone-portrait-outline'
                : transaction.category === 'Personal care' ? 'heart-outline'
                  : transaction.category === 'Entertainment' ? 'game-controller-outline'
          : transaction.category === 'Shopping' ? 'bag-handle-outline'
            : transaction.category === 'Health' ? 'heart-outline'
              : income ? 'wallet-outline' : 'ellipsis-horizontal-circle-outline';
  const tone = transfer ? theme.accent : income ? theme.success : theme.danger;
  return (
    <SmoothPressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityLabel={`${transaction.category}, ${income ? 'income' : 'expense'}, ${formatMoney(transaction.amount)}`}
      accessibilityHint={onPress ? 'Tap to edit this transaction' : undefined}
      style={[styles.row, onPress && styles.pressableRow]}
    >
      <View style={[styles.icon, { backgroundColor: `${tone}18` }]}>
        <Ionicons name={categoryIcon} size={19} color={tone} />
      </View>
      <View style={styles.details}>
        <Text translate={!transaction.note} numberOfLines={1} style={[styles.category, { color: theme.text }]}>
          {displayTitle}
        </Text>
        <Text numberOfLines={1} style={[styles.caption, { color: theme.textSecondary }]}>
          {transaction.category}
        </Text>
      </View>
      <View style={styles.amountBlock}>
        <Text style={[styles.amount, { color: transfer ? theme.accent : income ? theme.success : theme.danger }]}>
          {transfer ? '' : income ? '+' : '-'}{formatMoney(transaction.amount)}
        </Text>
        <Text style={[styles.caption, { color: theme.textSecondary }]}>
          {timeLabel ?? formatDate(transaction.transaction_date, settings.language)}
        </Text>
      </View>
    </SmoothPressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  pressableRow: { borderRadius: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, gap: 3 },
  category: { fontSize: 14.5, fontWeight: '600', letterSpacing: -0.2 },
  caption: { fontSize: 12 },
  amountBlock: { alignItems: 'flex-end', gap: 3 },
  amount: { fontSize: 14.5, fontWeight: '700', letterSpacing: -0.2 },
});
