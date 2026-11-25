import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useTheme } from '@/theme';

type Operator = '+' | '−' | '×' | '÷';
type KeyTone = 'number' | 'utility' | 'operator';

function calculate(left: number, right: number, operator: Operator): number | null {
  const result = operator === '+'
    ? left + right
    : operator === '−'
      ? left - right
      : operator === '×'
        ? left * right
        : right === 0
          ? Number.NaN
          : left / right;
  return Number.isFinite(result) ? Number(result.toPrecision(10)) : null;
}

function formatNumber(value: number): string {
  return Number(value.toPrecision(10)).toString();
}

export function CalculatorModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [display, setDisplay] = useState('0');
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [startsNewNumber, setStartsNewNumber] = useState(false);

  const clear = () => {
    setDisplay('0');
    setStoredValue(null);
    setOperator(null);
    setStartsNewNumber(false);
  };

  const close = () => {
    clear();
    onClose();
  };

  const enterDigit = (digit: string) => {
    if (display === 'Error' || startsNewNumber) {
      setDisplay(digit);
      setStartsNewNumber(false);
    } else if (display === '0') {
      setDisplay(digit);
    } else if (display.replace('-', '').replace('.', '').length < 15) {
      setDisplay((current) => current + digit);
    }
  };

  const enterDecimal = () => {
    if (display === 'Error' || startsNewNumber) {
      setDisplay('0.');
      setStartsNewNumber(false);
    } else if (!display.includes('.')) {
      setDisplay((current) => `${current}.`);
    }
  };

  const chooseOperator = (nextOperator: Operator) => {
    const currentValue = Number(display);
    if (!Number.isFinite(currentValue)) {
      clear();
      return;
    }

    if (storedValue !== null && operator && !startsNewNumber) {
      const result = calculate(storedValue, currentValue, operator);
      if (result === null) {
        setDisplay('Error');
        setStoredValue(null);
        setOperator(null);
        setStartsNewNumber(true);
        return;
      }
      setDisplay(formatNumber(result));
      setStoredValue(result);
    } else {
      setStoredValue(currentValue);
    }
    setOperator(nextOperator);
    setStartsNewNumber(true);
  };

  const showResult = () => {
    if (storedValue === null || operator === null || startsNewNumber) return;
    const result = calculate(storedValue, Number(display), operator);
    setDisplay(result === null ? 'Error' : formatNumber(result));
    setStoredValue(null);
    setOperator(null);
    setStartsNewNumber(true);
  };

  const toggleSign = () => {
    if (display === 'Error' || Number(display) === 0) return;
    setDisplay((current) => current.startsWith('-') ? current.slice(1) : `-${current}`);
    setStartsNewNumber(false);
  };

  const percent = () => {
    const value = Number(display);
    if (Number.isFinite(value)) {
      setDisplay(formatNumber(value / 100));
      setStartsNewNumber(true);
    }
  };

  const key = (
    label: string,
    action: () => void,
    tone: KeyTone = 'number',
    wide = false
  ) => (
    <SmoothPressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={
        label === '×' ? 'Multiply'
          : label === '÷' ? 'Divide'
            : label === '−' ? 'Subtract'
              : label === '+' ? 'Add'
                : label === '=' ? 'Equals'
                  : label === '±' ? 'Change sign'
                    : label === '%' ? 'Percent'
                      : label
      }
      onPress={action}
      style={[
        styles.key,
        wide && styles.wideKey,
        {
          backgroundColor: tone === 'operator'
            ? theme.buttonPrimary
            : tone === 'utility'
              ? theme.buttonSecondary
              : theme.background,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={[
        styles.keyText,
        { color: tone === 'operator' ? '#FFFFFF' : theme.text },
      ]}>
        {label}
      </Text>
    </SmoothPressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.overlay}>
        <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Calculator</Text>
            <SmoothPressable
              accessibilityRole="button"
              accessibilityLabel="Close calculator"
              onPress={close}
              style={[styles.closeButton, { backgroundColor: theme.buttonSecondary }]}
            >
              <Ionicons name="close" size={22} color={theme.text} />
            </SmoothPressable>
          </View>
          <View style={[styles.display, { backgroundColor: theme.background, borderColor: theme.border }]}>
            {storedValue !== null && operator !== null && (
              <Text style={[styles.expression, { color: theme.textSecondary }]}>
                {formatNumber(storedValue)} {operator}
              </Text>
            )}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.displayText, { color: theme.text }]}
            >
              {display}
            </Text>
          </View>
          <View style={styles.keypad}>
            <View style={styles.row}>
              {key('AC', clear, 'utility')}
              {key('±', toggleSign, 'utility')}
              {key('%', percent, 'utility')}
              {key('÷', () => chooseOperator('÷'), 'operator')}
            </View>
            <View style={styles.row}>
              {key('7', () => enterDigit('7'))}
              {key('8', () => enterDigit('8'))}
              {key('9', () => enterDigit('9'))}
              {key('×', () => chooseOperator('×'), 'operator')}
            </View>
            <View style={styles.row}>
              {key('4', () => enterDigit('4'))}
              {key('5', () => enterDigit('5'))}
              {key('6', () => enterDigit('6'))}
              {key('−', () => chooseOperator('−'), 'operator')}
            </View>
            <View style={styles.row}>
              {key('1', () => enterDigit('1'))}
              {key('2', () => enterDigit('2'))}
              {key('3', () => enterDigit('3'))}
              {key('+', () => chooseOperator('+'), 'operator')}
            </View>
            <View style={styles.row}>
              {key('0', () => enterDigit('0'), 'number', true)}
              {key('.', enterDecimal)}
              {key('=', showResult, 'operator')}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
    backgroundColor: 'rgba(20, 10, 4, 0.62)',
  },
  panel: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: '800' },
  closeButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  display: {
    minHeight: 92,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  expression: { fontSize: 14, marginBottom: 3 },
  displayText: { maxWidth: '100%', fontSize: 38, fontWeight: '700', textAlign: 'right' },
  keypad: { gap: 8, marginTop: 12 },
  row: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, height: 54, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  wideKey: { flex: 2 },
  keyText: { fontSize: 20, fontWeight: '700' },
});
