import { db } from './db.js';
import { isAvailable, type Product, type RawProduct, type Bank, type Category, type RiskLevel, type Reliability } from './types.js';
import { scoreProducts, type ScoredProduct } from './scoring.js';

export function dedupeKey(p: RawProduct): string {
  return p.code ? `${p.bank}|${p.code}` : `${p.bank}|${p.name}|${p.termDays}`;
}

const upsertStmt = db.prepare(`
  INSERT INTO products
    (bank, category, name, code, riskLevel, yieldType, yieldMin, yieldMax,
     termDays, minAmount, startDate, principalSecured, status, reliability, dataDate,
     sourceName, sourceUrl, isSample, updatedAt, dedupeKey)
  VALUES
    (@bank, @category, @name, @code, @riskLevel, @yieldType, @yieldMin, @yieldMax,
     @termDays, @minAmount, @startDate, @principalSecured, @status, @reliability, @dataDate,
     @sourceName, @sourceUrl, @isSample, @updatedAt, @dedupeKey)
  ON CONFLICT(dedupeKey) DO UPDATE SET
    category=excluded.category, name=excluded.name, riskLevel=excluded.riskLevel,
    yieldType=excluded.yieldType, yieldMin=excluded.yieldMin, yieldMax=excluded.yieldMax,
    termDays=excluded.termDays, minAmount=excluded.minAmount, startDate=excluded.startDate,
    principalSecured=excluded.principalSecured, status=excluded.status,
    reliability=excluded.reliability, dataDate=excluded.dataDate, sourceName=excluded.sourceName,
    sourceUrl=excluded.sourceUrl, isSample=excluded.isSample, updatedAt=excluded.updatedAt
`);

/**
 * 批量写入/更新（按 dedupeKey 去重）。
 * 单条写入异常会被捕获并跳过，不影响其余数据，避免一条脏数据中断整批入库。
 * 返回成功写入的条数。
 */
export function upsertProducts(items: RawProduct[]): number {
  const now = new Date().toISOString();
  let ok = 0;
  const tx = db.transaction((rows: RawProduct[]) => {
    for (const r of rows) {
      try {
        upsertStmt.run({ ...r, updatedAt: now, dedupeKey: dedupeKey(r) });
        ok++;
      } catch (err) {
        console.warn(`[repo] 跳过写入失败的数据「${r?.name ?? '未知'}」：${(err as Error).message}`);
      }
    }
  });
  tx(items);
  return ok;
}

/** 删除全部示例数据（isSample=1），避免示例 code 变更后残留旧行 */
export function deleteSamples(): number {
  const info = db.prepare('DELETE FROM products WHERE isSample = 1').run();
  return info.changes;
}

/** 删除全部真实数据（isSample=0），用于每轮抓取前全量刷新，避免下架/改版残留 */
export function deleteRealData(): number {
  const info = db.prepare('DELETE FROM products WHERE isSample = 0').run();
  return info.changes;
}

export interface QueryParams {
  bank?: Bank;
  category?: Category;
  riskLevel?: RiskLevel;
  stableOnly?: boolean; // 仅「稳健」：存款保险 + R1 + R2
  availableOnly?: boolean; // 仅在售
  minTerm?: number;
  maxTerm?: number;
  sort?: 'score' | 'yield' | 'risk' | 'term';
  limit?: number;
}

const STABLE_RISKS: RiskLevel[] = ['存款保险', 'R1', 'R2'];

export function queryProducts(params: QueryParams): ScoredProduct[] {
  const where: string[] = [];
  const args: unknown[] = [];

  if (params.bank) {
    where.push('bank = ?');
    args.push(params.bank);
  }
  if (params.category) {
    where.push('category = ?');
    args.push(params.category);
  }
  if (params.riskLevel) {
    where.push('riskLevel = ?');
    args.push(params.riskLevel);
  }
  if (params.stableOnly) {
    where.push(`riskLevel IN (${STABLE_RISKS.map(() => '?').join(',')})`);
    args.push(...STABLE_RISKS);
  }
  if (params.availableOnly) {
    where.push("status = '在售'");
  }
  if (typeof params.minTerm === 'number') {
    where.push('termDays >= ?');
    args.push(params.minTerm);
  }
  if (typeof params.maxTerm === 'number') {
    where.push('termDays <= ?');
    args.push(params.maxTerm);
  }

  const sql = `SELECT * FROM products ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
  const rows = db.prepare(sql).all(...args) as Product[];

  // 打分需要全集做归一化，这里对筛选结果集打分
  let scored = scoreProducts(rows);

  // 各排序键的「同档」比较函数
  let cmp: (a: ScoredProduct, b: ScoredProduct) => number;
  switch (params.sort) {
    case 'yield':
      cmp = (a, b) => (b.yieldMin + b.yieldMax) / 2 - (a.yieldMin + a.yieldMax) / 2;
      break;
    case 'term':
      cmp = (a, b) => a.termDays - b.termDays;
      break;
    case 'risk':
    case 'score':
    default:
      cmp = (a, b) => b.score - a.score; // 稳健优先已含在 score 中
  }

  // 在售优先：当前能买到的排前面，不可买的统一靠后；同组内按所选排序键
  scored.sort((a, b) => {
    const av = isAvailable(a.status) ? 0 : 1;
    const bv = isAvailable(b.status) ? 0 : 1;
    if (av !== bv) return av - bv;
    return cmp(a, b);
  });

  if (params.limit && params.limit > 0) scored = scored.slice(0, params.limit);
  return scored;
}

export function getProductById(id: number): ScoredProduct | undefined {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Product | undefined;
  if (!row) return undefined;
  return scoreProducts([row])[0];
}

export interface MetaInfo {
  banks: Bank[];
  categories: Category[];
  riskLevels: RiskLevel[];
  total: number;
  sampleCount: number;
  lastUpdated: string | null;
}

export interface RateCell {
  yieldMin: number;
  yieldMax: number;
  status: string; // 在售状态
}

export interface RateRow {
  bank: Bank;
  rates: Record<number, RateCell>; // key 为期限天数
  isSample: 0 | 1;
  reliability: Reliability; // 数据可靠等级
  dataDate: string | null; // 数据日期
  sourceName: string;
}

export interface RateMatrix {
  terms: number[]; // 列：期限（天）升序
  rows: RateRow[]; // 行：按银行
  updatedAt: string | null;
}

/** 按类型（定期存款 / 大额存单）汇总「银行 × 期限」利率矩阵 */
export function getRateMatrix(category: Category): RateMatrix {
  const rows = db
    .prepare('SELECT * FROM products WHERE category = ? ORDER BY bank, termDays')
    .all(category) as Product[];

  const termSet = new Set<number>();
  const byBank = new Map<Bank, RateRow>();

  for (const p of rows) {
    termSet.add(p.termDays);
    let row = byBank.get(p.bank);
    if (!row) {
      row = {
        bank: p.bank,
        rates: {},
        isSample: p.isSample,
        reliability: p.reliability,
        dataDate: p.dataDate,
        sourceName: p.sourceName,
      };
      byBank.set(p.bank, row);
    }
    row.rates[p.termDays] = { yieldMin: p.yieldMin, yieldMax: p.yieldMax, status: p.status };
  }

  const last = db
    .prepare('SELECT MAX(updatedAt) m FROM products WHERE category = ?')
    .get(category) as { m: string | null };

  return {
    terms: [...termSet].sort((a, b) => a - b),
    rows: [...byBank.values()],
    updatedAt: last.m,
  };
}

export function getMeta(): MetaInfo {
  const total = (db.prepare('SELECT COUNT(*) c FROM products').get() as { c: number }).c;
  const sampleCount = (
    db.prepare('SELECT COUNT(*) c FROM products WHERE isSample = 1').get() as { c: number }
  ).c;
  const last = db.prepare('SELECT MAX(updatedAt) m FROM products').get() as { m: string | null };
  return {
    banks: [...new Set((db.prepare('SELECT DISTINCT bank FROM products').all() as { bank: Bank }[]).map((r) => r.bank))],
    categories: [...new Set((db.prepare('SELECT DISTINCT category FROM products').all() as { category: Category }[]).map((r) => r.category))],
    riskLevels: [...new Set((db.prepare('SELECT DISTINCT riskLevel FROM products').all() as { riskLevel: RiskLevel }[]).map((r) => r.riskLevel))],
    total,
    sampleCount,
    lastUpdated: last.m,
  };
}
