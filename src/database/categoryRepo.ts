import { getDatabase } from './database';
import { Category, TransactionType } from '../types';

export const getCategories = async (type?: TransactionType): Promise<Category[]> => {
  const db = getDatabase();
  if (type) {
    return await db.getAllAsync<Category>(
      'SELECT * FROM categories WHERE type = ? ORDER BY is_default DESC, name ASC;',
      [type]
    );
  }
  return await db.getAllAsync<Category>(
    'SELECT * FROM categories ORDER BY type ASC, is_default DESC, name ASC;'
  );
};

export const getCategoryById = async (id: number): Promise<Category | null> => {
  const db = getDatabase();
  return await db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?;', [id]);
};

export const createCategory = async (
  name: string,
  icon: string,
  color: string,
  type: TransactionType
): Promise<number> => {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT INTO categories (name, icon, color, type, is_default) VALUES (?, ?, ?, ?, 0);',
    [name.trim(), icon, color, type]
  );
  return result.lastInsertRowId;
};

export const getCategoryTransactionCount = async (categoryId: number): Promise<number> => {
  const db = getDatabase();
  const res = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?;',
    [categoryId]
  );
  return res?.count || 0;
};

export const deleteCategory = async (id: number): Promise<boolean> => {
  const db = getDatabase();
  // Check if category is default
  const category = await getCategoryById(id);
  if (!category || category.is_default === 1) {
    return false; // Can't delete default system categories
  }

  // Delete category and its transactions (via cascade or manual fallback)
  await db.runAsync('DELETE FROM transactions WHERE category_id = ?;', [id]);
  await db.runAsync('DELETE FROM categories WHERE id = ?;', [id]);
  return true;
};
