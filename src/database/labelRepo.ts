import { getDatabase } from './database';
import { Label } from '../types';

export const getAllLabels = async (): Promise<Label[]> => {
  const db = getDatabase();
  return await db.getAllAsync<Label>(
    'SELECT id, name, created_at FROM labels ORDER BY name ASC;'
  );
};

export const getOrCreateLabel = async (rawName: string): Promise<Label> => {
  const db = getDatabase();
  const trimmed = rawName.trim();
  if (!trimmed) {
    throw new Error('Label name cannot be empty');
  }

  // Check if label exists (case-insensitive)
  const existing = await db.getFirstAsync<Label>(
    'SELECT id, name, created_at FROM labels WHERE LOWER(name) = LOWER(?);',
    [trimmed]
  );

  if (existing) {
    return existing;
  }

  const result = await db.runAsync(
    'INSERT INTO labels (name) VALUES (?);',
    [trimmed]
  );

  return {
    id: result.lastInsertRowId,
    name: trimmed,
  };
};

export const getLabelsByTransactionId = async (
  transactionId: number
): Promise<string[]> => {
  const db = getDatabase();
  const rows = await db.getAllAsync<{ name: string }>(
    `SELECT l.name 
     FROM labels l
     JOIN transaction_labels tl ON l.id = tl.label_id
     WHERE tl.transaction_id = ?
     ORDER BY l.name ASC;`,
    [transactionId]
  );
  return rows.map((r) => r.name);
};

export const setTransactionLabels = async (
  transactionId: number,
  labelNames: string[]
): Promise<void> => {
  const db = getDatabase();

  // Clear existing links
  await db.runAsync(
    'DELETE FROM transaction_labels WHERE transaction_id = ?;',
    [transactionId]
  );

  if (!labelNames || labelNames.length === 0) {
    return;
  }

  // Filter and deduplicate
  const uniqueNames = Array.from(
    new Set(labelNames.map((n) => n.trim()).filter((n) => n.length > 0))
  );

  for (const name of uniqueNames) {
    const label = await getOrCreateLabel(name);
    await db.runAsync(
      'INSERT OR IGNORE INTO transaction_labels (transaction_id, label_id) VALUES (?, ?);',
      [transactionId, label.id]
    );
  }
};

