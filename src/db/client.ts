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
  `
  ALTER TABLE messages ADD COLUMN image_uri TEXT;
  `,
  `
  ALTER TABLE messages ADD COLUMN audio_uri TEXT;
  `,
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
];

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function migrate(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const version = row?.user_version ?? 0;
  for (let i = version; i < MIGRATIONS.length; i++) {
    await database.execAsync(MIGRATIONS[i]);
    await database.execAsync(`PRAGMA user_version = ${i + 1}`);
  }
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
    })();
  }
  return initPromise;
}
