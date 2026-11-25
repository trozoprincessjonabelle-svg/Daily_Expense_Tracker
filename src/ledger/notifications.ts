import Storage from 'expo-sqlite/kv-store';

const READ_AT_KEY = 'ledger.notificationsReadAt';

export async function loadNotificationsReadAt(): Promise<number> {
  const value = await Storage.getItem(READ_AT_KEY);
  if (value === null) return 0;
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp < 0) {
    throw new Error('Saved notification read state is invalid.');
  }
  return timestamp;
}

export async function markNotificationsRead(): Promise<number> {
  const timestamp = Date.now();
  await Storage.setItemAsync(READ_AT_KEY, String(timestamp));
  return timestamp;
}
