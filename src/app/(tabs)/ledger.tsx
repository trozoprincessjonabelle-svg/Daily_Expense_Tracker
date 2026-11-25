import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { SmoothPressable } from '@/components/SmoothPressable';
import { ActivityCalendar } from '@/components/ledger/ActivityCalendar';
import { UpcomingEventModal } from '@/components/ledger/LedgerFeatureModals';
import { SavingsGoalsSection } from '@/components/ledger/SavingsGoalsSection';
import { TransactionForm } from '@/components/ledger/TransactionForm';
import { isEmergencyFundMovement, type TransactionInput, type UpcomingEvent } from '@/db/ledger';
import { useLedgerFeatures } from '@/hooks/useLedgerFeatures';
import { useLedgerTransactions } from '@/hooks/useLedgerTransactions';
import { useCurrentDate } from '@/hooks/useCurrentDate';
import { formatDate, formatMoney } from '@/ledger/format';
import { useTheme } from '@/theme';
import { useSettings } from '@/settings/SettingsContext';
import { confirmAction } from '@/utils/confirm';

export default function LedgerScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const router = useRouter();
  const params = useLocalSearchParams<{ add?: string }>();
  const { transactions, save } = useLedgerTransactions();
  const {
    events,
    loading: featuresLoading,
    saveEvent,
    editEvent,
    payEvent,
    removeEvent,
  } = useLedgerFeatures();
  const currentDate = useCurrentDate();
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<UpcomingEvent | null>(null);
  const showForm = params.add === '1';
  const todayKey = toDateKey(currentDate);

  const closeForm = () => {
    if (params.add === '1') router.setParams({ add: undefined });
  };


  const savePlanTransaction = async (
    input: TransactionInput,
    id?: string
  ) => {
    await save(input, id);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ActivityCalendar
          transactions={transactions}
          events={events}
          eventsLoading={featuresLoading}
        />
        <SavingsGoalsSection />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeading}>
            <View style={[styles.icon, { backgroundColor: `${theme.warning}16` }]}>
              <Ionicons name="calendar-outline" size={17} color={theme.warning} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Upcoming costs</Text>
            <SmoothPressable
              accessibilityRole="button"
              accessibilityLabel="Add cost"
              onPress={() => {
                setEditingEvent(null);
                setEventModalVisible(true);
              }}
              style={[styles.smallAction, { backgroundColor: theme.buttonPrimary }]}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.smallActionText}>Add cost</Text>
            </SmoothPressable>
          </View>
          {featuresLoading ? (
            <ActivityIndicator color={theme.tint} />
          ) : events.length === 0 ? (
            <Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>No planned costs yet.</Text>
          ) : (
            <View style={styles.eventList}>
              {events.map((event) => {
                const overdue = event.event_date < todayKey;
                const eventTone = overdue ? theme.danger : theme.warning;
                return (
                  <View key={event.id} style={[styles.eventRow, { borderTopColor: theme.border }]}>
                    <View style={[styles.eventDate, { backgroundColor: `${eventTone}14` }]}>
                      <Text style={[styles.eventDateText, { color: eventTone }]}>{formatDate(event.event_date, settings.language)}</Text>
                    </View>
                    <View style={styles.eventCopy}>
                      <Text translate={false} numberOfLines={1} style={[styles.eventTitle, { color: theme.text }]}>{event.title}</Text>
                      <Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>
                        {event.amount > 0 ? formatMoney(event.amount) : 'No cost set'}
                      </Text>
                      {overdue && <Text style={[styles.eventOverdue, { color: theme.danger }]}>Past due</Text>}
                    </View>
                    <SmoothPressable
                      accessibilityRole="button"
                      accessibilityLabel={`Mark ${event.title} as paid${event.amount > 0 ? `, ${formatMoney(event.amount)}` : ''}`}
                      accessibilityHint={event.amount > 0 ? 'Does not send money; records an expense and removes the event from your event list' : 'Set an estimated cost before marking this event as paid'}
                      disabled={event.amount <= 0}
                      onPress={() => confirmAction(
                        'Mark event as paid?',
                        `This will record ${formatMoney(event.amount)} as an actual expense and remove the planned event. It does not send money or double-count an existing expense.`,
                        'Mark paid',
                        () => payEvent(event.id)
                      )}
                      style={[styles.payButton, { backgroundColor: theme.buttonPrimary, opacity: event.amount > 0 ? 1 : 0.45 }]}
                    >
                      <Text style={styles.payButtonText}>Mark paid</Text>
                    </SmoothPressable>
                    <SmoothPressable
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${event.title}`}
                      onPress={() => setEditingEvent(event)}
                      style={styles.editButton}
                    >
                      <Ionicons name="pencil-outline" size={16} color={theme.tint} />
                    </SmoothPressable>
                    <SmoothPressable
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${event.title}`}
                      onPress={() => confirmAction(
                        'Delete event?',
                        `Remove ${event.title} from your event list?`,
                        'Delete',
                        () => removeEvent(event.id)
                      )}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={16} color={theme.danger} />
                    </SmoothPressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {showForm && (
        <TransactionForm
          key="new"
          visible
          transaction={null}
          regularBalance={transactions.reduce((balance, transaction) => {
            if (transaction.type === 'income'
              && transaction.category === 'Savings'
              && transaction.note === 'Added to emergency fund') {
              return balance - transaction.amount;
            }
            if (isEmergencyFundMovement(transaction)) return balance;
            return balance + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
          }, 0)}
          onClose={closeForm}
          onSave={savePlanTransaction}
        />
      )}
      <UpcomingEventModal
        key={editingEvent?.id ?? 'new-event'}
        visible={eventModalVisible || editingEvent !== null}
        event={editingEvent}
        onClose={() => {
          setEventModalVisible(false);
          setEditingEvent(null);
        }}
        onSave={(input) => editingEvent
          ? editEvent(editingEvent.id, input)
          : saveEvent(input)}
      />
    </View>
  );
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24, gap: 14 },
  card: { padding: 15, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, gap: 12 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fundHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  fundOverview: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  fundIllustration: { width: 100, height: 92, borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  fundCoin: { position: 'absolute', top: -8, left: '50%', marginLeft: -12.5, width: 25, height: 25, borderRadius: 13, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  fundCoinText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', lineHeight: 15 },
  fundDetails: { flex: 1, minWidth: 0, gap: 5 },
  fundBalance: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  emptyCopy: { fontSize: 12.5 },
  smallAction: { marginLeft: 'auto', minHeight: 30, borderRadius: 10, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 3 },
  smallActionText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  eventList: { marginTop: -2 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, paddingBottom: 2 },
  eventDate: { paddingVertical: 4, paddingHorizontal: 7, borderRadius: 7 },
  eventDateText: { fontSize: 11, fontWeight: '700' },
  eventCopy: { flex: 1, gap: 2 },
  eventOverdue: { fontSize: 10.5, fontWeight: '700' },
  eventTitle: { fontSize: 13.5, fontWeight: '600' },
  payButton: { minWidth: 40, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  payButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  editButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  deleteButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  loader: { paddingVertical: 6 },
});
