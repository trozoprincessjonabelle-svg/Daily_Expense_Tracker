import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TransactionForm } from '@/components/ledger/TransactionForm';
import { useLedgerTransactions } from '@/hooks/useLedgerTransactions';
import { useTheme } from '@/theme';

export default function AddTransactionScreen() {
  const theme = useTheme();
  const { save } = useLedgerTransactions();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <TransactionForm
        visible
        transaction={null}
        initialType="expense"
        quickEntry
        closeOnSave={false}
        presentation="inline"
        showCloseButton={false}
        onClose={() => undefined}
        onSave={save}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
