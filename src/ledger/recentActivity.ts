import Storage from 'expo-sqlite/kv-store';

const RESET_AT_KEY = 'ledger.recentActivityResetAt';

export async function loadRecentActivityResetAt(): Promise<number> {
  const value = await Storage.getItem(RESET_AT_KEY);
  if (value === null) return 0;
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp < 0) {
    throw new Error('Saved recent activity state is invalid.');
  }
  return timestamp;
}

export async function resetRecentActivity(): Promise<number> {
  const timestamp = Date.now();
  await Storage.setItemAsync(RESET_AT_KEY, String(timestamp));
  return timestamp;
}
