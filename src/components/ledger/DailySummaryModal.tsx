import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { emergencyFundActivity, isEmergencyFundMovement, type LedgerTransaction } from '@/db/ledger';
import { formatDate, formatMoney, sumByType } from '@/ledger/format';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';
import { Button } from '../Button';

export function DailySummaryModal({
  visible,
  date,
  transactions,
  closing,
  onClose,
}: {
  visible: boolean;
  date: string;
  transactions: LedgerTransaction[];
  closing: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { settings } = useSettings();
  const { height } = useWindowDimensions();
  const expenses = useMemo(
    () => transactions.filter(
      (transaction) => transaction.type === 'expense' && !isEmergencyFundMovement(transaction)
    ),
    [transactions]
  );
  const income = sumByType(transactions, 'income');
  const totalExpenses = sumByType(expenses, 'expense');
  const goalSavings = sumByType(transactions, 'savings');
  const fundActivity = emergencyFundActivity(transactions);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              maxHeight: height * 0.88,
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: `${theme.tint}18` }]}>
              <Ionicons name="receipt-outline" size={22} color={theme.tint} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: theme.text }]}>Yesterday’s money recap</Text>
              <Text style={[styles.date, { color: theme.textSecondary }]}>
                {formatDate(date, settings.language)}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            <View style={styles.totalsRow}>
              <SummaryTotal label="Money added" amount={income} color={theme.success} />
              <SummaryTotal label="Total spent" amount={totalExpenses} color={theme.danger} />
            </View>
            {(fundActivity.added > 0 || fundActivity.used > 0 || goalSavings > 0) && (
              <View style={{
                backgroundColor: theme.buttonSecondary,
                borderRadius: 14,
                marginTop: 12,
                padding: 14,
              }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>
                  Savings activity
                </Text>
                {fundActivity.added > 0 && (
                  <View style={styles.fundActivityRow}>
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Savings added</Text>
                    <Text style={{ color: theme.success, fontSize: 13, fontWeight: '700' }}>
                      +{formatMoney(fundActivity.added)}
                    </Text>
                  </View>
                )}
                {fundActivity.used > 0 && (
                  <View style={styles.fundActivityRow}>
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Emergency fund used</Text>
                    <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '700' }}>
                      -{formatMoney(fundActivity.used)}
                    </Text>
                  </View>
                )}
                {goalSavings > 0 && (
                  <View style={styles.fundActivityRow}>
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Savings goals</Text>
                    <Text style={{ color: theme.tint, fontSize: 13, fontWeight: '700' }}>
                      -{formatMoney(goalSavings)}
                    </Text>
                  </View>
                )}
              </View>
            )}
            <View style={[styles.remainingCard, { backgroundColor: `${theme.success}12` }]}>
              <View style={[styles.remainingIcon, { backgroundColor: `${theme.success}20` }]}>
                <Ionicons name="wallet-outline" size={20} color={theme.success} />
              </View>
              <View style={styles.remainingCopy}>
                <Text style={[styles.remainingLabel, { color: theme.textSecondary }]}>
                  Remaining from added money
                </Text>
                <Text style={[styles.remainingAmount, { color: theme.success }]}>
                  {formatMoney(income - totalExpenses - goalSavings)}
                </Text>
              </View>
            </View>

            <View style={styles.expensesHeading}>
              <Text style={[styles.expensesTitle, { color: theme.text }]}>Expenses</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                {expenses.length}
              </Text>
            </View>
            {expenses.length === 0 ? (
              <Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>
                No expenses were recorded yesterday.
              </Text>
            ) : (
              <View style={[styles.expenseList, { borderColor: theme.border }]}>
                {expenses.map((transaction, index) => (
                  <View
                    key={transaction.id}
                    style={[
                      styles.expenseRow,
                      index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                    ]}
                  >
                    <View style={[styles.expenseIcon, { backgroundColor: `${theme.danger}14` }]}>
                      <Ionicons name="arrow-up-outline" size={17} color={theme.danger} />
                    </View>
                    <View style={styles.expenseCopy}>
                      <Text translate={false} numberOfLines={1} style={[styles.expenseNote, { color: theme.text }]}>
                        {transaction.note || transaction.category}
                      </Text>
                      <Text translate={false} numberOfLines={1} style={[styles.expenseCategory, { color: theme.textSecondary }]}>
                        {transaction.category}
                      </Text>
                    </View>
                    <Text numberOfLines={1} style={[styles.expenseAmount, { color: theme.danger }]}>
                      −{formatMoney(transaction.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <Button
            label="Close and clear activity"
            icon="checkmark"
            loading={closing}
            onPress={onClose}
            style={styles.closeButton}
          />
        </View>
      </View>
    </Modal>
  );
}

function SummaryTotal({ label, amount, color }: { label: string; amount: number; color: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.totalCard, { backgroundColor: theme.buttonSecondary }]}>
      <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.totalAmount, { color }]}>
        {formatMoney(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18, backgroundColor: 'rgba(20, 16, 20, 0.46)' },
  card: { width: '100%', maxWidth: 380, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 15 },
  headerIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 4 },
  title: { fontSize: 17, fontWeight: '800' },
  date: { fontSize: 12 },
  scroll: { flexShrink: 1, minHeight: 0 },
  scrollContent: { gap: 13, paddingBottom: 12 },
  totalsRow: { flexDirection: 'row', gap: 9 },
  fundActivityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  totalCard: { flex: 1, minWidth: 0, borderRadius: 15, padding: 12, gap: 7 },
  totalLabel: { fontSize: 11, fontWeight: '600' },
  totalAmount: { fontSize: 16, fontWeight: '800' },
  remainingCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 16, padding: 13 },
  remainingIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  remainingCopy: { flex: 1, gap: 3 },
  remainingLabel: { fontSize: 11, fontWeight: '600' },
  remainingAmount: { fontSize: 21, fontWeight: '800' },
  expensesHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 1 },
  expensesTitle: { fontSize: 14, fontWeight: '800' },
  expenseList: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, paddingHorizontal: 11 },
  expenseRow: { minHeight: 59, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8 },
  expenseIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  expenseCopy: { flex: 1, gap: 3 },
  expenseNote: { fontSize: 12, fontWeight: '700' },
  expenseCategory: { fontSize: 11 },
  expenseAmount: { fontSize: 12, fontWeight: '800' },
  emptyCopy: { fontSize: 12, lineHeight: 18, paddingVertical: 8 },
  closeButton: { marginTop: 14 },
});
