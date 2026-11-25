import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { SmoothPressable } from '@/components/SmoothPressable';
import { emergencyFundMovement, type LedgerTransaction, type UpcomingEvent } from '@/db/ledger';
import { useCurrentDate } from '@/hooks/useCurrentDate';
import { formatDate, formatMoney, sumByType } from '@/ledger/format';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';

export function ActivityCalendar({
  transactions,
  events,
  eventsLoading,
}: {
  transactions: LedgerTransaction[];
  events: UpcomingEvent[];
  eventsLoading: boolean;
}) {
  const theme = useTheme();
  const { settings } = useSettings();
  const currentDate = useCurrentDate();
  const todayKey = toDateKey(currentDate);
  const [visibleMonthOverride, setVisibleMonthOverride] = useState<Date | null>(null);
  const visibleMonth = visibleMonthOverride
    ?? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const [selectedDateOverride, setSelectedDateOverride] = useState<string | null>(null);
  const selectedDate = selectedDateOverride ?? todayKey;
  const selectedTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.transaction_date === selectedDate),
    [transactions, selectedDate]
  );
  const selectedEvents = useMemo(
    () => events.filter((event) => event.event_date === selectedDate),
    [events, selectedDate]
  );
  const selectedIncome = sumByType(selectedTransactions, 'income');
  const selectedExpenses = sumByType(selectedTransactions, 'expense');
  const selectedSavings = sumByType(selectedTransactions, 'savings');

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    const isCurrentMonth = nextMonth.getFullYear() === currentDate.getFullYear()
      && nextMonth.getMonth() === currentDate.getMonth();
    setVisibleMonthOverride(isCurrentMonth ? null : nextMonth);
    setSelectedDateOverride(isCurrentMonth ? null : toDateKey(nextMonth));
  };

  return (
    <View style={styles.container}>
      <CalendarCard
        month={visibleMonth}
        transactions={transactions}
        events={events}
        selectedDate={selectedDate}
        eventsLoading={eventsLoading}
        onChangeMonth={changeMonth}
        onSelectDate={setSelectedDateOverride}
      />
      <View style={[styles.selectedDayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.selectedDayHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{formatDate(selectedDate, settings.language)}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 3 }}>Selected date</Text>
          </View>
          <View style={styles.selectedNetBlock}>
            <Text style={[styles.netLabel, { color: theme.textSecondary }]}>Money left</Text>
            <Text style={[styles.selectedNet, { color: selectedIncome - selectedExpenses - selectedSavings >= 0 ? theme.success : theme.danger }]}>
              {formatMoney(selectedIncome - selectedExpenses - selectedSavings)}
            </Text>
          </View>
        </View>
        <View style={styles.selectedMetrics}>
          <Metric label="Income" amount={selectedIncome} color={theme.success} icon="arrow-down-outline" />
          <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
          <Metric label="Expenses" amount={selectedExpenses} color={theme.danger} icon="arrow-up-outline" />
        </View>
        {selectedTransactions.length === 0 && selectedEvents.length === 0 ? (
          <Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>No activity or events for this day.</Text>
        ) : (
          selectedEvents.map((event) => (
            <View key={event.id} style={[styles.selectedEvent, { borderTopColor: theme.border }]}>
              <Ionicons name="calendar-outline" size={16} color={theme.warning} />
              <Text translate={false} style={[styles.eventTitle, { color: theme.text }]}>{event.title}</Text>
              {event.amount > 0 && (
                <Text style={[styles.eventAmount, { color: theme.textSecondary }]}>{formatMoney(event.amount)}</Text>
              )}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function CalendarCard({
  month,
  transactions,
  events,
  selectedDate,
  eventsLoading,
  onChangeMonth,
  onSelectDate,
}: {
  month: Date;
  transactions: LedgerTransaction[];
  events: UpcomingEvent[];
  selectedDate: string;
  eventsLoading: boolean;
  onChangeMonth: (offset: number) => void;
  onSelectDate: (date: string) => void;
}) {
  const theme = useTheme();
  const { settings } = useSettings();
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (days.length % 7 !== 0) days.push(null);

  const activityByDate = new Map<string, { income: boolean; expense: boolean; savings: boolean; event: boolean }>();
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  for (const transaction of transactions) {
    if (!transaction.transaction_date.startsWith(monthKey)) continue;
    const current = activityByDate.get(transaction.transaction_date) ?? { income: false, expense: false, savings: false, event: false };
    if (emergencyFundMovement(transaction) !== 0) current.savings = true;
    else current[transaction.type] = true;
    activityByDate.set(transaction.transaction_date, current);
  }
  for (const event of events) {
    if (!event.event_date.startsWith(monthKey)) continue;
    const current = activityByDate.get(event.event_date) ?? { income: false, expense: false, savings: false, event: false };
    current.event = true;
    activityByDate.set(event.event_date, current);
  }
  const monthTitle = month.toLocaleDateString(
    settings.language === 'tl' ? 'fil-PH' : 'en-PH',
    { month: 'long', year: 'numeric' }
  );

  return (
    <View style={[styles.calendarCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.calendarHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Calendar</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 3 }}>Your daily money activity</Text>
        </View>
        <View style={styles.monthControls}>
          <SmoothPressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => onChangeMonth(-1)} style={[styles.monthButton, { backgroundColor: theme.buttonSecondary }]}>
            <Ionicons name="chevron-back" size={17} color={theme.text} />
          </SmoothPressable>
          <SmoothPressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => onChangeMonth(1)} style={[styles.monthButton, { backgroundColor: theme.buttonSecondary }]}>
            <Ionicons name="chevron-forward" size={17} color={theme.text} />
          </SmoothPressable>
        </View>
      </View>
      <Text style={[styles.monthTitle, { color: theme.text }]}>{monthTitle}</Text>
      <View style={styles.calendarGrid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Text key={`${day}-${index}`} style={[styles.weekday, { color: theme.textSecondary }]}>{day}</Text>
        ))}
        {days.map((day, index) => {
          if (day === null) return <View key={`blank-${index}`} style={styles.dayCell} />;
          const date = toDateKey(new Date(year, monthIndex, day));
          const activity = activityByDate.get(date);
          const selected = date === selectedDate;
          const today = date === toDateKey(new Date());
          return (
            <SmoothPressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={`${monthTitle} ${day}${activity ? ', has activity' : ''}`}
              accessibilityState={{ selected }}
              onPress={() => onSelectDate(date)}
              style={styles.dayCell}
            >
              <View style={[
                styles.dayNumberWrap,
                selected && { backgroundColor: theme.buttonPrimary },
                !selected && today && { borderColor: theme.tint, borderWidth: 1 },
              ]}>
                <Text style={{ color: selected ? '#FFFFFF' : theme.text, fontSize: 13, fontWeight: selected || today ? '800' : '500' }}>{day}</Text>
              </View>
              <View style={styles.dayMarkers}>
                {activity?.income && <View style={[styles.dayMarker, { backgroundColor: theme.success }]} />}
                {activity?.expense && <View style={[styles.dayMarker, { backgroundColor: theme.danger }]} />}
                {activity?.savings && <View style={[styles.dayMarker, { backgroundColor: theme.accent }]} />}
                {activity?.event && <View style={[styles.dayMarker, { backgroundColor: theme.warning }]} />}
              </View>
            </SmoothPressable>
          );
        })}
      </View>
      <View style={styles.legend}>
        <LegendItem label="Income" color={theme.success} />
        <LegendItem label="Expense" color={theme.danger} />
        <LegendItem label="Savings" color={theme.accent} />
        <LegendItem label="Event" color={theme.warning} />
      </View>
      {eventsLoading && <ActivityIndicator size="small" color={theme.tint} />}
    </View>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{label}</Text>
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
        <View style={[styles.metricIcon, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={15} color={color} />
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{label}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginTop: 8 }}>{formatMoney(amount)}</Text>
    </View>
  );
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  calendarCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 15, gap: 12 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthControls: { flexDirection: 'row', gap: 6 },
  monthButton: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 14.5, fontWeight: '600', textAlign: 'center', marginTop: -2 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.2857%', height: 24, textAlign: 'center', fontSize: 11, fontWeight: '600', paddingTop: 2 },
  dayCell: { width: '14.2857%', height: 42, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 1 },
  dayNumberWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayMarkers: { height: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2.5, marginTop: 2 },
  dayMarker: { width: 4, height: 4, borderRadius: 2 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  selectedDayCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 10 },
  selectedDayHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedNetBlock: { alignItems: 'flex-end' },
  netLabel: { fontSize: 10, fontWeight: '500', marginBottom: 1 },
  selectedNet: { fontSize: 15, fontWeight: '700' },
  selectedMetrics: { flexDirection: 'row', alignItems: 'center' },
  emptyCopy: { fontSize: 12 },
  selectedEvent: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 9 },
  eventTitle: { flex: 1, fontSize: 13, fontWeight: '500' },
  eventAmount: { fontSize: 12, fontWeight: '600' },
  metric: { flex: 1, minWidth: 0 },
  metricLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricIcon: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metricDivider: { width: StyleSheet.hairlineWidth, height: 38, marginHorizontal: 12 },
});
