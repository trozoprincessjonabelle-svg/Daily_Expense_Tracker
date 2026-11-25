// Back up / restore portable app, chat, and ledger data as one JSON file.
// Secrets, model files, and attachment files are never included.
import * as DocumentPicker from 'expo-document-picker';
import { releaseLocalConversation } from '@/ai/local';
import { deleteAllAttachments } from '@/attachments/files';
import { getDb } from '@/db/client';
import type { Conversation } from '@/db/conversations';
import type { StoredBudget } from '@/db/budgets';
import type { EmergencyFund, LedgerTransaction, UpcomingEvent } from '@/db/ledger';
import { loadCustomEWallets, saveCustomEWallets } from '@/ledger/ewallets';
import { loadLowCashPercent, saveLowCashPercent } from '@/ledger/lowCash';
import type { MessageRow } from '@/db/messages';
import { DEFAULT_SETTINGS, type Settings } from '@/settings/storage';
import { readFile, saveFile } from './file';

export const BACKUP_FORMAT = 'offline-ai-starter-backup';
export const BACKUP_VERSION = 3;

/** Settings saved in a backup. The API key is never included. */
type BackupSettings = Pick<
  Settings,
  'provider' | 'geminiModel' | 'localBackend' | 'systemPrompt' | 'nickname' | 'theme' | 'language'
>;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  createdAt: number;
  settings: BackupSettings;
  conversations: Conversation[];
  messages: MessageRow[];
  ledger?: {
    transactions: LedgerTransaction[];
    emergencyFund: EmergencyFund;
    events: UpcomingEvent[];
    budgets?: StoredBudget[];
    lowCashPercent: number;
    customEWallets: string[];
  };
}

export async function exportBackup(settings: Settings): Promise<number> {
  const db = await getDb();
  const conversations = await db.getAllAsync<Conversation>(
    'SELECT * FROM conversations'
  );
  const storedMessages = await db.getAllAsync<MessageRow>(
    'SELECT * FROM messages ORDER BY created_at'
  );
  const messages = storedMessages.map((message) => ({
    ...message,
    image_uri: null,
    audio_uri: null,
  }));
  const [transactions, emergencyFund, events, budgets, lowCashPercent, customEWallets] = await Promise.all([
    db.getAllAsync<LedgerTransaction>(
      'SELECT * FROM ledger_transactions ORDER BY transaction_date DESC, created_at DESC'
    ),
    db.getFirstAsync<EmergencyFund>(
      'SELECT balance, goal FROM ledger_emergency_fund WHERE id = 1'
    ),
    db.getAllAsync<UpcomingEvent>(
      'SELECT * FROM ledger_upcoming_events ORDER BY event_date, created_at'
    ),
    db.getAllAsync<StoredBudget>(
      'SELECT * FROM ledger_budgets ORDER BY month, category'
    ),
    loadLowCashPercent(),
    loadCustomEWallets(),
  ]);
  if (!emergencyFund) throw new Error('Emergency fund data is unavailable.');
  const {
    provider, geminiModel, localBackend, systemPrompt, nickname, theme, language,
  } = settings;
  const backup: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: Date.now(),
    settings: { provider, geminiModel, localBackend, systemPrompt, nickname, theme, language },
    conversations,
    messages,
    ledger: { transactions, emergencyFund, events, budgets, lowCashPercent, customEWallets },
  };
  const date = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local
  await saveFile(
    `offline-ai-backup-${date}.json`,
    JSON.stringify(backup, null, 2)
  );
  return messages.length;
}

/** Parse + validate backup JSON. Exported so it can be unit-tested. */
export function parseBackup(text: string): BackupFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This is not a valid backup file.');
  }
  if (!isObject(data)) {
    throw new Error('This is not a valid backup file.');
  }
  const b = data as unknown as BackupFile;
  if (
    b.format !== BACKUP_FORMAT
    || !Number.isInteger(b.version)
    || b.version < 1
  ) {
    throw new Error('This is not a valid backup file.');
  }
  if (b.version > BACKUP_VERSION) {
    throw new Error('This backup was made by a newer version of the app.');
  }
  if (
    !Array.isArray(b.conversations) ||
    !Array.isArray(b.messages) ||
    typeof b.settings !== 'object' ||
    b.settings === null
  ) {
    throw new Error('This is not a valid backup file.');
  }
  if (
    (b.version >= 2 && !isLedgerBackup(b.ledger))
    || (b.ledger !== undefined && !isLedgerBackup(b.ledger))
    || (b.version >= 3 && (!isObject(b.ledger) || !Array.isArray(b.ledger.budgets)))
  ) {
    throw new Error('This backup contains invalid financial data.');
  }
  return b;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLedgerBackup(value: unknown): value is NonNullable<BackupFile['ledger']> {
  if (!isObject(value) || !Array.isArray(value.transactions) || !Array.isArray(value.events)) {
    return false;
  }
  const fund = value.emergencyFund;
  if (
    !isObject(fund)
    || typeof fund.balance !== 'number'
    || !Number.isFinite(fund.balance)
    || fund.balance < 0
    || typeof fund.goal !== 'number'
    || !Number.isFinite(fund.goal)
    || fund.goal < 0
    || typeof value.lowCashPercent !== 'number'
    || !Number.isInteger(value.lowCashPercent)
    || value.lowCashPercent < 3
    || value.lowCashPercent > 30
    || !Array.isArray(value.customEWallets)
    || value.customEWallets.some((wallet) => typeof wallet !== 'string' || !wallet.trim())
  ) return false;
  const walletNames = [
    'gcash',
    'maya',
    ...value.customEWallets.map((wallet) => (wallet as string).trim().toLocaleLowerCase()),
  ];
  if (new Set(walletNames).size !== walletNames.length) return false;
  const validTransaction = (transaction: unknown) =>
    isObject(transaction)
    && typeof transaction.id === 'string'
    && (transaction.type === 'income' || transaction.type === 'expense')
    && typeof transaction.amount === 'number'
    && Number.isFinite(transaction.amount)
    && transaction.amount > 0
    && typeof transaction.category === 'string'
    && typeof transaction.note === 'string'
    && typeof transaction.transaction_date === 'string'
    && typeof transaction.created_at === 'number'
    && Number.isFinite(transaction.created_at);
  const validEvent = (event: unknown) =>
    isObject(event)
    && typeof event.id === 'string'
    && typeof event.title === 'string'
    && typeof event.amount === 'number'
    && Number.isFinite(event.amount)
    && event.amount >= 0
    && typeof event.event_date === 'string'
    && typeof event.created_at === 'number'
    && Number.isFinite(event.created_at);
  const validBudget = (budget: unknown) =>
    isObject(budget)
    && typeof budget.month === 'string'
    && /^\d{4}-(0[1-9]|1[0-2])$/.test(budget.month)
    && typeof budget.category === 'string'
    && budget.category.length > 0
    && typeof budget.amount === 'number'
    && Number.isFinite(budget.amount)
    && budget.amount > 0
    && budget.amount <= 1_000_000_000
    && typeof budget.updated_at === 'number'
    && Number.isFinite(budget.updated_at);
  if (!value.transactions.every(validTransaction) || !value.events.every(validEvent)) return false;
  if (value.budgets === undefined) return true;
  if (!Array.isArray(value.budgets) || !value.budgets.every(validBudget)) return false;
  const budgetKeys = value.budgets.map((budget) => {
    if (!isObject(budget)) return '';
    return `${budget.month}\u0000${budget.category}`;
  });
  return new Set(budgetKeys).size === budgetKeys.length;
}

export async function pickBackup(): Promise<BackupFile | null> {
  // '*/*' because Android file managers often mislabel .json files.
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  return parseBackup(await readFile(result.assets[0].uri));
}

type UpdateFn = <K extends keyof Settings>(
  key: K,
  value: Settings[K]
) => void;

export async function restoreBackup(
  backup: BackupFile,
  update: UpdateFn
): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM messages');
    await db.runAsync('DELETE FROM conversations');
    for (const c of backup.conversations) {
      await db.runAsync(
        'INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
        c.id,
        c.title,
        c.created_at,
        c.updated_at
      );
    }
    for (const m of backup.messages) {
      // A 'pending' message can never resume — store it as an error.
      const interrupted = m.status === 'pending';
      await db.runAsync(
        `INSERT INTO messages
           (id, conversation_id, role, content, status, error, provider, image_uri, audio_uri, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        m.id,
        m.conversation_id,
        m.role,
        m.content,
        interrupted ? 'error' : m.status,
        interrupted ? 'Generation interrupted.' : m.error,
        m.provider,
        // Attachments are not part of a backup; old backups lack the columns.
        null,
        null,
        m.created_at
      );
    }
    if (backup.ledger) {
      await db.runAsync('DELETE FROM ledger_transactions');
      await db.runAsync('DELETE FROM ledger_upcoming_events');
      await db.runAsync('DELETE FROM ledger_budgets');
      for (const transaction of backup.ledger.transactions) {
        await db.runAsync(
          `INSERT INTO ledger_transactions
            (id, type, amount, category, note, transaction_date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          transaction.id,
          transaction.type,
          transaction.amount,
          transaction.category,
          transaction.note,
          transaction.transaction_date,
          transaction.created_at
        );
      }
      for (const event of backup.ledger.events) {
        await db.runAsync(
          `INSERT INTO ledger_upcoming_events
            (id, title, amount, event_date, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          event.id,
          event.title,
          event.amount,
          event.event_date,
          event.created_at
        );
      }
      for (const budget of backup.ledger.budgets ?? []) {
        await db.runAsync(
          `INSERT INTO ledger_budgets (month, category, amount, updated_at)
           VALUES (?, ?, ?, ?)`,
          budget.month,
          budget.category,
          budget.amount,
          budget.updated_at
        );
      }
      await db.runAsync(
        'UPDATE ledger_emergency_fund SET balance = ?, goal = ? WHERE id = 1',
        backup.ledger.emergencyFund.balance,
        backup.ledger.emergencyFund.goal
      );
    }
  });

  if (backup.ledger) {
    await saveLowCashPercent(backup.ledger.lowCashPercent);
    await saveCustomEWallets(backup.ledger.customEWallets);
  }

  // Image files are not backed up - drop any left over from before.
  await deleteAllAttachments();

  // The restored chat is 'main' — drop its in-memory engine conversation.
  await releaseLocalConversation('main');

  // Apply only keys that look sane for their type.
  const s = backup.settings;
  const is = <K extends keyof BackupSettings>(
    key: K,
    valid: (v: BackupSettings[K]) => boolean
  ) => typeof s[key] === typeof DEFAULT_SETTINGS[key] && valid(s[key]);
  if (is('provider', (v) => v === 'cloud' || v === 'local')) {
    update('provider', s.provider);
  }
  if (is('geminiModel', (v) => v.length > 0)) update('geminiModel', s.geminiModel);
  if (is('localBackend', (v) => v === 'cpu' || v === 'gpu')) {
    update('localBackend', s.localBackend);
  }
  if (is('systemPrompt', () => true)) update('systemPrompt', s.systemPrompt);
  if (is('nickname', () => true)) update('nickname', s.nickname);
  if (is('theme', (v) => v === 'light' || v === 'dark')) update('theme', s.theme);
  if (is('language', (v) => v === 'en' || v === 'tl')) update('language', s.language);
}
