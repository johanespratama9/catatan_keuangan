import { getDatabase } from './database';
import {
  TransactionType,
  TransactionWithCategory,
  FinancialSummary,
  CategoryStat,
  FilterOptions,
} from '../types';

export const getTransactions = async (
  filters?: FilterOptions
): Promise<TransactionWithCategory[]> => {
  const db = getDatabase();
  let query = `
    SELECT 
      t.id,
      t.type,
      t.amount,
      t.category_id,
      t.date,
      t.note,
      t.created_at,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filters?.type && filters.type !== 'all') {
    query += ' AND t.type = ?';
    params.push(filters.type);
  }

  if (filters?.categoryId) {
    query += ' AND t.category_id = ?';
    params.push(filters.categoryId);
  }

  if (filters?.startDate) {
    query += ' AND t.date >= ?';
    params.push(filters.startDate);
  }

  if (filters?.endDate) {
    query += ' AND t.date <= ?';
    params.push(filters.endDate);
  }

  if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
    query += ' AND (t.note LIKE ? OR c.name LIKE ?)';
    const searchPattern = `%${filters.searchQuery.trim()}%`;
    params.push(searchPattern, searchPattern);
  }

  query += ' ORDER BY t.date DESC, t.id DESC;';

  return await db.getAllAsync<TransactionWithCategory>(query, params);
};

export const getRecentTransactions = async (
  limit: number = 5
): Promise<TransactionWithCategory[]> => {
  const db = getDatabase();
  const query = `
    SELECT 
      t.id,
      t.type,
      t.amount,
      t.category_id,
      t.date,
      t.note,
      t.created_at,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    ORDER BY t.date DESC, t.id DESC
    LIMIT ?;
  `;
  return await db.getAllAsync<TransactionWithCategory>(query, [limit]);
};

export const getTransactionById = async (
  id: number
): Promise<TransactionWithCategory | null> => {
  const db = getDatabase();
  const query = `
    SELECT 
      t.id,
      t.type,
      t.amount,
      t.category_id,
      t.date,
      t.note,
      t.created_at,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?;
  `;
  return await db.getFirstAsync<TransactionWithCategory>(query, [id]);
};

export const createTransaction = async (
  type: TransactionType,
  amount: number,
  categoryId: number,
  date: string,
  note?: string
): Promise<number> => {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT INTO transactions (type, amount, category_id, date, note) VALUES (?, ?, ?, ?, ?);',
    [type, amount, categoryId, date, note?.trim() || null]
  );
  return result.lastInsertRowId;
};

export const updateTransaction = async (
  id: number,
  type: TransactionType,
  amount: number,
  categoryId: number,
  date: string,
  note?: string
): Promise<void> => {
  const db = getDatabase();
  await db.runAsync(
    'UPDATE transactions SET type = ?, amount = ?, category_id = ?, date = ?, note = ? WHERE id = ?;',
    [type, amount, categoryId, date, note?.trim() || null, id]
  );
};

export const deleteTransaction = async (id: number): Promise<void> => {
  const db = getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
};

export const getFinancialSummary = async (
  startDate?: string,
  endDate?: string
): Promise<FinancialSummary> => {
  const db = getDatabase();

  let queryIncome = 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = "income"';
  let queryExpense = 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = "expense"';
  const params: string[] = [];

  if (startDate && endDate) {
    queryIncome += ' AND date >= ? AND date <= ?';
    queryExpense += ' AND date >= ? AND date <= ?';
    params.push(startDate, endDate);
  }

  const [incomeRes, expenseRes] = await Promise.all([
    db.getFirstAsync<{ total: number }>(queryIncome, params),
    db.getFirstAsync<{ total: number }>(queryExpense, params),
  ]);

  const totalIncome = incomeRes?.total || 0;
  const totalExpense = expenseRes?.total || 0;
  const totalBalance = totalIncome - totalExpense;

  return {
    totalBalance,
    totalIncome,
    totalExpense,
  };
};

export const getCategoryStats = async (
  type: TransactionType,
  startDate?: string,
  endDate?: string
): Promise<CategoryStat[]> => {
  const db = getDatabase();

  let query = `
    SELECT 
      c.id as category_id,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      COALESCE(SUM(t.amount), 0) as total_amount,
      COUNT(t.id) as count
    FROM categories c
    JOIN transactions t ON t.category_id = c.id
    WHERE t.type = ?
  `;
  const params: (string | number)[] = [type];

  if (startDate && endDate) {
    query += ' AND t.date >= ? AND t.date <= ?';
    params.push(startDate, endDate);
  }

  query += `
    GROUP BY c.id
    HAVING total_amount > 0
    ORDER BY total_amount DESC;
  `;

  const rows = await db.getAllAsync<{
    category_id: number;
    category_name: string;
    category_icon: string;
    category_color: string;
    total_amount: number;
    count: number;
  }>(query, params);

  const grandTotal = rows.reduce((acc, curr) => acc + curr.total_amount, 0);

  return rows.map((row) => ({
    ...row,
    percentage: grandTotal > 0 ? (row.total_amount / grandTotal) * 100 : 0,
  }));
};
