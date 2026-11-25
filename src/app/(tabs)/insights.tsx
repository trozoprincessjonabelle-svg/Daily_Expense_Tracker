import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { SmoothPressable } from '@/components/SmoothPressable';
import { emergencyFundActivity, isEmergencyFundMovement } from '@/db/ledger';
import { useCurrentDate } from '@/hooks/useCurrentDate';
import { useLedgerTransactions } from '@/hooks/useLedgerTransactions';
import { availableBalanceThroughDate, formatMoney, sumByType } from '@/ledger/format';
import { useTheme } from '@/theme';

export function InsightsScreen() {
  const theme = useTheme();
  const { transactions, loading } = useLedgerTransactions();
  const [cashflowPeriod, setCashflowPeriod] = useState<'week' | 'month' | 'year'>('month');
  const today = useCurrentDate();
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const yearKey = String(today.getFullYear());
  const month = transactions.filter(
    (transaction) => transaction.transaction_date.startsWith(monthKey)
  );
  const yearTransactions = transactions.filter(
    (transaction) => transaction.transaction_date.startsWith(yearKey)
  );
  const income = sumByType(month, 'income');
  const expenses = sumByType(month, 'expense');
  const todayKey = toDateKey(today);
  const weekStart = toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6));
  const weekTransactions = transactions.filter(
    (transaction) =>
      transaction.transaction_date >= weekStart && transaction.transaction_date <= todayKey
  );
  const weekIncome = sumByType(weekTransactions, 'income');
  const weekExpenses = sumByType(weekTransactions, 'expense');
  const previousWeekStart = toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13));
  const previousWeekEnd = toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7));
  const previousWeekTransactions = transactions.filter(
    (transaction) => transaction.transaction_date >= previousWeekStart
      && transaction.transaction_date <= previousWeekEnd
  );
  const previousWeekExpenses = sumByType(previousWeekTransactions, 'expense');
  const weeklyChange = previousWeekExpenses > 0
    ? ((weekExpenses - previousWeekExpenses) / previousWeekExpenses) * 100
    : null;
  const yearIncome = sumByType(yearTransactions, 'income');
  const yearExpenses = sumByType(yearTransactions, 'expense');
  const selectedIncome = cashflowPeriod === 'week'
    ? weekIncome
    : cashflowPeriod === 'month'
      ? income
      : yearIncome;
  const selectedExpenses = cashflowPeriod === 'week'
    ? weekExpenses
    : cashflowPeriod === 'month'
      ? expenses
      : yearExpenses;
  const netCashflow = selectedIncome - selectedExpenses;
  const monthFundActivity = emergencyFundActivity(month);
  const weekFundActivity = emergencyFundActivity(weekTransactions);
  const yearFundActivity = emergencyFundActivity(yearTransactions);
  const fundActivity = cashflowPeriod === 'week'
    ? weekFundActivity
    : cashflowPeriod === 'month'
      ? monthFundActivity
      : yearFundActivity;
  const categories = (() => {
    const sums = new Map<string, number>();
    for (const transaction of month) {
      if (transaction.type === 'expense' && !isEmergencyFundMovement(transaction)) {
        sums.set(transaction.category, (sums.get(transaction.category) ?? 0) + transaction.amount);
      }
    }
    return [...sums].sort((a, b) => b[1] - a[1]);
  })();
  const highest = categories[0]?.[1] ?? 0;
  const availableToSpend = availableBalanceThroughDate(transactions, todayKey);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Insights</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12.5, marginTop: 2 }}>See how your money is going</Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: `${theme.buttonPrimary}14` }]}>
          <Ionicons name="analytics-outline" size={20} color={theme.tint} />
        </View>
      </View>
      {loading ? <ActivityIndicator color={theme.tint} style={styles.loader} /> : (
        <>
          <View style={styles.moneyFlowHeader}>
            <View>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.sectionTitle, { color: theme.text }]}>Money Flow</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                Choose a time period to review.
              </Text>
            </View>
            <View style={[styles.cashflowPeriodSwitch, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {(['week', 'month', 'year'] as const).map((period) => {
                const selected = cashflowPeriod === period;
                return (
                  <SmoothPressable
                    key={period}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setCashflowPeriod(period)}
                    style={[styles.cashflowPeriodOption, selected && { backgroundColor: theme.buttonPrimary }]}
                  >
                    <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: selected ? '#FFFFFF' : theme.textSecondary, fontSize: 11, fontWeight: '700' }}>
                      {period === 'week' ? '7 days' : period === 'month' ? 'This month' : 'This year'}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </View>
          </View>
          <View style={styles.moneyFlowSection}>
            <View style={[styles.moneyFlowHero, { backgroundColor: theme.buttonPrimary }]}>
              <Text style={[styles.safeLabel, { color: '#FFEDD5' }]}>Safe to spend today</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.balance}>{formatMoney(availableToSpend)}</Text>
              <Text style={styles.balanceNote}>
                Wallet balance only · emergency savings excluded
              </Text>
            </View>

            <View style={[styles.flowSummaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.flowSummary}>
                <SpendingRing
                  income={selectedIncome}
                  expenses={selectedExpenses}
                />
                <View style={styles.flowAmounts}>
                  <FlowAmount
                    label="Money in"
                    amount={selectedIncome}
                    color={theme.success}
                  />
                  <FlowAmount
                    label="Money out"
                    amount={selectedExpenses}
                    color={theme.danger}
                  />
                  <FlowAmount
                    label="Cash flow net"
                    amount={netCashflow}
                    color={netCashflow < 0 ? theme.danger : theme.success}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.shortSummary, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}>
              <Text style={[styles.shortSummaryLabel, { color: theme.tint }]}>In short</Text>
              <Text style={[styles.shortSummaryText, { color: theme.text }]}>
                You have {formatMoney(availableToSpend)} safe to spend today
                {selectedExpenses > 0
                  ? ` and spent ${formatMoney(selectedExpenses)} in the selected period.`
                  : '.'}
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Spending habits</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Simple totals from your entries</Text>
            </View>
          </View>
          <View style={[styles.trendsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.trendRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.trendLabel, { color: theme.textSecondary }]}>This week vs last week</Text>
                <Text style={[styles.trendValue, { color: weeklyChange !== null && weeklyChange > 0 ? theme.danger : theme.success }]}>
                  {weeklyChange === null
                    ? 'No previous-week comparison'
                    : `${weeklyChange > 0 ? '+' : ''}${Math.round(weeklyChange)}%`}
                </Text>
              </View>
              <Ionicons
                name={weeklyChange !== null && weeklyChange > 0 ? 'trending-up-outline' : 'trending-down-outline'}
                size={20}
                color={weeklyChange !== null && weeklyChange > 0 ? theme.danger : theme.success}
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Emergency savings</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Money added or used for the selected period</Text>
            </View>
          </View>
          <View style={[styles.cashflow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.monthlyCashflow}>
              <Metric
                label="Savings added"
                amount={fundActivity.added}
                color={theme.success}
                icon="arrow-down-outline"
              />
              <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
              <Metric
                label="Emergency fund used"
                amount={fundActivity.used}
                color={theme.danger}
                icon="arrow-up-outline"
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Where your money went</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Where your money is going this month</Text>
            </View>
            {categories.length > 0 && (
              <View
                accessible
                accessibilityLabel={`${categories.length} spending categories this month`}
                style={[styles.categoryCount, { backgroundColor: theme.card }]}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                  {`${categories.length} categories`}
                </Text>
              </View>
            )}
          </View>
          {categories.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.buttonPrimary}18` }]}>
                <Ionicons name="bar-chart-outline" size={24} color={theme.tint} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Your insights will grow here</Text>
              <Text style={{ color: theme.textSecondary, marginTop: 4, textAlign: 'center', fontSize: 12.5 }}>Record income and expenses to see your spending breakdown.</Text>
            </View>
          ) : (
            <View style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {categories.map(([category, amount], index) => (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryLine}>
                    <View style={styles.categoryLabel}>
                      <View style={[styles.categoryDot, { backgroundColor: theme.chartColors[index % theme.chartColors.length] }]} />
                      <Text style={[styles.categoryName, { color: theme.text }]}>{category}</Text>
                    </View>
                    <Text style={[styles.categoryAmount, { color: theme.text }]}>{formatMoney(amount)}</Text>
                  </View>
                  <View style={[styles.track, { backgroundColor: theme.buttonSecondary }]}>
                    <View style={[styles.bar, { width: `${Math.max((amount / highest) * 100, 4)}%`, backgroundColor: theme.chartColors[index % theme.chartColors.length] }]} />
                  </View>
                  <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                    {expenses > 0 ? `${Math.round((amount / expenses) * 100)}% of spending` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[styles.footnote, { color: theme.textSecondary }]}>
            Calculated on this device from transactions dated this month.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

export default InsightsScreen;

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function SpendingRing({ income, expenses }: { income: number; expenses: number }) {
  const theme = useTheme();
  const size = 104;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = income > 0
    ? Math.round(Math.min(expenses / income, 1) * 100)
    : expenses > 0 ? 100 : 0;
  const fraction = percent / 100;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${percent}% of money in spent`} style={styles.spendingRing}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.success}
          strokeWidth={stroke}
          fill="none"
        />
        {fraction > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.danger}
            strokeWidth={stroke}
            strokeLinecap="butt"
            strokeDasharray={`${circumference * fraction} ${circumference}`}
            strokeDashoffset={0}
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <View style={styles.spendingRingCenter}>
        <Text style={[styles.spendingRingPercent, { color: theme.text }]}>{percent}%</Text>
        <Text style={[styles.spendingRingLabel, { color: theme.textSecondary }]}>spent</Text>
      </View>
    </View>
  );
}

function FlowAmount({ label, amount, color }: { label: string; amount: number; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.flowAmount}>
      <Text style={[styles.flowAmountLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.flowAmountValue, { color }]}>{formatMoney(amount)}</Text>
    </View>
  );
}

function Metric({ label, amount, color, icon }: {
  label: string;
  amount: number;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  const theme = useTheme();
  return (
    <View style={styles.metric}>
      <View style={styles.metricLabel}>
        <View style={[styles.metricIcon, { backgroundColor: `${color}14` }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{label}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.text, fontSize: 15, fontWeight: '700', marginTop: 6 }}>{formatMoney(amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  headerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  moneyFlowHero: { borderRadius: 20, padding: 18, minHeight: 128, justifyContent: 'center', overflow: 'hidden' },
  safeLabel: { fontSize: 11.5, fontWeight: '700', marginBottom: 2 },
  cardLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  balanceLabel: { color: '#FFEDD5', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  balance: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginTop: 6, letterSpacing: -0.5 },
  balanceNote: { color: '#FFEDD5', fontSize: 11.5, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  moneyFlowHeader: { gap: 8 },
  moneyFlowSection: { gap: 10 },
  cashflow: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  cashflowPeriodSwitch: { width: '100%', maxWidth: 240, minWidth: 0, flexDirection: 'row', padding: 3, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  cashflowPeriodOption: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 32, borderRadius: 9 },
  monthlyCashflow: { flexDirection: 'row', alignItems: 'center' },
  flowSummary: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 4 },
  flowSummaryCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 14 },
  spendingRing: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center' },
  spendingRingCenter: { alignItems: 'center' },
  spendingRingPercent: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  spendingRingLabel: { fontSize: 11, marginTop: 1 },
  flowAmounts: { flex: 1, gap: 8 },
  flowAmount: { gap: 2 },
  flowAmountLabel: { fontSize: 11.5 },
  flowAmountValue: { fontSize: 15, fontWeight: '700' },
  shortSummary: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10, gap: 3 },
  shortSummaryLabel: { fontSize: 11, fontWeight: '700' },
  shortSummaryText: { fontSize: 12.5, lineHeight: 18 },
  metric: { flex: 1, minWidth: 0 },
  metricLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricIcon: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metricDivider: { width: StyleSheet.hairlineWidth, height: 38, marginHorizontal: 12 },
  categoryCount: { minHeight: 26, paddingHorizontal: 8, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  trendsCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  trendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  trendLabel: { fontSize: 12 },
  trendValue: { fontSize: 16, fontWeight: '700', marginTop: 3 },
  categoryCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 14 },
  categoryRow: { gap: 6 },
  categoryLine: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryName: { fontSize: 13.5, fontWeight: '600' },
  categoryAmount: { fontSize: 13, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 3 },
  empty: { alignItems: 'center', padding: 22, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  emptyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 14.5, fontWeight: '700', marginTop: 8 },
  footnote: { fontSize: 11.5, lineHeight: 16, textAlign: 'center' },
  loader: { padding: 40 },
});
