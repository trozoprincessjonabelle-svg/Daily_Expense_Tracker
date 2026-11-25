import {
  isEmergencyFundMovement,
  type LedgerTransaction,
} from '@/db/ledger';

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number): string {
  return pesoFormatter.format(amount);
}

export function formatDate(date: string, language: 'en' | 'tl' = 'en'): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(language === 'tl' ? 'fil-PH' : 'en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatLongDate(date: string, language: 'en' | 'tl' = 'en'): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(language === 'tl' ? 'fil-PH' : 'en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(timestamp: number, language: 'en' | 'tl' = 'en'): string {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return language === 'tl' ? 'Oras hindi available' : 'Time unavailable';
  }
  return parsed.toLocaleTimeString(language === 'tl' ? 'fil-PH' : 'en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function currentMonthTransactions(
  transactions: LedgerTransaction[],
  now = new Date()
): LedgerTransaction[] {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return transactions.filter((item) => item.transaction_date.startsWith(month));
}

export function sumByType(
  transactions: LedgerTransaction[],
  type: LedgerTransaction['type']
): number {
  return transactions.reduce(
    (total, item) => total + (
      item.type === type && !isEmergencyFundMovement(item) ? item.amount : 0
    ),
    0
  );
}

export function balanceThroughDate(
  transactions: LedgerTransaction[],
  date: string
): number {
  return transactions.reduce((balance, transaction) => {
    if (transaction.transaction_date > date) return balance;
    if (transaction.category === 'Emergency fund transfer'
      && transaction.note === 'Transfer to emergency fund') {
      return balance - transaction.amount;
    }
    if (transaction.category === 'Emergency fund transfer'
      && transaction.note === 'Returned to wallet') {
      return balance + transaction.amount;
    }
    if (transaction.type === 'income'
      && transaction.category === 'Savings'
      && transaction.note === 'Added to emergency fund') {
      return balance - transaction.amount;
    }
    if (isEmergencyFundMovement(transaction)) return balance;
    return balance + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
  }, 0);
}

export function availableBalanceThroughDate(
  transactions: LedgerTransaction[],
  date: string
): number {
  return Math.max(0, balanceThroughDate(transactions, date));
}
