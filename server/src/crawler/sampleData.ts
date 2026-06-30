import type { RawProduct, Bank, Category, RiskLevel, YieldType, Status } from '../types.js';

// 说明：以下为「示例/参考」数据（isSample=1），用于平台端到端演示与排序验证。
// 数据为基于公开渠道整理的代表性结构示例，具体收益/期限请以各银行官方为准。

// 期限（天）：1年/2年/3年/5年
export const DEPOSIT_TERMS = [365, 730, 1095, 1825] as const;
// 大额存单常见期限：1年/2年/3年
export const CD_TERMS = [365, 730, 1095] as const;

export const TERM_LABEL: Record<number, string> = {
  365: '1年',
  730: '2年',
  1095: '3年',
  1825: '5年',
};

const BANK_CODE: Record<Bank, string> = {
  平安: 'PA',
  招商: 'CMB',
  建设: 'CCB',
  网商: 'MYB',
  微众: 'WEB',
};

// 整存整取定期存款利率（年化%，示例）。50 元起存。
const DEPOSIT_RATES: Record<Bank, Record<number, number>> = {
  平安: { 365: 1.55, 730: 1.65, 1095: 1.95, 1825: 2.0 },
  招商: { 365: 1.5, 730: 1.6, 1095: 1.9, 1825: 1.95 },
  建设: { 365: 1.45, 730: 1.55, 1095: 1.85, 1825: 1.9 },
  网商: { 365: 1.7, 730: 1.85, 1095: 2.15, 1825: 2.2 },
  微众: { 365: 1.75, 730: 1.9, 1095: 2.2, 1825: 2.25 },
};

// 大额存单利率（年化%，示例）。20 万元起购。
const CD_RATES: Record<Bank, Record<number, number>> = {
  平安: { 365: 1.7, 730: 1.9, 1095: 2.1 },
  招商: { 365: 1.65, 730: 1.85, 1095: 2.0 },
  建设: { 365: 1.6, 730: 1.8, 1095: 2.0 },
  网商: { 365: 1.9, 730: 2.2, 1095: 2.6 },
  微众: { 365: 1.95, 730: 2.25, 1095: 2.65 },
};

// 理财 / 活期理财产品（示例），用于推荐榜单与列表
interface LicaiSeed {
  bank: Bank;
  category: Category;
  name: string;
  code: string;
  riskLevel: RiskLevel;
  yieldType: YieldType;
  yieldMin: number;
  yieldMax: number;
  termDays: number;
  minAmount: number;
}

const LICAI_SEEDS: LicaiSeed[] = [
  { bank: '平安', category: '定期理财', name: '平安理财 启航90天 稳健', code: 'PA-LC-90D', riskLevel: 'R2', yieldType: '业绩比较基准', yieldMin: 2.4, yieldMax: 2.8, termDays: 90, minAmount: 10000 },
  { bank: '平安', category: '活期理财', name: '平安理财 天天成长 现金管理', code: 'PA-LC-CASH', riskLevel: 'R1', yieldType: '7日年化', yieldMin: 1.6, yieldMax: 1.8, termDays: 0, minAmount: 1 },
  { bank: '招商', category: '定期理财', name: '招银理财 招睿稳健 180天', code: 'CMB-LC-180D', riskLevel: 'R2', yieldType: '业绩比较基准', yieldMin: 2.6, yieldMax: 3.0, termDays: 180, minAmount: 10000 },
  { bank: '招商', category: '活期理财', name: '招银理财 朝朝宝 现金管理', code: 'CMB-LC-CASH', riskLevel: 'R1', yieldType: '7日年化', yieldMin: 1.5, yieldMax: 1.7, termDays: 0, minAmount: 1 },
  { bank: '建设', category: '定期理财', name: '建信理财 龙鑫稳健 1年', code: 'CCB-LC-1Y', riskLevel: 'R2', yieldType: '业绩比较基准', yieldMin: 2.5, yieldMax: 2.9, termDays: 365, minAmount: 10000 },
  { bank: '网商', category: '活期理财', name: '网商银行 余利宝 现金管理', code: 'MYB-LC-CASH', riskLevel: 'R1', yieldType: '7日年化', yieldMin: 1.4, yieldMax: 1.6, termDays: 0, minAmount: 1 },
  { bank: '微众', category: '活期理财', name: '微众银行 活期+ 现金管理', code: 'WEB-LC-CASH', riskLevel: 'R1', yieldType: '7日年化', yieldMin: 1.5, yieldMax: 1.7, termDays: 0, minAmount: 1 },
];

const BANKS_ORDER: Bank[] = ['平安', '招商', '建设', '网商', '微众'];

// 示例：用于演示「不可买」状态的产品（按产品 code 标注）
const SOLD_OUT = new Set(['PA-CD-1095', 'CCB-CD-730']); // 售罄（额度有限）
const COMING_SOON = new Set(['CMB-CD-1095']); // 待售（即将发售）
const DELISTED = new Set(['PA-LC-90D']); // 已下架（停售）

function statusOf(code: string): Status {
  if (SOLD_OUT.has(code)) return '售罄';
  if (COMING_SOON.has(code)) return '待售';
  if (DELISTED.has(code)) return '已下架';
  return '在售';
}

export function getSampleProducts(): RawProduct[] {
  const startDate = new Date().toISOString().slice(0, 10);
  const out: RawProduct[] = [];

  // 整存整取定期存款：每家银行 1/2/3/5 年
  for (const bank of BANKS_ORDER) {
    for (const term of DEPOSIT_TERMS) {
      const rate = DEPOSIT_RATES[bank][term];
      const code = `${BANK_CODE[bank]}-DEP-${term}`;
      out.push({
        bank,
        category: '定期存款',
        name: `${bank}银行 整存整取 ${TERM_LABEL[term]}`,
        code,
        riskLevel: '存款保险',
        yieldType: '存款利率',
        yieldMin: rate,
        yieldMax: rate,
        termDays: term,
        minAmount: 50,
        startDate,
        principalSecured: 1,
        status: statusOf(code),
        reliability: '低',
        dataDate: startDate,
        sourceName: '示例数据',
        sourceUrl: null,
        isSample: 1,
      });
    }
  }

  // 大额存单：每家银行 1/2/3 年
  for (const bank of BANKS_ORDER) {
    for (const term of CD_TERMS) {
      const rate = CD_RATES[bank][term];
      const code = `${BANK_CODE[bank]}-CD-${term}`;
      out.push({
        bank,
        category: '大额存单',
        name: `${bank}银行 大额存单 ${TERM_LABEL[term]}`,
        code,
        riskLevel: '存款保险',
        yieldType: '存款利率',
        yieldMin: rate,
        yieldMax: rate,
        termDays: term,
        minAmount: 200000,
        startDate,
        principalSecured: 1,
        status: statusOf(code),
        reliability: '低',
        dataDate: startDate,
        sourceName: '示例数据',
        sourceUrl: null,
        isSample: 1,
      });
    }
  }

  // 理财 / 活期理财
  for (const s of LICAI_SEEDS) {
    out.push({
      bank: s.bank,
      category: s.category,
      name: s.name,
      code: s.code,
      riskLevel: s.riskLevel,
      yieldType: s.yieldType,
      yieldMin: s.yieldMin,
      yieldMax: s.yieldMax,
      termDays: s.termDays,
      minAmount: s.minAmount,
      startDate,
      principalSecured: 0,
      status: statusOf(s.code),
      reliability: '低',
      dataDate: startDate,
      sourceName: '示例数据',
      sourceUrl: null,
      isSample: 1,
    });
  }

  return out;
}
