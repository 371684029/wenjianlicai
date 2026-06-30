import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 数据库文件放在 server/data/licai.db，可通过环境变量覆盖
const DB_PATH = process.env.DB_PATH
  ? resolve(process.env.DB_PATH)
  : resolve(__dirname, '..', 'data', 'licai.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      bank             TEXT NOT NULL,
      category         TEXT NOT NULL,
      name             TEXT NOT NULL,
      code             TEXT,
      riskLevel        TEXT NOT NULL,
      yieldType        TEXT NOT NULL,
      yieldMin         REAL NOT NULL,
      yieldMax         REAL NOT NULL,
      termDays         INTEGER NOT NULL,
      minAmount        REAL NOT NULL,
      startDate        TEXT,
      principalSecured INTEGER NOT NULL DEFAULT 0,
      sourceName       TEXT NOT NULL,
      sourceUrl        TEXT,
      isSample         INTEGER NOT NULL DEFAULT 0,
      updatedAt        TEXT NOT NULL,
      dedupeKey        TEXT NOT NULL UNIQUE
    );
    CREATE INDEX IF NOT EXISTS idx_products_bank ON products(bank);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_risk ON products(riskLevel);
  `);
}

// 模块加载即建表，确保其它模块在顶层 prepare 语句前表已存在
initSchema();

export { DB_PATH };
