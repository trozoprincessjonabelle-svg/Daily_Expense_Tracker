import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  addEmergencyFund,
  addUpcomingEvent,
  deleteUpcomingEvent,
  getEmergencyFund,
  listEvents,
  payUpcomingEvent as payUpcomingEventRecord,
  setEmergencyFundBalance,
  spendEmergencyFund as spendEmergencyFundRecord,
  transferFromEmergencyFund,
  transferToEmergencyFund,
  updateUpcomingEvent,
  type EmergencyFund,
  type UpcomingEvent,
  type UpcomingEventInput,
} from '@/db/ledger';
import { showMessage } from '@/utils/confirm';

const EMPTY_FUND: EmergencyFund = { balance: 0, goal: 0 };

export function useLedgerFeatures() {
  const [fund, setFund] = useState(EMPTY_FUND);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [nextFund, nextEvents] = await Promise.all([
      getEmergencyFund(),
      listEvents(),
    ]);
    setFund(nextFund);
    setEvents(nextEvents);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([getEmergencyFund(), listEvents()])
        .then(([nextFund, nextEvents]) => {
          if (!active) return;
          setFund(nextFund);
          setEvents(nextEvents);
        })
        .catch((error: unknown) => {
          showMessage(
            'Unable to load Plans',
            error instanceof Error ? error.message : 'Please try again.'
          );
        })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [])
  );

  const saveFund = useCallback(async (amount: number, goal: number | null) => {
    await addEmergencyFund(amount, goal);
    await refresh();
  }, [refresh]);

  const spendFund = useCallback(async (amount: number, description: string) => {
    await spendEmergencyFundRecord(amount, description);
    await refresh();
  }, [refresh]);

  const transferToFund = useCallback(async (amount: number) => {
    await transferToEmergencyFund(amount);
    await refresh();
  }, [refresh]);

  const transferFromFund = useCallback(async (amount: number) => {
    await transferFromEmergencyFund(amount);
    await refresh();
  }, [refresh]);

  const editFundBalance = useCallback(async (balance: number) => {
    await setEmergencyFundBalance(balance);
    await refresh();
  }, [refresh]);

  const saveEvent = useCallback(async (input: UpcomingEventInput) => {
    await addUpcomingEvent(input);
    await refresh();
  }, [refresh]);

  const editEvent = useCallback(async (id: string, input: UpcomingEventInput) => {
    await updateUpcomingEvent(id, input);
    await refresh();
  }, [refresh]);

  const payEvent = useCallback(async (id: string) => {
    try {
      await payUpcomingEventRecord(id);
      await refresh();
    } catch (error) {
      showMessage(
        'Unable to pay upcoming event',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  }, [refresh]);

  const removeEvent = useCallback(async (id: string) => {
    try {
      await deleteUpcomingEvent(id);
      await refresh();
    } catch (error) {
      showMessage(
        'Unable to delete event',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  }, [refresh]);

  return { fund, events, loading, saveFund, spendFund, transferToFund, transferFromFund, editFundBalance, saveEvent, editEvent, payEvent, removeEvent };
}
