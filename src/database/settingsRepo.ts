import { getDatabase } from './database';

export const getSetting = async (key: string): Promise<string | null> => {
  try {
    const db = getDatabase();
    const result = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ? LIMIT 1;',
      key
    );
    return result?.value ?? null;
  } catch (error) {
    console.error(`Failed to get setting ${key}:`, error);
    return null;
  }
};

export const getSettingSync = (key: string): string | null => {
  try {
    const db = getDatabase();
    const result = db.getFirstSync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ? LIMIT 1;',
      key
    );
    return result?.value ?? null;
  } catch (error) {
    console.error(`Failed to get setting sync ${key}:`, error);
    return null;
  }
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  try {
    const db = getDatabase();
    await db.runAsync(
      `INSERT INTO settings (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
      key,
      value
    );
  } catch (error) {
    console.error(`Failed to set setting ${key}:`, error);
  }
};
