import Storage from 'expo-sqlite/kv-store';

const THRESHOLD_KEY = 'ledger.lowCashThreshold';
const PERCENT_KEY = 'ledger.lowCashPercent';
export const DEFAULT_LOW_CASH_THRESHOLD = 1000;
export const DEFAULT_LOW_CASH_PERCENT = 15;

export async function loadLowCashPercent(): Promise<number> {
  const stored = await Storage.getItem(PERCENT_KEY);
  if (stored === null) return DEFAULT_LOW_CASH_PERCENT;
  const percent = Number(stored);
  return Number.isInteger(percent) && percent >= 3 && percent <= 30
    ? percent
    : DEFAULT_LOW_CASH_PERCENT;
}

export async function saveLowCashPercent(percent: number): Promise<void> {
  if (!Number.isInteger(percent) || percent < 3 || percent > 30) {
    throw new Error('Low-cash warning must be between 3% and 30%.');
  }
  await Storage.setItemAsync(PERCENT_KEY, String(percent));
}

export async function loadLowCashThreshold(): Promise<number> {
  const stored = await Storage.getItem(THRESHOLD_KEY);
  if (stored === null) return DEFAULT_LOW_CASH_THRESHOLD;
  const threshold = Number(stored);
  return Number.isFinite(threshold) && threshold >= 0
    ? threshold
    : DEFAULT_LOW_CASH_THRESHOLD;
}

export async function saveLowCashThreshold(threshold: number): Promise<void> {
  if (!Number.isFinite(threshold) || threshold < 0) {
    throw new Error('Warning amount must be zero or more.');
  }
  await Storage.setItemAsync(THRESHOLD_KEY, String(threshold));
}
