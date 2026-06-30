import type { Product, RiskLevel } from './types.js';

// 稳健分：风险等级越低越高（满足「不用天天担心」）
const RISK_SCORE: Record<RiskLevel, number> = {
  存款保险: 1.0,
  R1: 0.9,
  R2: 0.7,
  R3: 0.4,
  R4: 0.2,
  R5: 0.0,
};

/** 期限分档，用于同档内收益归一化（短期与长期收益不可直接比） */
function termBucket(termDays: number): string {
  if (termDays <= 0) return '活期';
  if (termDays <= 90) return '0-3月';
  if (termDays <= 180) return '3-6月';
  if (termDays <= 365) return '6-12月';
  if (termDays <= 730) return '1-2年';
  return '2年以上';
}

export interface ScoredProduct extends Product {
  score: number;
}

/**
 * 推荐打分：收益(0.6) + 稳健(0.3) + 新鲜度(0.1)。
 * 收益分在「同期限档」内做 min-max 归一化。
 */
export function scoreProducts(products: Product[]): ScoredProduct[] {
  const buckets = new Map<string, { min: number; max: number }>();
  for (const p of products) {
    const b = termBucket(p.termDays);
    const y = (p.yieldMin + p.yieldMax) / 2;
    const cur = buckets.get(b);
    if (!cur) buckets.set(b, { min: y, max: y });
    else buckets.set(b, { min: Math.min(cur.min, y), max: Math.max(cur.max, y) });
  }

  const now = Date.now();
  return products.map((p) => {
    const b = termBucket(p.termDays);
    const range = buckets.get(b)!;
    const y = (p.yieldMin + p.yieldMax) / 2;
    let yieldScore = range.max === range.min ? 1 : (y - range.min) / (range.max - range.min);
    if (!Number.isFinite(yieldScore)) yieldScore = 0;

    const riskScore = RISK_SCORE[p.riskLevel] ?? 0;

    // 新鲜度以「数据日期」为准（无则用入库时间）；按 3 年线性衰减
    const dt = p.dataDate ? new Date(p.dataDate).getTime() : new Date(p.updatedAt).getTime();
    const ageDays = Number.isFinite(dt) ? (now - dt) / 86_400_000 : 365;
    const freshScore = Math.max(0, Math.min(1, 1 - ageDays / 1095));

    let score = 0.6 * yieldScore + 0.3 * riskScore + 0.1 * freshScore;
    // 数据明显过时（>2 年）整体降权，避免陈旧高息污染推荐
    if (ageDays > 730) score *= 0.6;
    if (!Number.isFinite(score)) score = 0;
    return { ...p, score: Math.round(score * 1000) / 1000 };
  });
}
