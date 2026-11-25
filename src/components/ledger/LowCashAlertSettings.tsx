import React, { useCallback, useMemo, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useFocusEffect } from 'expo-router';
import { Section } from '@/components/Section';
import { DEFAULT_LOW_CASH_PERCENT, loadLowCashPercent, saveLowCashPercent } from '@/ledger/lowCash';
import { useTheme } from '@/theme';
import { showMessage } from '@/utils/confirm';
import { SmoothPressable } from '../SmoothPressable';

const MIN_PERCENT = 3;
const MAX_PERCENT = 30;
const QUICK_OPTIONS = [10, 15, 20, 25];

export function LowCashAlertSettings() {
  const theme = useTheme();
  const [percent, setPercent] = useState(DEFAULT_LOW_CASH_PERCENT);
  const [trackWidth, setTrackWidth] = useState(0);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadLowCashPercent()
        .then((value) => { if (active) setPercent(value); })
        .catch((error: unknown) => showMessage(
          'Unable to load low-cash alert',
          error instanceof Error ? error.message : 'Please try again.'
        ));
      return () => { active = false; };
    }, [])
  );

  const save = useCallback(async (value: number) => {
    setSaving(true);
    try {
      await saveLowCashPercent(value);
      setPercent(value);
    } catch (error) {
      showMessage(
        'Unable to save low-cash alert',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }, []);

  const valueAt = useCallback((locationX: number) => {
    if (trackWidth <= 0) return percent;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    return Math.max(MIN_PERCENT, Math.min(MAX_PERCENT,
      Math.round(MIN_PERCENT + ratio * (MAX_PERCENT - MIN_PERCENT))));
  }, [percent, trackWidth]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !saving,
    onMoveShouldSetPanResponder: () => !saving,
    onPanResponderGrant: (event) => setPercent(valueAt(event.nativeEvent.locationX)),
    onPanResponderMove: (event) => setPercent(valueAt(event.nativeEvent.locationX)),
    onPanResponderRelease: (event) => { void save(valueAt(event.nativeEvent.locationX)); },
  }), [save, saving, valueAt]);

  const progress = ((percent - MIN_PERCENT) / (MAX_PERCENT - MIN_PERCENT)) * 100;
  const handleAccessibilityAction = (actionName: string) => {
    const next = Math.max(MIN_PERCENT, Math.min(MAX_PERCENT,
      percent + (actionName === 'increment' ? 1 : -1)));
    void save(next);
  };

  return (
    <Section title="Alert settings" theme={theme}>
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={[styles.title, { color: theme.text }]}>Low-cash warning</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Choose when to warn you that today’s available money is running low.
          </Text>
        </View>
      </View>

      <View style={styles.percentRow}>
        <Text style={[styles.percent, { color: theme.tint }]}>{percent}%</Text>
        <Text style={[styles.remaining, { color: theme.textSecondary }]}>OF TODAY’S INCOME</Text>
      </View>

      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Low-cash warning percentage"
        accessibilityValue={{ min: MIN_PERCENT, max: MAX_PERCENT, now: percent, text: `${percent}%` }}
        accessibilityActions={[
          { name: 'increment', label: 'Increase warning percentage' },
          { name: 'decrement', label: 'Decrease warning percentage' },
        ]}
        onAccessibilityAction={(event) => handleAccessibilityAction(event.nativeEvent.actionName)}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
        style={styles.sliderHitArea}
      >
        <View style={[styles.sliderTrack, { backgroundColor: theme.border }]}>
          <View style={[styles.sliderFill, { width: `${progress}%`, backgroundColor: theme.tint }]} />
          <View style={[styles.sliderThumb, { left: `${progress}%`, backgroundColor: theme.tint, borderColor: theme.card }]} />
        </View>
      </View>

      <View style={styles.rangeLabels}>
        <Text style={[styles.rangeLabel, { color: theme.textSecondary }]}>{MIN_PERCENT}%</Text>
        <Text style={[styles.rangeLabel, { color: theme.textSecondary }]}>{MAX_PERCENT}%</Text>
      </View>

      <View style={styles.quickOptions}>
        {QUICK_OPTIONS.map((option) => {
          const selected = percent === option;
          return (
            <SmoothPressable
              key={option}
              accessibilityRole="radio"
              accessibilityLabel={`${option}% remaining`}
              accessibilityState={{ checked: selected, disabled: saving }}
              disabled={saving}
              onPress={() => void save(option)}
              style={[
                styles.quickOption,
                {
                  backgroundColor: selected ? `${theme.tint}18` : theme.background,
                  borderColor: selected ? theme.tint : theme.border,
                },
              ]}
            >
              <Text style={[styles.quickLabel, { color: selected ? theme.tint : theme.textSecondary }]}>
                {option}%
              </Text>
            </SmoothPressable>
          );
        })}
      </View>
      <Text style={[styles.footnote, { color: theme.textSecondary }]}>
        {saving ? 'Saving alert…' : '        Alert when today’s remaining balance falls below this percentage of today’s income.'}
      </Text>
    </Section>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleCopy: { flex: 1, gap: 5 },
  title: { fontSize: 17, fontWeight: '800' },
  description: { fontSize: 12, lineHeight: 17 },
  percentRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginTop: 1 },
  percent: { fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  remaining: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  sliderHitArea: { height: 34, justifyContent: 'center', paddingHorizontal: 2 },
  sliderTrack: { height: 6, borderRadius: 4, justifyContent: 'center' },
  sliderFill: { height: 6, borderRadius: 4 },
  sliderThumb: { position: 'absolute', width: 16, height: 16, borderRadius: 8, marginLeft: -8, borderWidth: 2, elevation: 2 },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -7 },
  rangeLabel: { fontSize: 10 },
  quickOptions: { flexDirection: 'row', gap: 7, marginTop: 2 },
  quickOption: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8 },
  quickLabel: { fontSize: 12, fontWeight: '700' },
  footnote: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 1 },
});
