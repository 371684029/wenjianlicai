import type { RawProduct, Bank, Category, RiskLevel, YieldType } from '../types.js';

// 说明：以下为「示例/参考」数据（isSample=1），用于平台端到端演示与排序验证。
// 数据为基于公开渠道整理的代表性结构示例，具体收益/期限请以各银行官方为准。

interface Seed {
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

const SEEDS: Seed[] = [
  // 平安
  { bank: '平安', category: '定期存款', name: '平安银行 整存整取 1年', code: 'PA-DEP-1Y', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.55, yieldMax: 1.55, termDays: 365, minAmount: 50 },
  { bank: '平安', category: '大额存单', name: '平安银行 大额存单 2年', code: 'PA-CD-2Y', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.9, yieldMax: 1.9, termDays: 730, minAmount: 200000 },
  { bank: '平安', category: '定期理财', name: '平安理财 启航90天 稳健', code: 'PA-LC-90D', riskLevel: 'R2', yieldType: '业绩比较基准', yieldMin: 2.4, yieldMax: 2.8, termDays: 90, minAmount: 10000 },
  { bank: '平安', category: '活期理财', name: '平安理财 天天成长 现金管理', code: 'PA-LC-CASH', riskLevel: 'R1', yieldType: '7日年化', yieldMin: 1.6, yieldMax: 1.8, termDays: 0, minAmount: 1 },

  // 招商
  { bank: '招商', category: '定期存款', name: '招商银行 整存整取 1年', code: 'CMB-DEP-1Y', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.5, yieldMax: 1.5, termDays: 365, minAmount: 50 },
  { bank: '招商', category: '大额存单', name: '招商银行 大额存单 3年', code: 'CMB-CD-3Y', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 2.0, yieldMax: 2.0, termDays: 1095, minAmount: 200000 },
  { bank: '招商', category: '定期理财', name: '招银理财 招睿稳健 180天', code: 'CMB-LC-180D', riskLevel: 'R2', yieldType: '业绩比较基准', yieldMin: 2.6, yieldMax: 3.0, termDays: 180, minAmount: 10000 },
  { bank: '招商', category: '活期理财', name: '招银理财 朝朝宝 现金管理', code: 'CMB-LC-CASH', riskLevel: 'R1', yieldType: '7日年化', yieldMin: 1.5, yieldMax: 1.7, termDays: 0, minAmount: 1 },

  // 建设
  { bank: '建设', category: '定期存款', name: '建设银行 整存整取 1年', code: 'CCB-DEP-1Y', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.45, yieldMax: 1.45, termDays: 365, minAmount: 50 },
  { bank: '建设', category: '大额存单', name: '建设银行 大额存单 2年', code: 'CCB-CD-2Y', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.85, yieldMax: 1.85, termDays: 730, minAmount: 200000 },
  { bank: '建设', category: '定期理财', name: '建信理财 龙鑫稳健 1年', code: 'CCB-LC-1Y', riskLevel: 'R2', yieldType: '业绩比较基准', yieldMin: 2.5, yieldMax: 2.9, termDays: 365, minAmount: 10000 },

  // 网商
  { bank: '网商', category: '定期存款', name: '网商银行 定期存款 1年', code: 'MYB-DEP-1Y', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.7, yieldMax: 1.7, termDays: 365, minAmount: 50 },
  { bank: '网商', category: '大额存单', name: '网商银行 大额存单 3年', code: 'MYB-CD-3Y', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 2.6, yieldMax: 2.6, termDays: 1095, minAmount: 200000 },
  { bank: '网商', category: '活期理财', name: '网商银行 余利宝 现金管理', code: 'MYB-LC-CASH', riskLevel: 'R1', yieldType: '7日年化', yieldMin: 1.4, yieldMax: 1.6, termDays: 0, minAmount: 1 },

  // 微众
  { bank: '微众', category: '定期存款', name: '微众银行 定期存款 1年', code: 'WEB-DEP-1Y', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 1.75, yieldMax: 1.75, termDays: 365, minAmount: 50 },
  { bank: '微众', category: '大额存单', name: '微众银行 大额存单 3年', code: 'WEB-CD-3Y', riskLevel: '存款保险', yieldType: '存款利率', yieldMin: 2.65, yieldMax: 2.65, termDays: 1095, minAmount: 200000 },
  { bank: '微众', category: '活期理财', name: '微众银行 活期+ 现金管理', code: 'WEB-LC-CASH', riskLevel: 'R1', yieldType: '7日年化', yieldMin: 1.5, yieldMax: 1.7, termDays: 0, minAmount: 1 },
];

export function getSampleProducts(): RawProduct[] {
  const startDate = new Date().toISOString().slice(0, 10);
  return SEEDS.map((s) => ({
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
    principalSecured: s.category === '定期存款' || s.category === '大额存单' ? 1 : 0,
    sourceName: '示例数据',
    sourceUrl: null,
    isSample: 1,
  }));
}
