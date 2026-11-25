import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Ordered migrations, applied by PRAGMA user_version. */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'done' CHECK (status IN ('done', 'pending', 'error')),
    error TEXT,
    provider TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages (conversation_id, created_at);
  `,
  `SELECT 1;`,
  `SELECT 1;`,
  `
  CREATE TABLE IF NOT EXISTS ledger_transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    amount REAL NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    transaction_date TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ledger_transactions_date
    ON ledger_transactions (transaction_date DESC, created_at DESC);
  `,
  `
  CREATE TABLE IF NOT EXISTS ledger_emergency_fund (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    balance REAL NOT NULL DEFAULT 0 CHECK (balance >= 0),
    goal REAL NOT NULL DEFAULT 0 CHECK (goal >= 0)
  );
  INSERT OR IGNORE INTO ledger_emergency_fund (id) VALUES (1);
  CREATE TABLE IF NOT EXISTS ledger_upcoming_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0 CHECK (amount >= 0),
    event_date TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ledger_upcoming_events_date
    ON ledger_upcoming_events (event_date, created_at);
  `,
  `
  UPDATE ledger_transactions
  SET type = 'income'
  WHERE type = 'expense'
    AND category = 'Savings'
    AND note = 'Added to emergency fund';
  `,
  `
  CREATE TABLE IF NOT EXISTS ledger_budgets (
    month TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (month, category)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS ledger_savings_goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL CHECK (target_amount > 0),
    saved_amount REAL NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ledger_savings_goals_created
    ON ledger_savings_goals (created_at DESC);
  `,
  `
  CREATE TABLE ledger_transactions_new (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'savings')),
    amount REAL NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    transaction_date TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    savings_goal_id TEXT
  );
  INSERT INTO ledger_transactions_new
    (id, type, amount, category, note, transaction_date, created_at, savings_goal_id)
  SELECT id, type, amount, category, note, transaction_date, created_at, NULL
  FROM ledger_transactions;
  DROP TABLE ledger_transactions;
  ALTER TABLE ledger_transactions_new RENAME TO ledger_transactions;
  CREATE INDEX idx_ledger_transactions_date
    ON ledger_transactions (transaction_date DESC, created_at DESC);
  INSERT INTO ledger_transactions
    (id, type, amount, category, note, transaction_date, created_at, savings_goal_id)
  SELECT
    lower(hex(randomblob(16))),
    'savings',
    saved_amount,
    'Savings goal',
    name,
    date(created_at / 1000, 'unixepoch', 'localtime'),
    created_at,
    id
  FROM ledger_savings_goals
  WHERE saved_amount > 0;
  `,
];

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function ensureMessageColumns(database: SQLite.SQLiteDatabase): Promise<void> {
  const table = await database.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'messages'"
  );
  if (!table) return;
  const columns = await database.getAllAsync<{ name: string }>(
    'PRAGMA table_info(messages)'
  );
  const names = new Set(columns.map((column) => column.name));
  if (!names.has('image_uri')) {
    await database.execAsync('ALTER TABLE messages ADD COLUMN image_uri TEXT');
  }
  if (!names.has('audio_uri')) {
    await database.execAsync('ALTER TABLE messages ADD COLUMN audio_uri TEXT');
  }
}

async function migrate(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const version = row?.user_version ?? 0;
  await database.withTransactionAsync(async () => {
    await ensureMessageColumns(database);
    for (let i = version; i < MIGRATIONS.length; i++) {
      await database.execAsync(MIGRATIONS[i]);
      if (i === 0) await ensureMessageColumns(database);
      await database.execAsync(`PRAGMA user_version = ${i + 1}`);
    }
  });
}

/** Open (and migrate) the database. Safe to call from anywhere; runs once. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return Promise.resolve(db);
  if (!initPromise) {
    initPromise = (async () => {
      const database = await SQLite.openDatabaseAsync('chat.db');
      await database.execAsync('PRAGMA foreign_keys = ON');
      await migrate(database);
      db = database;
      return database;
    })().catch((error: unknown) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}
