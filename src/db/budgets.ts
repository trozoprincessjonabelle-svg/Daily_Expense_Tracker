import { getDb } from './client';

const TOTAL_BUDGET_KEY = '__total__';
const MAX_BUDGET_AMOUNT = 1_000_000_000;

export interface CategoryBudget {
  category: string;
  amount: number;
}

export interface MonthlyBudgetPlan {
  month: string;
  totalAmount: number | null;
  categories: CategoryBudget[];
}

export interface StoredBudget {
  month: string;
  category: string;
  amount: number;
  updated_at: number;
}

export async function getMonthlyBudgetPlan(month: string): Promise<MonthlyBudgetPlan> {
  validateMonth(month);
  const db = await getDb();
  const rows = await db.getAllAsync<Pick<StoredBudget, 'category' | 'amount'>>(
    'SELECT category, amount FROM ledger_budgets WHERE month = ? ORDER BY category',
    month
  );
  const total = rows.find((row) => row.category === TOTAL_BUDGET_KEY);
  return {
    month,
    totalAmount: total?.amount ?? null,
    categories: rows
      .filter((row) => row.category !== TOTAL_BUDGET_KEY)
      .map(({ category, amount }) => ({ category, amount })),
  };
}

export async function saveMonthlyBudgetPlan(
  month: string,
  totalAmount: number | null,
  categories: CategoryBudget[]
): Promise<MonthlyBudgetPlan> {
  validateMonth(month);
  if (totalAmount !== null && (
    !Number.isFinite(totalAmount)
    || totalAmount <= 0
    || totalAmount > MAX_BUDGET_AMOUNT
  )) {
    throw new Error('Monthly budget must be greater than zero and at most ₱1 billion.');
  }

  const normalizedCategories = categories.map(({ category, amount }) => ({
    category: category.trim(),
    amount,
  }));
  const names = new Set<string>();
  for (const { category, amount } of normalizedCategories) {
    if (!category || category === TOTAL_BUDGET_KEY) {
      throw new Error('Enter a valid budget category.');
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_BUDGET_AMOUNT) {
      throw new Error(`Enter a budget for ${category} that is greater than zero and at most ₱1 billion.`);
    }
    const key = category.toLocaleLowerCase();
    if (names.has(key)) throw new Error(`The ${category} budget is listed more than once.`);
    names.add(key);
  }

  const db = await getDb();
  const updatedAt = Date.now();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM ledger_budgets WHERE month = ?', month);
    if (totalAmount !== null) {
      await db.runAsync(
        'INSERT INTO ledger_budgets (month, category, amount, updated_at) VALUES (?, ?, ?, ?)',
        month,
        TOTAL_BUDGET_KEY,
        totalAmount,
        updatedAt
      );
    }
    for (const { category, amount } of normalizedCategories) {
      await db.runAsync(
        'INSERT INTO ledger_budgets (month, category, amount, updated_at) VALUES (?, ?, ?, ?)',
        month,
        category,
        amount,
        updatedAt
      );
    }
  });
  return getMonthlyBudgetPlan(month);
}

function validateMonth(month: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error('Budget month must use YYYY-MM format.');
  }
}
