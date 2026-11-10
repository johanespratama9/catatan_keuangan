import { getDatabase } from './database';
import { setTransactionLabels } from './labelRepo';
import {
  TransactionType,
  TransactionWithCategory,
  FinancialSummary,
  CategoryStat,
  FilterOptions,
} from '../types';

interface TransactionRow extends TransactionWithCategory {
  label_names?: string | null;
}

const mapRowToTransaction = (row: TransactionRow): TransactionWithCategory => {
  const { label_names, ...rest } = row;
  return {
    ...rest,
    labels: label_names
      ? label_names
          .split('|||')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [],
  };
};

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
      c.color as category_color,
      GROUP_CONCAT(l.name, '|||') as label_names
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    LEFT JOIN transaction_labels tl ON t.id = tl.transaction_id
    LEFT JOIN labels l ON tl.label_id = l.id
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

  if (filters?.label && filters.label.trim().length > 0) {
    query += ` AND t.id IN (
      SELECT tl_sub.transaction_id 
      FROM transaction_labels tl_sub 
      JOIN labels l_sub ON tl_sub.label_id = l_sub.id 
      WHERE LOWER(l_sub.name) = LOWER(?)
    )`;
    params.push(filters.label.trim());
  }

  if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
    query += ` AND (
      t.note LIKE ? 
      OR c.name LIKE ? 
      OR t.id IN (
        SELECT tl_search.transaction_id 
        FROM transaction_labels tl_search 
        JOIN labels l_search ON tl_search.label_id = l_search.id 
        WHERE l_search.name LIKE ?
      )
    )`;
    const searchPattern = `%${filters.searchQuery.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ' GROUP BY t.id ORDER BY t.date DESC, t.id DESC;';

  const rows = await db.getAllAsync<TransactionRow>(query, params);
  return rows.map(mapRowToTransaction);
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
      c.color as category_color,
      GROUP_CONCAT(l.name, '|||') as label_names
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    LEFT JOIN transaction_labels tl ON t.id = tl.transaction_id
    LEFT JOIN labels l ON tl.label_id = l.id
    GROUP BY t.id
    ORDER BY t.date DESC, t.id DESC
    LIMIT ?;
  `;
  const rows = await db.getAllAsync<TransactionRow>(query, [limit]);
  return rows.map(mapRowToTransaction);
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
      c.color as category_color,
      GROUP_CONCAT(l.name, '|||') as label_names
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    LEFT JOIN transaction_labels tl ON t.id = tl.transaction_id
    LEFT JOIN labels l ON tl.label_id = l.id
    WHERE t.id = ?
    GROUP BY t.id;
  `;
  const row = await db.getFirstAsync<TransactionRow>(query, [id]);
  return row ? mapRowToTransaction(row) : null;
};

export const createTransaction = async (
  type: TransactionType,
  amount: number,
  categoryId: number,
  date: string,
  note?: string,
  labels?: string[]
): Promise<number> => {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT INTO transactions (type, amount, category_id, date, note) VALUES (?, ?, ?, ?, ?);',
    [type, amount, categoryId, date, note?.trim() || null]
  );
  const newId = result.lastInsertRowId;
  if (labels && labels.length > 0) {
    await setTransactionLabels(newId, labels);
  }
  return newId;
};

export const updateTransaction = async (
  id: number,
  type: TransactionType,
  amount: number,
  categoryId: number,
  date: string,
  note?: string,
  labels?: string[]
): Promise<void> => {
  const db = getDatabase();
  await db.runAsync(
    'UPDATE transactions SET type = ?, amount = ?, category_id = ?, date = ?, note = ? WHERE id = ?;',
    [type, amount, categoryId, date, note?.trim() || null, id]
  );
  if (labels !== undefined) {
    await setTransactionLabels(id, labels);
  }
};

export const deleteTransaction = async (id: number): Promise<void> => {
  const db = getDatabase();
  await db.runAsync('DELETE FROM transaction_labels WHERE transaction_id = ?;', [id]);
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

  if (startDate) {
    queryIncome += ' AND date >= ?';
    queryExpense += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    queryIncome += ' AND date <= ?';
    queryExpense += ' AND date <= ?';
    params.push(endDate);
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

  if (startDate) {
    query += ' AND t.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND t.date <= ?';
    params.push(endDate);
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
