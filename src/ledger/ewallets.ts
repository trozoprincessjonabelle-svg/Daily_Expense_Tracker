import Storage from 'expo-sqlite/kv-store';

const CUSTOM_WALLETS_KEY = 'ledger.customEWallets';
export const DEFAULT_EWALLETS = ['GCash', 'Maya'];

export async function loadCustomEWallets(): Promise<string[]> {
  const stored = await Storage.getItem(CUSTOM_WALLETS_KEY);
  if (stored === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    throw new Error('Saved e-wallet options are invalid.');
  }
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error('Saved e-wallet options are invalid.');
  }
  return parsed;
}

export async function addCustomEWallet(name: string): Promise<string[]> {
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error('Enter an e-wallet name.');

  const existing = await loadCustomEWallets();
  const allWallets = [...DEFAULT_EWALLETS, ...existing];
  if (allWallets.some((wallet) => wallet.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
    throw new Error('This e-wallet is already in your choices.');
  }

  const updated = [...existing, normalizedName];
  await Storage.setItemAsync(CUSTOM_WALLETS_KEY, JSON.stringify(updated));
  return updated;
}

export async function saveCustomEWallets(wallets: string[]): Promise<void> {
  const normalized = wallets.map((wallet) => wallet.trim());
  const allNames = [...DEFAULT_EWALLETS, ...normalized].map((wallet) => wallet.toLocaleLowerCase());
  if (
    normalized.some((wallet) => !wallet)
    || new Set(allNames).size !== allNames.length
  ) {
    throw new Error('Saved e-wallet options are invalid.');
  }
  await Storage.setItemAsync(CUSTOM_WALLETS_KEY, JSON.stringify(normalized));
}
