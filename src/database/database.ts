import * as SQLite from 'expo-sqlite';

const DB_NAME = 'catatan_keuangan.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  return dbInstance;
};

export const initDatabase = async (): Promise<void> => {
  const db = getDatabase();

  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);
  `);

  // Seed default categories if empty
  const categoryCountResult = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories;'
  );

  if (!categoryCountResult || categoryCountResult.count === 0) {
    await seedDefaultCategories(db);
  }

  // Ensure default data is empty by cleaning up legacy sample transactions if present
  try {
    await db.runAsync(`
      DELETE FROM transactions 
      WHERE note IN (
        'Gaji bulan ini',
        'Bonus performa kuartal',
        'Makan siang ayam geprek',
        'Bensin & parkir',
        'Belanja bulanan supermarket',
        'Tagihan listrik PLN',
        'Nonton bioskop',
        'Vitamin & suplemen',
        'Kopi & camilan sore'
      );
    `);
  } catch (e) {
    // Ignore error if transactions table is empty or query fails
  }
};

const seedDefaultCategories = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  const defaultCategories = [
    // Pengeluaran (Expense)
    { name: 'Makanan & Minuman', icon: 'fast-food', color: '#EF4444', type: 'expense' },
    { name: 'Transportasi', icon: 'car', color: '#3B82F6', type: 'expense' },
    { name: 'Belanja & Kebutuhan', icon: 'cart', color: '#F59E0B', type: 'expense' },
    { name: 'Tagihan & Utilitas', icon: 'receipt', color: '#8B5CF6', type: 'expense' },
    { name: 'Hiburan', icon: 'game-controller', color: '#EC4899', type: 'expense' },
    { name: 'Kesehatan', icon: 'medkit', color: '#10B981', type: 'expense' },
    { name: 'Pendidikan', icon: 'school', color: '#06B6D4', type: 'expense' },
    { name: 'Rumah Tangga', icon: 'home', color: '#F97316', type: 'expense' },
    { name: 'Lain-lain', icon: 'ellipsis-horizontal-circle', color: '#64748B', type: 'expense' },

    // Pemasukan (Income)
    { name: 'Gaji Bulanan', icon: 'cash', color: '#10B981', type: 'income' },
    { name: 'Bonus & THR', icon: 'gift', color: '#3B82F6', type: 'income' },
    { name: 'Usaha / Bisnis', icon: 'briefcase', color: '#F59E0B', type: 'income' },
    { name: 'Investasi & Bunga', icon: 'trending-up', color: '#8B5CF6', type: 'income' },
    { name: 'Uang Saku / Hadiah', icon: 'heart', color: '#EC4899', type: 'income' },
    { name: 'Pemasukan Lain', icon: 'wallet', color: '#06B6D4', type: 'income' },
  ];

  for (const cat of defaultCategories) {
    await db.runAsync(
      'INSERT INTO categories (name, icon, color, type, is_default) VALUES (?, ?, ?, ?, 1);',
      [cat.name, cat.icon, cat.color, cat.type]
    );
  }
};
