import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Button } from '@/components/Button';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { DailySummaryModal } from '@/components/ledger/DailySummaryModal';
import { HomeNotificationsModal } from '@/components/ledger/HomeNotificationsModal';
import { CriticalLowCashModal } from '@/components/ledger/CriticalLowCashModal';
import { CalculatorModal } from '@/components/ledger/CalculatorModal';
import { TransactionForm } from '@/components/ledger/TransactionForm';
import { TransactionRow } from '@/components/ledger/TransactionRow';
import { useLedgerFeatures } from '@/hooks/useLedgerFeatures';
import { useCurrentDateKey } from '@/hooks/useCurrentDate';
import { useLedgerTransactions } from '@/hooks/useLedgerTransactions';
import { balanceThroughDate, formatDate, formatMoney, formatTime, sumByType } from '@/ledger/format';
import { isEmergencyFundMovement, listTransactions, type LedgerTransaction } from '@/db/ledger';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';
import { SmoothPressable } from '@/components/SmoothPressable';
import { confirmAction, showMessage } from '@/utils/confirm';
import { loadNotificationsReadAt, markNotificationsRead } from '@/ledger/notifications';
import { loadRecentActivityResetAt, resetRecentActivity } from '@/ledger/recentActivity';
import { loadDailySummaryHandledDate, markDailySummaryHandled } from '@/ledger/dailySummary';
import { DEFAULT_LOW_CASH_PERCENT, loadLowCashPercent } from '@/ledger/lowCash';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettings();
  const { transactions, loading, save, remove, removeMany } = useLedgerTransactions();
  const { events, loading: eventsLoading } = useLedgerFeatures();
  const [editingTransaction, setEditingTransaction] = useState<LedgerTransaction | null>(null);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notificationsReadAt, setNotificationsReadAt] = useState<number | null>(null);
  const [lowCashPercent, setLowCashPercent] = useState(DEFAULT_LOW_CASH_PERCENT);
  const [criticalAlertVisible, setCriticalAlertVisible] = useState(false);
  const [dailySummary, setDailySummary] = useState<{ date: string; transactions: typeof transactions } | null>(null);
  const [recentActivityResetAt, setRecentActivityResetAt] = useState(0);
  const [recentActivityReady, setRecentActivityReady] = useState(false);
  const [resettingRecentActivity, setResettingRecentActivity] = useState(false);
  const [deletingRecentActivity, setDeletingRecentActivity] = useState(false);
  const criticalAlertDismissed = useRef(false);
  const todayKey = useCurrentDateKey();
  const todayTransactions = transactions.filter(
    (transaction) => transaction.transaction_date === todayKey
  );
  const todayIncome = sumByType(todayTransactions, 'income');
  const todayExpenses = sumByType(todayTransactions, 'expense');
  const dailyRemaining = todayIncome - todayExpenses;
  const balance = balanceThroughDate(transactions, todayKey);
  const availableToSpend = Math.max(0, balance);
  const availableToday = availableToSpend + todayExpenses;
  const budgetUsedPercent = todayExpenses === 0
    ? 0
    : availableToday > 0
      ? (todayExpenses / availableToday) * 100
      : null;
  const remainingPercent = todayIncome > 0
    ? Math.max(0, (dailyRemaining / todayIncome) * 100)
    : null;
  const lowCashLimit = todayIncome * lowCashPercent / 100;
  const alertThresholdReached = todayIncome > 0
    ? dailyRemaining <= lowCashLimit
    : todayExpenses > 0;
  const showLowCashWarning = alertThresholdReached;
  const lowCashTone = remainingPercent !== null && remainingPercent <= 10
    ? {
      color: theme.warning,
      background: theme.warningSurface,
      border: theme.warningBorder,
    }
    : remainingPercent !== null && remainingPercent <= lowCashPercent
      ? {
        color: settings.theme === 'dark' ? theme.warning : '#A86528',
        background: theme.warningSurface,
        border: theme.warningBorder,
      }
      : { color: theme.textSecondary, background: theme.card, border: theme.border };
  const notificationCount = notificationsReadAt === null
    ? 0
    : events.filter((event) => event.created_at > notificationsReadAt).length
      + transactions.filter((transaction) => transaction.created_at > notificationsReadAt).length;
  const recentTransactions = transactions
    .filter((transaction) => transaction.created_at > recentActivityResetAt)
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 5);
  const recentActivityDate = recentTransactions[0]?.transaction_date;
  useEffect(() => {
    if (!alertThresholdReached) {
      criticalAlertDismissed.current = false;
      return;
    }
    if (!criticalAlertDismissed.current) setCriticalAlertVisible(true);
  }, [alertThresholdReached]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadNotificationsReadAt()
        .then((timestamp) => { if (active) setNotificationsReadAt(timestamp); })
        .catch((error: unknown) => showMessage(
          'Unable to load notification status',
          error instanceof Error ? error.message : 'Please try again.'
        ));
      return () => { active = false; };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!recentActivityReady || dailySummary !== null) return () => { active = false; };

      const checkDailySummary = async () => {
        const yesterday = new Date(`${todayKey}T12:00:00`);
        yesterday.setDate(yesterday.getDate() - 1);
        const summaryDate = toDateKey(yesterday);
        const handledDate = await loadDailySummaryHandledDate();
        if (!active || handledDate === summaryDate) return;

        const dayTransactions = (await listTransactions())
          .filter((transaction) => transaction.transaction_date === summaryDate);
        if (!active) return;
        if (dayTransactions.length > 0) {
          setDailySummary({ date: summaryDate, transactions: dayTransactions });
          return;
        }

        const resetAt = await resetRecentActivity();
        await markDailySummaryHandled(summaryDate);
        if (active) setRecentActivityResetAt(resetAt);
      };

      checkDailySummary().catch((error: unknown) => showMessage(
        'Unable to load daily recap',
        error instanceof Error ? error.message : 'Please try again.'
      ));
      return () => { active = false; };
    }, [dailySummary, recentActivityReady, todayKey])
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadRecentActivityResetAt()
        .then((timestamp) => {
          if (active) {
            setRecentActivityResetAt(timestamp);
            setRecentActivityReady(true);
          }
        })
        .catch((error: unknown) => showMessage(
          'Unable to load recent activity',
          error instanceof Error ? error.message : 'Please try again.'
        ));
      return () => { active = false; };
    }, [])
  );

  const closeDailySummary = async () => {
    if (!dailySummary || resettingRecentActivity) return;
    setResettingRecentActivity(true);
    try {
      const resetAt = await resetRecentActivity();
      await markDailySummaryHandled(dailySummary.date);
      setRecentActivityResetAt(resetAt);
      setDailySummary(null);
    } catch (error) {
      showMessage(
        'Unable to close daily recap',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setResettingRecentActivity(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadLowCashPercent()
        .then((percent) => { if (active) setLowCashPercent(percent); })
        .catch((error: unknown) => showMessage(
          'Unable to load low-cash alert',
          error instanceof Error ? error.message : 'Please try again.'
        ));
      return () => { active = false; };
    }, [])
  );

  const markAllRead = async () => {
    try {
      setNotificationsReadAt(await markNotificationsRead());
    } catch (error) {
      showMessage(
        'Unable to mark notifications as read',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  };

  const confirmDeleteRecentActivity = () => {
    if (recentTransactions.length === 0 || deletingRecentActivity) return;
    const transactionIds = recentTransactions.map((transaction) => transaction.id);
    confirmAction(
      'Are you sure you want to delete all recent activity?',
      'This permanently deletes the recent transactions shown on Home. This cannot be undone. Deleting emergency-fund entries also changes your emergency-fund balance.',
      'Delete',
      async () => {
        setDeletingRecentActivity(true);
        try {
          await removeMany(transactionIds);
        } finally {
          setDeletingRecentActivity(false);
        }
      }
    );
  };

  const dismissCriticalAlert = () => {
    criticalAlertDismissed.current = true;
    setCriticalAlertVisible(false);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.greetingWrap}>
          <Text numberOfLines={1} style={[styles.greeting, { color: theme.text }]}>
            Hi, {settings.nickname
              ? <Text translate={false}>{settings.nickname}</Text>
              : 'there'}
          </Text>
          <Text style={[styles.subGreeting, { color: theme.textSecondary }]}>
            {formatDate(todayKey, settings.language)}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <SmoothPressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications${notificationCount > 0 ? `, ${notificationCount > 9 ? '9 or more' : notificationCount} unread updates` : ''}`}
            onPress={() => setNotificationsVisible(true)}
            style={[
              styles.headerIconButton,
              {
                backgroundColor: notificationCount > 0 ? `${theme.tint}14` : theme.card,
                borderColor: notificationCount > 0 ? `${theme.tint}50` : theme.border,
              },
            ]}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.tint} />
            {notificationCount > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: theme.danger }]}>
                <Text style={styles.notificationBadgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            )}
          </SmoothPressable>
          <SmoothPressable
            accessibilityRole="button"
            accessibilityLabel="History"
            accessibilityHint="Opens transaction history"
            onPress={() => router.navigate('/(tabs)/history' as Href)}
            style={[styles.headerIconButton, { backgroundColor: theme.buttonPrimary, borderColor: theme.buttonPrimary }]}
          >
            <Ionicons name="time-outline" size={20} color="#FFFFFF" />
          </SmoothPressable>
        </View>
      </View>

      {showLowCashWarning && (
        <View style={[styles.lowCashCard, { backgroundColor: lowCashTone.background, borderColor: lowCashTone.border }]}>
          <View style={[styles.lowCashIcon, { backgroundColor: `${lowCashTone.color}18` }]}>
            <Ionicons name="warning-outline" size={18} color={lowCashTone.color} />
          </View>
          <View style={styles.lowCashCopy}>
            <Text style={[styles.lowCashTitle, { color: lowCashTone.color }]}>
              {remainingPercent !== null && remainingPercent <= 10
                ? 'Very low balance'
                : alertThresholdReached
                  ? 'Low-cash warning'
                  : 'Money running low'}
            </Text>
            <Text style={[styles.lowCashText, { color: theme.textSecondary }]}>
              Money left today:{' '}
              <Text style={{ color: lowCashTone.color, fontWeight: '700' }}>
                {formatMoney(dailyRemaining)} ({Math.round(remainingPercent ?? 0)}%)
              </Text>.
              {alertThresholdReached
                ? ` At or below your ${lowCashPercent}% alert limit.`
                : ` Daily alert set for ${lowCashPercent}%.`}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.balanceCard, { backgroundColor: theme.buttonPrimary }]}>
        <View style={styles.balanceContentRow}>
          <View style={styles.balanceTextCol}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.balance}>
              {formatMoney(balance)}
            </Text>
            <View style={styles.balanceFoot}>
              <Ionicons name={balance >= 0 ? 'trending-up-outline' : 'trending-down-outline'} size={14} color="#FFEDD5" />
              <Text style={styles.balanceHint}>Regular wallet</Text>
            </View>
          </View>

          <View style={styles.balanceActionCol}>
            <BudgetUsageRing percent={budgetUsedPercent} color={theme.accent} />
            <SmoothPressable
              accessibilityRole="button"
              accessibilityLabel="Open calculator"
              onPress={() => setCalculatorVisible(true)}
              style={[styles.calculatorButton, { backgroundColor: theme.accent }]}
            >
              <Ionicons name="calculator-outline" size={21} color="#1A0E05" />
            </SmoothPressable>
          </View>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard label="Income today" amount={todayIncome} icon="arrow-down" color={theme.success} />
        <SummaryCard label="Expenses today" amount={todayExpenses} icon="arrow-up" color={theme.danger} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
        <SmoothPressable onPress={() => router.navigate('/(tabs)/history' as Href)}>
          <View style={styles.seeAll}>
            <Text style={{ color: theme.tint, fontWeight: '600', fontSize: 13 }}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.tint} />
          </View>
        </SmoothPressable>
      </View>
      {loading ? (
        <ActivityIndicator color={theme.tint} style={styles.loader} />
      ) : recentTransactions.length === 0 ? (
        <EmptyState
          text={transactions.length === 0
            ? 'No transactions today yet.'
            : 'No recent activity. Your transactions are still saved in History.'}
        />
      ) : (
        <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {recentTransactions.map((transaction, index) => (
            <View
              key={transaction.id}
              style={[
                styles.activityRow,
                index < recentTransactions.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <View style={styles.transactionItem}>
                <TransactionRow
                  transaction={transaction}
                  onPress={!isEmergencyFundMovement(transaction) ? () => setEditingTransaction(transaction) : undefined}
                  timeLabel={transaction.transaction_date === recentActivityDate
                    ? formatTime(transaction.created_at, settings.language)
                    : `${formatDate(transaction.transaction_date, settings.language)} · ${formatTime(transaction.created_at, settings.language)}`}
                />
              </View>
              <SmoothPressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${transaction.category} transaction`}
                onPress={() => confirmAction(
                  'Are you sure you want to delete this transaction?',
                  `${transaction.category} · ${formatMoney(transaction.amount)}. ${isEmergencyFundMovement(transaction) ? 'This will also update your emergency fund balance. ' : ''}This cannot be undone.`,
                  'Delete',
                  () => remove(transaction.id)
                )}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={16} color={theme.danger} />
              </SmoothPressable>
            </View>
          ))}
        </View>
      )}
      {recentTransactions.length > 0 && (
        <Button
          label="Delete all recent activity"
          variant="secondary"
          loading={deletingRecentActivity}
          accessibilityHint="Permanently deletes the recent transactions shown on Home and updates your emergency-fund balance"
          onPress={confirmDeleteRecentActivity}
        />
      )}
      <Text style={[styles.offlineNote, { color: theme.textSecondary }]}>
        Your money data stays on this device
      </Text>
      <HomeNotificationsModal
        visible={notificationsVisible}
        events={events}
        transactions={transactions}
        loading={loading || eventsLoading}
        unreadCount={notificationCount}
        onClose={() => setNotificationsVisible(false)}
        onMarkAllRead={() => void markAllRead()}
      />
      <DailySummaryModal
        visible={dailySummary !== null}
        date={dailySummary?.date ?? todayKey}
        transactions={dailySummary?.transactions ?? []}
        closing={resettingRecentActivity}
        onClose={() => void closeDailySummary()}
      />
      <CriticalLowCashModal
        visible={criticalAlertVisible && dailySummary === null}
        remaining={dailyRemaining}
        percent={Math.round(remainingPercent ?? 0)}
        onClose={dismissCriticalAlert}
      />
      <CalculatorModal
        visible={calculatorVisible}
        onClose={() => setCalculatorVisible(false)}
      />
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

function SummaryCard({ label, amount, icon, color }: {
  label: string;
  amount: number;
  icon: 'arrow-down' | 'arrow-up';
  color: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.summaryHeading}>
        <View style={[styles.summaryIcon, { backgroundColor: `${color}14` }]}>
          <Ionicons name={icon} size={15} color={color} />
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '500' }}>{label}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.summaryAmount, { color }]}>
        {formatMoney(amount)}
      </Text>
    </View>
  );
}

function BudgetUsageRing({ percent, color }: { percent: number | null; color: string }) {
  const size = 64;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = percent === null ? 0 : Math.min(Math.max(percent / 100, 0), 1);
  const label = percent === null ? 'No available money today' : `${Math.round(percent)}% of today’s available regular balance used`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={styles.budgetUsageRing}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FFFFFF30"
          strokeWidth={stroke}
          fill="none"
        />
        {fraction > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - fraction)}
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <View style={styles.budgetUsageCenter}>
        <Text style={styles.budgetUsagePercent}>
          {percent === null ? '—' : `${Math.round(percent)}%`}
        </Text>
        <Text style={styles.budgetUsageLabel}>USED</Text>
      </View>
    </View>
  );
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function EmptyState({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Ionicons name="receipt-outline" size={26} color={theme.textSecondary} />
      <Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 13, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  greetingWrap: { flex: 1, minWidth: 0 },
  greeting: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  subGreeting: { fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconButton: { width: 40, height: 40, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  notificationBadge: { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  notificationBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  balanceCard: { borderRadius: 20, padding: 18, minHeight: 128, justifyContent: 'space-between', gap: 10 },
  balanceContentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  balanceTextCol: { flex: 1, minWidth: 0, gap: 4 },
  balanceLabel: { color: '#FFEDD5', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  balance: { flexShrink: 1, minWidth: 0, color: '#FFFFFF', fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
  balanceFoot: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  balanceHint: { color: '#FFEDD5', fontSize: 12 },
  balanceActionCol: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginLeft: 12 },
  calculatorButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  budgetUsageRing: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  budgetUsageCenter: { alignItems: 'center', gap: 1 },
  budgetUsagePercent: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  budgetUsageLabel: { color: '#FFEDD5', fontSize: 7, fontWeight: '700', letterSpacing: 0.5 },
  listCard: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 13, minHeight: 76, justifyContent: 'center', gap: 8 },
  summaryHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  summaryIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  summaryAmount: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  lowCashCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  lowCashIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  lowCashCopy: { flex: 1, gap: 2 },
  lowCashTitle: { fontSize: 13, fontWeight: '700' },
  lowCashText: { fontSize: 12, lineHeight: 17 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  transactionItem: { flex: 1, minWidth: 0 },
  deleteButton: { width: 36, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  loader: { padding: 24 },
  empty: { borderRadius: 16, minHeight: 100, justifyContent: 'center', alignItems: 'center', padding: 18, borderWidth: StyleSheet.hairlineWidth },
  offlineNote: { textAlign: 'center', fontSize: 11.5, lineHeight: 16, marginTop: 2 },
});
