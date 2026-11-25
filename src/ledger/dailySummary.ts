import Storage from 'expo-sqlite/kv-store';

const HANDLED_DATE_KEY = 'ledger.dailySummaryHandledDate';

function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;
}

export async function loadDailySummaryHandledDate(): Promise<string | null> {
  const value = await Storage.getItem(HANDLED_DATE_KEY);
  if (value === null) return null;
  if (!isValidDateKey(value)) {
    throw new Error('Saved daily summary state is invalid.');
  }
  return value;
}

export async function markDailySummaryHandled(date: string): Promise<void> {
  if (!isValidDateKey(date)) {
    throw new Error('Daily summary date is invalid.');
  }
  await Storage.setItemAsync(HANDLED_DATE_KEY, date);
}
