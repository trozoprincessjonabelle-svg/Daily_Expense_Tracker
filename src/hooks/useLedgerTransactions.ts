import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  clearTransactionHistory,
  deleteTransaction,
  deleteTransactions,
  listTransactions,
  replaceTransactions,
  saveTransaction,
  type LedgerTransaction,
  type TransactionInput,
} from '@/db/ledger';
import { showMessage } from '@/utils/confirm';

export function useLedgerTransactions() {
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTransactions(await listTransactions());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      listTransactions()
        .then((rows) => { if (active) setTransactions(rows); })
        .catch((error: unknown) => {
          showMessage(
            'Unable to load transactions',
            error instanceof Error ? error.message : 'Please try again.'
          );
        })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [])
  );

  const save = useCallback(async (input: TransactionInput, id?: string) => {
    await saveTransaction(input, id);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteTransaction(id);
      await refresh();
    } catch (error) {
      showMessage(
        'Unable to delete transaction',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  }, [refresh]);

  const removeMany = useCallback(async (ids: readonly string[]) => {
    try {
      await deleteTransactions(ids);
      await refresh();
    } catch (error) {
      showMessage(
        'Unable to delete recent activity',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  }, [refresh]);

  const clear = useCallback(async () => {
    await clearTransactionHistory();
    await refresh();
  }, [refresh]);

  const restore = useCallback(async (rows: TransactionInput[]) => {
    await replaceTransactions(rows);
    await refresh();
  }, [refresh]);

  return { transactions, loading, save, remove, removeMany, clear, restore, refresh };
}
