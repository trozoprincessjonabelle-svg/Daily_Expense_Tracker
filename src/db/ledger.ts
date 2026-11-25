import { getDb, newId } from './client';

export type TransactionType = 'expense' | 'income' | 'savings';

export interface LedgerTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  transaction_date: string;
  created_at: number;
  savings_goal_id?: string | null;
}

export type TransactionInput = Omit<LedgerTransaction, 'id' | 'created_at'>;

type FundTransaction = Pick<LedgerTransaction, 'type' | 'amount' | 'category' | 'note'>;

export function emergencyFundMovement(transaction: FundTransaction): number {
  if (
    transaction.type === 'expense'
    && transaction.category === 'Emergency fund transfer'
    && transaction.note === 'Transfer to emergency fund'
  ) return transaction.amount;
  if (
    transaction.type === 'income'
    && transaction.category === 'Emergency fund transfer'
    && transaction.note === 'Returned to wallet'
  ) return -transaction.amount;
  if (
    transaction.type === 'income'
    && transaction.category === 'Savings'
    && transaction.note === 'Added to emergency fund'
  ) return transaction.amount;
  if (transaction.type === 'expense' && transaction.category === 'Emergency fund') {
    return -transaction.amount;
  }
  return 0;
}

export function isEmergencyFundMovement(transaction: FundTransaction): boolean {
  return emergencyFundMovement(transaction) !== 0;
}

export function emergencyFundActivity(transactions: FundTransaction[]): {
  added: number;
  used: number;
} {
  return transactions.reduce(
    (activity, transaction) => {
      const movement = emergencyFundMovement(transaction);
      if (movement > 0) activity.added += movement;
      if (movement < 0) activity.used -= movement;
      return activity;
    },
    { added: 0, used: 0 }
  );
}

export interface EmergencyFund {
  balance: number;
  goal: number;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  amount: number;
  event_date: string;
  created_at: number;
}

export type UpcomingEventInput = Omit<UpcomingEvent, 'id' | 'created_at'>;

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isUpcomingDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
    && value >= localDate();
}

export async function listTransactions(): Promise<LedgerTransaction[]> {
  const db = await getDb();
  return db.getAllAsync<LedgerTransaction>(
    'SELECT * FROM ledger_transactions ORDER BY transaction_date DESC, created_at DESC'
  );
}

export async function getEmergencyFund(): Promise<EmergencyFund> {
  const db = await getDb();
  const fund = await db.getFirstAsync<EmergencyFund>(
    'SELECT balance, goal FROM ledger_emergency_fund WHERE id = 1'
  );
  if (!fund) throw new Error('Emergency fund data is unavailable.');
  return fund;
}

export async function addEmergencyFund(
  amount: number,
  goal: number | null
): Promise<void> {
  if (!Number.isFinite(amount) || amount < 0 || (goal !== null && (!Number.isFinite(goal) || goal < 0))) {
    throw new Error('Emergency fund amounts must be zero or more.');
  }
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE ledger_emergency_fund
       SET balance = balance + ?, goal = COALESCE(?, goal)
       WHERE id = 1`,
      amount,
      goal
    );
    if (amount > 0) {
      await db.runAsync(
        `INSERT INTO ledger_transactions
          (id, type, amount, category, note, transaction_date, created_at)
         VALUES (?, 'income', ?, 'Savings', 'Added to emergency fund', ?, ?)`,
        newId(),
        amount,
        localDate(),
        Date.now()
      );
    }
  });
}

export async function transferToEmergencyFund(amount: number): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Enter an amount greater than zero.');
  }
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE ledger_emergency_fund
       SET balance = balance + ?
       WHERE id = 1`,
      amount
    );
    await db.runAsync(
      `INSERT INTO ledger_transactions
       (id, type, amount, category, note, transaction_date, created_at)
       VALUES (?, 'expense', ?, 'Emergency fund transfer', 'Transfer to emergency fund', ?, ?)`,
      newId(),
      amount,
      localDate(),
      Date.now()
    );
  });
}

export async function transferFromEmergencyFund(amount: number): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Enter an amount greater than zero.');
  }
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const fund = await db.getFirstAsync<EmergencyFund>(
      'SELECT balance, goal FROM ledger_emergency_fund WHERE id = 1'
    );
    if (!fund) throw new Error('Emergency fund data is unavailable.');
    if (amount > fund.balance) throw new Error('Transfer cannot exceed your emergency fund balance.');
    await db.runAsync(
      `UPDATE ledger_emergency_fund
       SET balance = balance - ?
       WHERE id = 1 AND balance >= ?`,
      amount,
      amount
    );
    await db.runAsync(
      `INSERT INTO ledger_transactions
       (id, type, amount, category, note, transaction_date, created_at)
       VALUES (?, 'income', ?, 'Emergency fund transfer', 'Returned to wallet', ?, ?)`,
      newId(),
      amount,
      localDate(),
      Date.now()
    );
  });
}

export async function setEmergencyFundBalance(balance: number): Promise<void> {
  if (!Number.isFinite(balance) || balance < 0) {
    throw new Error('Emergency fund balance must be zero or more.');
  }
  const db = await getDb();
  const result = await db.runAsync(
    'UPDATE ledger_emergency_fund SET balance = ? WHERE id = 1',
    balance
  );
  if (result.changes !== 1) {
    throw new Error('Emergency fund data is unavailable.');
  }
}

export async function spendEmergencyFund(amount: number, description: string): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Enter an amount greater than zero.');
  }
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const fund = await db.getFirstAsync<EmergencyFund>(
      'SELECT balance, goal FROM ledger_emergency_fund WHERE id = 1'
    );
    if (!fund) throw new Error('Emergency fund data is unavailable.');
    if (amount > fund.balance) throw new Error('Spending cannot exceed your emergency fund balance.');

    const result = await db.runAsync(
      'UPDATE ledger_emergency_fund SET balance = balance - ? WHERE id = 1 AND balance >= ?',
      amount,
      amount
    );
    if (result.changes !== 1) {
      throw new Error('Emergency fund balance changed. Please try again.');
    }

    await db.runAsync(
      `INSERT INTO ledger_transactions
        (id, type, amount, category, note, transaction_date, created_at)
       VALUES (?, 'expense', ?, 'Emergency fund', ?, ?, ?)`,
      newId(),
      amount,
      description.trim() || 'Emergency fund spending',
      localDate(),
      Date.now()
    );
  });
}

export async function listEvents(): Promise<UpcomingEvent[]> {
  const db = await getDb();
  return db.getAllAsync<UpcomingEvent>(
    `SELECT * FROM ledger_upcoming_events
     ORDER BY
       CASE WHEN event_date >= date('now', 'localtime') THEN 0 ELSE 1 END,
       event_date ASC,
       created_at ASC`
  );
}

export async function addUpcomingEvent(input: UpcomingEventInput): Promise<void> {
  if (!input.title.trim()) throw new Error('Event name is required.');
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error('Event amount must be zero or more.');
  }
  if (!isUpcomingDate(input.event_date)) {
    throw new Error('Event date must be a valid date today or later.');
  }
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO ledger_upcoming_events (id, title, amount, event_date, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    newId(),
    input.title.trim(),
    input.amount,
    input.event_date,
    Date.now()
  );
}

export async function deleteUpcomingEvent(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM ledger_upcoming_events WHERE id = ?', id);
}

export async function updateUpcomingEvent(
  id: string,
  input: UpcomingEventInput
): Promise<void> {
  if (!input.title.trim()) throw new Error('Event name is required.');
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error('Event amount must be zero or more.');
  }
  if (!isUpcomingDate(input.event_date)) {
    throw new Error('Event date must be a valid date today or later.');
  }
  const db = await getDb();
  const result = await db.runAsync(
    `UPDATE ledger_upcoming_events
     SET title = ?, amount = ?, event_date = ?
     WHERE id = ?`,
    input.title.trim(),
    input.amount,
    input.event_date,
    id
  );
  if (result.changes !== 1) {
    throw new Error('This upcoming event is no longer available.');
  }
}

export async function payUpcomingEvent(id: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const event = await db.getFirstAsync<UpcomingEvent>(
      'SELECT * FROM ledger_upcoming_events WHERE id = ?',
      id
    );
    if (!event) throw new Error('This upcoming event is no longer available.');
    if (!Number.isFinite(event.amount) || event.amount <= 0) {
      throw new Error('Add an estimated cost to this event before paying it.');
    }

    await db.runAsync(
      `INSERT INTO ledger_transactions
        (id, type, amount, category, note, transaction_date, created_at)
       VALUES (?, 'expense', ?, ?, 'Upcoming event payment', ?, ?)`,
      newId(),
      event.amount,
      event.title,
      localDate(),
      Date.now()
    );
    await db.runAsync('DELETE FROM ledger_upcoming_events WHERE id = ?', id);
  });
}

export async function saveTransaction(
  input: TransactionInput,
  id?: string
): Promise<void> {
  if (input.type === 'savings') {
    throw new Error('Savings goal contributions must be managed from the savings goal.');
  }
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    if (id) {
      const previous = await db.getFirstAsync<LedgerTransaction>(
        'SELECT * FROM ledger_transactions WHERE id = ?',
        id
      );
      if (!previous) throw new Error('This transaction is no longer available.');
      if (previous.type === 'savings' || previous.savings_goal_id) {
        throw new Error('Savings goal transactions cannot be edited as regular transactions.');
      }
      await adjustEmergencyFundBalance(
        db,
        emergencyFundMovement(input) - emergencyFundMovement(previous)
      );
      await db.runAsync(
        `UPDATE ledger_transactions
         SET type = ?, amount = ?, category = ?, note = ?, transaction_date = ?
         WHERE id = ?`,
        input.type,
        input.amount,
        input.category,
        input.note,
        input.transaction_date,
        id
      );
      return;
    }

    await adjustEmergencyFundBalance(db, emergencyFundMovement(input));
    await db.runAsync(
      `INSERT INTO ledger_transactions
        (id, type, amount, category, note, transaction_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      newId(),
      input.type,
      input.amount,
      input.category,
      input.note,
      input.transaction_date,
      Date.now()
    );
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteTransactions([id]);
}

export async function deleteTransactions(ids: readonly string[]): Promise<void> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return;

  const db = await getDb();
  await db.withTransactionAsync(async () => {
    let emergencyFundAdjustment = 0;
    const transactions: LedgerTransaction[] = [];
    for (const id of uniqueIds) {
      const transaction = await db.getFirstAsync<LedgerTransaction>(
        'SELECT * FROM ledger_transactions WHERE id = ?',
        id
      );
      if (!transaction) throw new Error('This transaction is no longer available.');
      transactions.push(transaction);
      emergencyFundAdjustment -= emergencyFundMovement(transaction);
    }

    await adjustEmergencyFundBalance(db, emergencyFundAdjustment);
    for (const transaction of transactions) {
      await removeSavingsGoalProgress(db, transaction);
    }
    for (const id of uniqueIds) {
      await db.runAsync('DELETE FROM ledger_transactions WHERE id = ?', id);
    }
  });
}

async function removeSavingsGoalProgress(
  db: Awaited<ReturnType<typeof getDb>>,
  transaction: LedgerTransaction
): Promise<void> {
  if (transaction.type !== 'savings' || !transaction.savings_goal_id) return;
  const goal = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM ledger_savings_goals WHERE id = ?',
    transaction.savings_goal_id
  );
  if (!goal) {
    const refund = await db.getFirstAsync<{ id: string; amount: number }>(
      `SELECT id, amount FROM ledger_transactions
       WHERE type = 'income'
         AND category = 'Savings goal refund'
         AND savings_goal_id = ?`,
      transaction.savings_goal_id
    );
    if (!refund) return;
    const remainingRefund = refund.amount - transaction.amount;
    if (remainingRefund < -0.005) {
      throw new Error('Savings goal refund no longer matches its transaction history.');
    }
    if (remainingRefund <= 0.005) {
      await db.runAsync('DELETE FROM ledger_transactions WHERE id = ?', refund.id);
    } else {
      await db.runAsync(
        'UPDATE ledger_transactions SET amount = ? WHERE id = ?',
        remainingRefund,
        refund.id
      );
    }
    return;
  }
  const result = await db.runAsync(
    `UPDATE ledger_savings_goals
     SET saved_amount = saved_amount - ?
     WHERE id = ? AND saved_amount >= ?`,
    transaction.amount,
    transaction.savings_goal_id,
    transaction.amount
  );
  if (result.changes !== 1) {
    throw new Error('Savings goal progress no longer matches its transaction history.');
  }
}

async function adjustEmergencyFundBalance(
  db: Awaited<ReturnType<typeof getDb>>,
  amount: number
): Promise<void> {
  if (amount === 0) return;
  const result = await db.runAsync(
    `UPDATE ledger_emergency_fund
     SET balance = balance + ?
     WHERE id = 1 AND balance + ? >= 0`,
    amount,
    amount
  );
  if (result.changes === 1) return;
  const fund = await db.getFirstAsync<EmergencyFund>(
    'SELECT balance, goal FROM ledger_emergency_fund WHERE id = 1'
  );
  if (!fund) throw new Error('Emergency fund data is unavailable.');
  throw new Error('This change would make your emergency fund balance negative.');
}

export async function clearTransactionHistory(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM ledger_transactions');
    await db.runAsync('UPDATE ledger_emergency_fund SET balance = 0, goal = 0 WHERE id = 1');
    await db.runAsync('UPDATE ledger_savings_goals SET saved_amount = 0');
  });
}

export async function clearAllLedgerData(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM ledger_transactions');
    await db.runAsync('DELETE FROM ledger_upcoming_events');
    await db.runAsync('DELETE FROM ledger_savings_goals');
    await db.runAsync('UPDATE ledger_emergency_fund SET balance = 0, goal = 0 WHERE id = 1');
  });
}

export async function replaceTransactions(
  transactions: TransactionInput[]
): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const fund = await db.getFirstAsync<EmergencyFund>(
      'SELECT balance, goal FROM ledger_emergency_fund WHERE id = 1'
    );
    if (!fund) throw new Error('Emergency fund data is unavailable.');
    const existing = await db.getAllAsync<LedgerTransaction>(
      'SELECT * FROM ledger_transactions'
    );
    const currentMovements = existing.reduce(
      (total, transaction) => total + emergencyFundMovement(transaction),
      0
    );
    const importedMovements = transactions.reduce(
      (total, transaction) => total + emergencyFundMovement(transaction),
      0
    );
    const nextBalance = fund.balance + importedMovements - currentMovements;
    if (nextBalance < 0) {
      throw new Error('These transactions would make your emergency fund balance negative.');
    }
    const goals = await db.getAllAsync<{ id: string; target_amount: number }>(
      'SELECT id, target_amount FROM ledger_savings_goals'
    );
    const goalTotals = new Map<string, number>();
    for (const transaction of transactions) {
      if (transaction.type !== 'savings' || !transaction.savings_goal_id) continue;
      goalTotals.set(
        transaction.savings_goal_id,
        (goalTotals.get(transaction.savings_goal_id) ?? 0) + transaction.amount
      );
    }
    for (const goal of goals) {
      if ((goalTotals.get(goal.id) ?? 0) > goal.target_amount) {
        throw new Error('Imported savings contributions exceed a goal target.');
      }
    }

    await db.runAsync(
      'UPDATE ledger_emergency_fund SET balance = ? WHERE id = 1',
      nextBalance
    );
    await db.runAsync('DELETE FROM ledger_transactions');
    await db.runAsync('UPDATE ledger_savings_goals SET saved_amount = 0');
    for (const transaction of transactions) {
      await db.runAsync(
        `INSERT INTO ledger_transactions
          (id, type, amount, category, note, transaction_date, created_at, savings_goal_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        newId(),
        transaction.type,
        transaction.amount,
        transaction.category,
        transaction.note,
        transaction.transaction_date,
        Date.now(),
        transaction.savings_goal_id ?? null
      );
    }
    for (const goal of goals) {
      await db.runAsync(
        'UPDATE ledger_savings_goals SET saved_amount = ? WHERE id = ?',
        goalTotals.get(goal.id) ?? 0,
        goal.id
      );
    }
  });
}
