import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { LocalizedTextInput as TextInput } from '@/components/LocalizedTextInput';
import { SmoothPressable } from '@/components/SmoothPressable';
import type { CategoryBudget, MonthlyBudgetPlan } from '@/db/budgets';
import { useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';
import { showMessage } from '@/utils/confirm';
import { Button } from '../Button';

interface BudgetPlanModalProps {
  visible: boolean;
  plan: MonthlyBudgetPlan;
  onClose: () => void;
  onSave: (totalAmount: number | null, categories: CategoryBudget[]) => Promise<void>;
}

interface BudgetDraft {
  category: string;
  amount: string;
}

export function BudgetPlanModal({
  visible,
  plan,
  onClose,
  onSave,
}: BudgetPlanModalProps) {
  const theme = useTheme();
  const { settings } = useSettings();
  const [total, setTotal] = useState(() =>
    plan.totalAmount === null ? '' : String(plan.totalAmount)
  );
  const [rows, setRows] = useState<BudgetDraft[]>(() => plan.categories.map((item) => ({
    category: item.category,
    amount: String(item.amount),
  })));
  const [saving, setSaving] = useState(false);
  const monthLabel = new Date(`${plan.month}-01T12:00:00`).toLocaleDateString(
    settings.language === 'tl' ? 'fil-PH' : 'en-PH',
    { month: 'long', year: 'numeric' }
  );

  const save = async () => {
    const parsedTotal = total.trim() ? parseAmount(total) : null;
    if (total.trim() && (parsedTotal === null || parsedTotal <= 0)) {
      showMessage('Check the monthly budget', 'Enter an amount greater than zero.');
      return;
    }

    const enteredRows = rows.filter((row) => row.category.trim() || row.amount.trim());
    const categories: CategoryBudget[] = [];
    for (const row of enteredRows) {
      const amount = parseAmount(row.amount);
      if (!row.category.trim() || amount === null || amount <= 0) {
        showMessage('Check category budgets', 'Add a category and an amount greater than zero for each limit.');
        return;
      }
      categories.push({ category: row.category.trim(), amount });
    }

    setSaving(true);
    try {
      await onSave(parsedTotal, categories);
      onClose();
    } catch (error) {
      showMessage(
        'Could not save budget',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: theme.text }]}>Set your budget</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{monthLabel}</Text>
            </View>
            <SmoothPressable
              accessibilityRole="button"
              accessibilityLabel="Close budget editor"
              onPress={onClose}
              style={[styles.close, { backgroundColor: theme.card }]}
            >
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </SmoothPressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={[styles.label, { color: theme.text }]}>Total monthly budget</Text>
            <View style={[styles.amountShell, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.currency, { color: theme.tint }]}>₱</Text>
              <TextInput
                accessibilityLabel="Total monthly budget"
                value={total}
                onChangeText={setTotal}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                style={[styles.amountInput, { color: theme.text }]}
              />
            </View>

            <View style={styles.categoryHeader}>
              <View style={styles.headerCopy}>
                <Text style={[styles.label, { color: theme.text }]}>Category limits</Text>
                <Text style={[styles.hint, { color: theme.textSecondary }]}>
                  Add a limit for the categories you want to track.
                </Text>
              </View>
              <SmoothPressable
                accessibilityRole="button"
                accessibilityLabel="Add category budget"
                onPress={() => setRows((current) => [...current, { category: '', amount: '' }])}
                style={[styles.addCategory, { backgroundColor: theme.buttonSecondary }]}
              >
                <Ionicons name="add" size={19} color={theme.tint} />
              </SmoothPressable>
            </View>

            {rows.map((row, index) => (
              <View key={index} style={styles.categoryRow}>
                <TextInput
                  accessibilityLabel={`Budget category ${index + 1}`}
                  value={row.category}
                  onChangeText={(category) => setRows((current) =>
                    current.map((item, itemIndex) => itemIndex === index ? { ...item, category } : item)
                  )}
                  placeholder="Category"
                  placeholderTextColor={theme.textSecondary}
                  maxLength={40}
                  style={[styles.categoryInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                />
                <View style={[styles.categoryAmountShell, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.smallCurrency, { color: theme.textSecondary }]}>₱</Text>
                  <TextInput
                    accessibilityLabel={`Budget amount for category ${index + 1}`}
                    value={row.amount}
                    onChangeText={(amount) => setRows((current) =>
                      current.map((item, itemIndex) => itemIndex === index ? { ...item, amount } : item)
                    )}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.categoryAmount, { color: theme.text }]}
                  />
                </View>
                <SmoothPressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove category budget ${index + 1}`}
                  onPress={() => setRows((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  style={styles.removeCategory}
                >
                  <Ionicons name="close-circle-outline" size={20} color={theme.textSecondary} />
                </SmoothPressable>
              </View>
            ))}

            <Button
              label="Save budget"
              loading={saving}
              disabled={saving}
              onPress={() => void save()}
              style={styles.save}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function parseAmount(value: string): number | null {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { maxHeight: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 26 },
  handle: { width: 38, height: 4, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  headerCopy: { flex: 1, gap: 3 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12 },
  close: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '700' },
  amountShell: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  currency: { fontSize: 20, fontWeight: '700' },
  amountInput: { flex: 1, fontSize: 18, fontWeight: '700', paddingVertical: 8 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, marginBottom: 10 },
  hint: { fontSize: 11, lineHeight: 15, marginTop: 3 },
  addCategory: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  categoryInput: { flex: 1, minWidth: 0, minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, paddingHorizontal: 10, fontSize: 13 },
  categoryAmountShell: { width: 105, minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  smallCurrency: { fontSize: 12 },
  categoryAmount: { flex: 1, minWidth: 0, fontSize: 13, paddingVertical: 6 },
  removeCategory: { width: 25, height: 36, alignItems: 'center', justifyContent: 'center' },
  save: { marginTop: 15 },
});
