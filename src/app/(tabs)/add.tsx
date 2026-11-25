import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { SmoothPressable } from '@/components/SmoothPressable';
import { EmergencyFundModal } from '@/components/ledger/LedgerFeatureModals';
import { TransactionForm } from '@/components/ledger/TransactionForm';
import { useCurrentDateKey } from '@/hooks/useCurrentDate';
import { useLedgerFeatures } from '@/hooks/useLedgerFeatures';
import { useLedgerTransactions } from '@/hooks/useLedgerTransactions';
import type { TransactionInput, TransactionType } from '@/db/ledger';
import { balanceThroughDate } from '@/ledger/format';
import { useTheme } from '@/theme';

export default function AddTransactionScreen() {
  const theme = useTheme();
  const todayKey = useCurrentDateKey();
  const { transactions, save, refresh } = useLedgerTransactions();
  const { fund, saveFund, transferToFund, transferFromFund } = useLedgerFeatures();
  const [fundModalVisible, setFundModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);
  const regularBalance = balanceThroughDate(transactions, todayKey);

  const saveTransaction = async (
    input: TransactionInput,
    _id?: string,
    paymentSource: 'regular' | 'emergency' = 'regular'
  ) => {
    if (input.type === 'income' && input.category === 'Emergency fund') {
      await saveFund(input.amount, null);
      await refresh();
      return;
    }
    if (input.type === 'expense' && paymentSource === 'emergency') {
      await transferFromFund(input.amount);
      await refresh();
      return;
    }
    await save(input);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.text }]}>
            {selectedType === 'income'
              ? 'Add income'
              : selectedType === 'expense'
                ? 'Add expense'
                : 'Add transaction'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {selectedType ? 'Enter the details below.' : 'What would you like to add?'}
          </Text>
        </View>

        {selectedType ? (
          <>
            <SmoothPressable
              accessibilityRole="button"
              accessibilityLabel="Back to transaction options"
              onPress={() => setSelectedType(null)}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={18} color={theme.tint} />
              <Text style={[styles.backText, { color: theme.tint }]}>Choose another</Text>
            </SmoothPressable>
            <TransactionForm
              key={`add-${selectedType}`}
              visible
              transaction={null}
              lockedType={selectedType}
              presentation="inline"
              showCloseButton={false}
              allowEmergencyFund
              regularBalance={regularBalance}
              emergencyFundBalance={fund.balance}
              onClose={() => setSelectedType(null)}
              onSave={saveTransaction}
            />
          </>
        ) : (
          <View style={styles.options}>
            {([
              {
                type: 'income',
                title: 'Add income',
                description: 'Record money you received.',
                icon: 'arrow-down-outline',
              },
              {
                type: 'expense',
                title: 'Add expense',
                description: 'Record money you spent.',
                icon: 'arrow-up-outline',
              },
            ] as const).map((option) => (
              <SmoothPressable
                key={option.type}
                accessibilityRole="button"
                accessibilityLabel={option.title}
                onPress={() => setSelectedType(option.type)}
                style={[styles.option, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={[styles.optionIcon, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name={option.icon} size={22} color={theme.tint} />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>{option.title}</Text>
                  <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                    {option.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </SmoothPressable>
            ))}
          </View>
        )}
        <SmoothPressable
          accessibilityRole="button"
          accessibilityLabel="Manage emergency fund"
          onPress={() => setFundModalVisible(true)}
          style={[styles.manageFund, { borderColor: theme.border }]}
        >
          <Ionicons name="shield-checkmark-outline" size={17} color={theme.tint} />
          <Text style={[styles.manageFundText, { color: theme.tint }]}>Manage emergency fund</Text>
        </SmoothPressable>
      </ScrollView>
      <EmergencyFundModal
        visible={fundModalVisible}
        balance={fund.balance}
        goal={fund.goal}
        regularBalance={regularBalance}
        onClose={() => setFundModalVisible(false)}
        onSave={async (amount, goal) => {
          await saveFund(amount, goal);
          await refresh();
        }}
        onTransferTo={async (amount) => {
          await transferToFund(amount);
          await refresh();
        }}
        onTransferFrom={async (amount) => {
          await transferFromFund(amount);
          await refresh();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, gap: 16 },
  heading: { gap: 4 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontSize: 13 },
  options: { gap: 12 },
  option: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
  },
  optionIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  optionCopy: { flex: 1, gap: 3 },
  optionTitle: { fontSize: 15, fontWeight: '700' },
  optionDescription: { fontSize: 12 },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 3 },
  backText: { fontSize: 13, fontWeight: '600' },
  manageFund: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 13,
  },
  manageFundText: { fontSize: 12.5, fontWeight: '600' },
});
