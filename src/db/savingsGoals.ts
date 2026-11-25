import { getDb, newId } from './client';
import { balanceThroughDate } from '@/ledger/format';
import type { LedgerTransaction } from './ledger';

const MAX_AMOUNT = 1_000_000_000;

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  created_at: number;
}

export interface SavingsGoalInput {
  name: string;
  target_amount: number;
}

export class SavingsGoalBalanceConfirmationRequiredError extends Error {
  constructor(readonly availableBalance: number) {
    super('This savings contribution will make your available balance negative.');
    this.name = 'SavingsGoalBalanceConfirmationRequiredError';
  }
}

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export async function listSavingsGoals(): Promise<SavingsGoal[]> {
  const db = await getDb();
  return db.getAllAsync<SavingsGoal>(
    'SELECT * FROM ledger_savings_goals ORDER BY created_at DESC'
  );
}

export async function createSavingsGoal(input: SavingsGoalInput): Promise<void> {
  const name = input.name.trim();
  if (!name || name.length > 80) {
    throw new Error('Enter a goal name using 1 to 80 characters.');
  }
  if (!Number.isFinite(input.target_amount) || input.target_amount <= 0 || input.target_amount > MAX_AMOUNT) {
    throw new Error('The target amount must be greater than zero and at most ₱1 billion.');
  }

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO ledger_savings_goals (id, name, target_amount, saved_amount, created_at)
     VALUES (?, ?, ?, 0, ?)`,
    newId(),
    name,
    input.target_amount,
    Date.now()
  );
}

export async function addSavingsGoalContribution(
  id: string,
  amount: number,
  confirmBelowZero = false
): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    throw new Error('Enter an amount greater than zero and at most ₱1 billion.');
  }

  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const goal = await db.getFirstAsync<SavingsGoal>(
      'SELECT * FROM ledger_savings_goals WHERE id = ?',
      id
    );
    if (!goal) throw new Error('This savings goal no longer exists.');
    if (goal.saved_amount + amount > goal.target_amount) {
      throw new Error('This amount is more than the remaining amount for this goal.');
    }
    const date = localDate();
    const transactions = await db.getAllAsync<LedgerTransaction>(
      'SELECT * FROM ledger_transactions WHERE transaction_date <= ?',
      date
    );
    const availableBalance = balanceThroughDate(transactions, date);
    if (availableBalance - amount < 0 && !confirmBelowZero) {
      throw new SavingsGoalBalanceConfirmationRequiredError(availableBalance);
    }

    const result = await db.runAsync(
      `UPDATE ledger_savings_goals
       SET saved_amount = saved_amount + ?
       WHERE id = ? AND saved_amount + ? <= target_amount`,
      amount,
      id,
      amount
    );
    if (result.changes !== 1) {
      throw new Error('This savings goal changed. Check its remaining amount and try again.');
    }
    await db.runAsync(
      `INSERT INTO ledger_transactions
        (id, type, amount, category, note, transaction_date, created_at, savings_goal_id)
       VALUES (?, 'savings', ?, 'Savings goal', ?, ?, ?, ?)`,
      newId(),
      amount,
      goal.name,
      date,
      Date.now(),
      goal.id
    );
  });
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const goal = await db.getFirstAsync<SavingsGoal>(
      'SELECT * FROM ledger_savings_goals WHERE id = ?',
      id
    );
    if (!goal) throw new Error('This savings goal no longer exists.');
    const contributionTotal = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM ledger_transactions
       WHERE type = 'savings' AND savings_goal_id = ?`,
      id
    );
    if (Math.abs((contributionTotal?.total ?? 0) - goal.saved_amount) > 0.005) {
      throw new Error('Savings goal progress no longer matches its transaction history.');
    }

    const result = await db.runAsync('DELETE FROM ledger_savings_goals WHERE id = ?', id);
    if (result.changes !== 1) throw new Error('This savings goal is no longer available.');
    if (goal.saved_amount > 0) {
      await db.runAsync(
        `INSERT INTO ledger_transactions
          (id, type, amount, category, note, transaction_date, created_at, savings_goal_id)
         VALUES (?, 'income', ?, 'Savings goal refund', ?, ?, ?, ?)`,
        newId(),
        goal.saved_amount,
        `Deleted goal: ${goal.name}`,
        localDate(),
        Date.now(),
        goal.id
      );
    }
  });
}
