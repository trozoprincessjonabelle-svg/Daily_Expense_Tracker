import * as DocumentPicker from 'expo-document-picker';
import type { LedgerTransaction, TransactionInput } from '@/db/ledger';
import { readFile, saveFile } from './file';

const CSV_HEADERS = ['transaction_date', 'type', 'category', 'amount', 'note', 'savings_goal_id'] as const;
const LEGACY_CSV_HEADERS = ['transaction_date', 'type', 'category', 'amount', 'note'] as const;

function escapeCsv(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export async function exportTransactionsCsv(transactions: LedgerTransaction[]): Promise<void> {
  const rows = [
    CSV_HEADERS.join(','),
    ...transactions.map((transaction) => [
      transaction.transaction_date,
      transaction.type,
      transaction.category,
      String(transaction.amount),
      transaction.note,
      transaction.savings_goal_id ?? '',
    ].map(escapeCsv).join(',')),
  ];
  await saveFile(
    `transaction-history-${localDate()}.csv`,
    `${rows.join('\r\n')}\r\n`,
    'text/csv',
    'Export transaction history'
  );
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          value += '"';
          index++;
        } else {
          quoted = false;
        }
      } else {
        value += character;
      }
    } else if (character === '"' && value.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\n' || character === '\r') {
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
      if (character === '\r' && text[index + 1] === '\n') index++;
    } else {
      value += character;
    }
  }
  if (quoted) throw new Error('The CSV file contains an unfinished quoted field.');
  row.push(value);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;
}

export function parseTransactionsCsv(text: string): TransactionInput[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  const headers = rows.shift();
  const isCurrentFormat = headers?.length === CSV_HEADERS.length
    && CSV_HEADERS.every((header) => headers.includes(header));
  const isLegacyFormat = headers?.length === LEGACY_CSV_HEADERS.length
    && LEGACY_CSV_HEADERS.every((header) => headers.includes(header));
  if (!headers || (!isCurrentFormat && !isLegacyFormat)) {
    throw new Error('This CSV must contain transaction_date, type, category, amount, and note columns.');
  }
  const column = Object.fromEntries(headers.map((header, index) => [header, index])) as Record<
    typeof CSV_HEADERS[number],
    number
  >;

  return rows.map((row, index) => {
    if (row.length !== headers.length) {
      throw new Error(`CSV row ${index + 2} has the wrong number of columns.`);
    }
    const type = row[column.type];
    const amount = Number(row[column.amount]);
    const category = row[column.category].trim();
    const transactionDate = row[column.transaction_date];
    const note = row[column.note];
    const goalIdColumn = headers.indexOf('savings_goal_id');
    const savingsGoalId = goalIdColumn >= 0 ? row[goalIdColumn].trim() || null : null;
    if (type !== 'income' && type !== 'expense' && type !== 'savings') {
      throw new Error(`CSV row ${index + 2} has an invalid transaction type.`);
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`CSV row ${index + 2} has an invalid amount.`);
    }
    if (!category || !isValidDate(transactionDate)) {
      throw new Error(`CSV row ${index + 2} has an invalid category or date.`);
    }
    return {
      type: type === 'expense'
        && category === 'Savings'
        && note === 'Added to emergency fund'
        ? 'income'
        : type,
      amount,
      category,
      note,
      transaction_date: transactionDate,
      savings_goal_id: savingsGoalId,
    };
  });
}

export async function pickTransactionsCsv(): Promise<TransactionInput[] | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  return parseTransactionsCsv(await readFile(result.assets[0].uri));
}
