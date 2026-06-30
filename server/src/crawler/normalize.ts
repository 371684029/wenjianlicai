import {
  BANKS,
  CATEGORIES,
  RISK_LEVELS,
  YIELD_TYPES,
  STATUSES,
  RELIABILITY_LEVELS,
  type RawProduct,
  type Bank,
  type Category,
  type RiskLevel,
  type YieldType,
  type Status,
  type Reliability,
} from '../types.js';

function toFiniteNumber(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function cleanStr(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length > 0 ? s : null;
}

/**
 * 数据清洗/校验：把适配器产出的原始数据规整为合法 RawProduct。
 * - 必填项非法（银行/类型/风险/名称/收益/期限）→ 丢弃该条并告警；
 * - 可修正项非法（状态/可靠等级/数值范围/枚举）→ 用安全默认值修正；
 * 目的：单条脏数据不会导致整个抓取脚本崩溃中断。
 */
export function sanitizeProducts(raw: RawProduct[]): RawProduct[] {
  const out: RawProduct[] = [];
  let dropped = 0;

  for (const r of raw) {
    const reason: string[] = [];

    const bank = r.bank;
    if (!BANKS.includes(bank as Bank)) reason.push('bank');

    const category = r.category;
    if (!CATEGORIES.includes(category as Category)) reason.push('category');

    const riskLevel = r.riskLevel;
    if (!RISK_LEVELS.includes(riskLevel as RiskLevel)) reason.push('riskLevel');

    const name = cleanStr(r.name);
    if (!name) reason.push('name');

    let yMin = toFiniteNumber(r.yieldMin);
    let yMax = toFiniteNumber(r.yieldMax);
    if (yMin === null && yMax !== null) yMin = yMax;
    if (yMax === null && yMin !== null) yMax = yMin;
    if (yMin === null || yMax === null) reason.push('yield');

    const term = toFiniteNumber(r.termDays);
    if (term === null || term < 0) reason.push('termDays');

    if (reason.length > 0) {
      dropped++;
      console.warn(
        `[normalize] 丢弃异常数据(${reason.join(',')}): ${cleanStr(r.name) ?? '(无名称)'} @ ${String(r.bank)}`,
      );
      continue;
    }

    // 数值范围修正：收益非负、min<=max
    let lo = Math.max(0, yMin as number);
    let hi = Math.max(0, yMax as number);
    if (lo > hi) [lo, hi] = [hi, lo];

    const minAmount = toFiniteNumber(r.minAmount);
    const yieldType = YIELD_TYPES.includes(r.yieldType as YieldType)
      ? (r.yieldType as YieldType)
      : '存款利率';
    const status = STATUSES.includes(r.status as Status) ? (r.status as Status) : '在售';
    const reliability = RELIABILITY_LEVELS.includes(r.reliability as Reliability)
      ? (r.reliability as Reliability)
      : '低';

    out.push({
      bank: bank as Bank,
      category: category as Category,
      name: name as string,
      code: cleanStr(r.code),
      riskLevel: riskLevel as RiskLevel,
      yieldType,
      yieldMin: lo,
      yieldMax: hi,
      termDays: Math.round(term as number),
      minAmount: minAmount !== null && minAmount >= 0 ? minAmount : 0,
      startDate: cleanStr(r.startDate),
      principalSecured: r.principalSecured === 1 ? 1 : 0,
      status,
      reliability,
      dataDate: cleanStr(r.dataDate),
      sourceName: cleanStr(r.sourceName) ?? '未知来源',
      sourceUrl: cleanStr(r.sourceUrl),
      isSample: r.isSample === 1 ? 1 : 0,
    });
  }

  if (dropped > 0) console.warn(`[normalize] 共丢弃 ${dropped} 条异常数据，保留 ${out.length} 条。`);
  return out;
}
